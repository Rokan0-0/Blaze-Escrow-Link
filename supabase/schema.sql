-- BLAZE ESCROW-LINK — SUPABASE POSTGRES SCHEMA (v2)
-- Uses TEXT primary keys so we can use custom IDs without Supabase Auth UUIDs
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Drop existing tables if re-running (safe for fresh setup)
DROP TABLE IF EXISTS public.withdrawals CASCADE;
DROP TABLE IF EXISTS public.trust_score_events CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.disputes CASCADE;
DROP TABLE IF EXISTS public.escrow_transactions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS update_trust_tier_and_limit() CASCADE;

-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY,                -- e.g. usr_seller_amina_01 or usr_<timestamp>_<rand>
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'both' CHECK (role IN ('seller', 'buyer', 'both', 'admin')),
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  trust_tier TEXT NOT NULL DEFAULT 'Silver' CHECK (trust_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  completed_trades INTEGER NOT NULL DEFAULT 0,
  disputed_trades INTEGER NOT NULL DEFAULT 0,
  total_volume BIGINT NOT NULL DEFAULT 0,       -- stored in kobo
  ecobank_linked BOOLEAN NOT NULL DEFAULT false,
  blaze_account TEXT,
  credit_limit BIGINT NOT NULL DEFAULT 5000000, -- kobo (NGN 50,000 default)
  simulated_balance BIGINT NOT NULL DEFAULT 15000000, -- kobo (NGN 150,000 default)
  flagged BOOLEAN DEFAULT false,
  flagged_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ESCROW TRANSACTIONS TABLE
CREATE TABLE public.escrow_transactions (
  id TEXT PRIMARY KEY,                -- tx_<timestamp>_<rand>
  code TEXT UNIQUE NOT NULL,          -- e.g. #escrow-vintage-denim-99a2
  seller_id TEXT NOT NULL REFERENCES public.profiles(id),
  buyer_id TEXT REFERENCES public.profiles(id),
  seller_name TEXT,
  buyer_name TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Fashion & Apparel',
  amount BIGINT NOT NULL,             -- kobo
  fee BIGINT NOT NULL,                -- kobo
  net_amount BIGINT NOT NULL,         -- kobo
  state TEXT NOT NULL DEFAULT 'CREATED' CHECK (state IN (
    'CREATED', 'PAID', 'DISPATCHED', 'CONFIRMED',
    'DISPUTED', 'RELEASED', 'REFUNDED', 'CANCELLED', 'EXPIRED',
    'AWAITING_RETURN', 'RETURN_DISPATCHED', 'RETURN_CONFIRMED',
    'PARTIAL_REFUND', 'DAMAGE_CLAIMED'
  )),
  logistics TEXT CHECK (logistics IN ('GIG','KWIK','SENDBOX','CAMPUS_DIRECT','OTHER')),
  tracking_id TEXT,
  ussd_pin TEXT,
  payment_method TEXT CHECK (payment_method IN ('WALLET','TRANSFER','CARD')),
  transfer_account TEXT,
  partial_buyer_amount BIGINT,
  partial_seller_amount BIGINT,
  return_tracking_id TEXT,
  return_logistics TEXT,
  return_dispatched_at TIMESTAMPTZ,
  return_confirmed_at TIMESTAMPTZ,
  return_proof_urls TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DISPUTES TABLE
CREATE TABLE public.disputes (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  raised_by TEXT NOT NULL REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN (
    'OPEN','UNDER_REVIEW','RESOLVED_BUYER','RESOLVED_SELLER','ESCALATED'
  )),
  ai_score JSONB,
  seller_acceptance TEXT CHECK (seller_acceptance IN ('NO_RETURN', 'RETURN_REQUIRED', 'CONTESTED', NULL)),
  seller_response TEXT,
  seller_evidence_urls TEXT[] DEFAULT '{}',
  seller_responded_at TIMESTAMPTZ,
  resolution_path TEXT CHECK (resolution_path IN ('NO_RETURN', 'RETURN_REQUIRED', 'PARTIAL', 'DAMAGE_CLAIMED', NULL)),
  partial_buyer_pct INTEGER,
  damage_claim_urls TEXT[] DEFAULT '{}',
  damage_claim_note TEXT,
  damage_claimed_at TIMESTAMPTZ,
  resolution_note TEXT,
  resolved_by TEXT REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 3.1 DISPUTE MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id TEXT PRIMARY KEY,
  dispute_id TEXT NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public.profiles(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('buyer', 'seller', 'admin')),
  message TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PAYMENT','DISPATCH','CONFIRMATION','DISPUTE','RELEASE','SYSTEM')),
  read BOOLEAN NOT NULL DEFAULT false,
  transaction_id TEXT REFERENCES public.escrow_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TRUST SCORE EVENTS TABLE
CREATE TABLE public.trust_score_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  delta INTEGER NOT NULL,
  description TEXT NOT NULL,
  transaction_id TEXT REFERENCES public.escrow_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. WITHDRAWALS TABLE
CREATE TABLE public.withdrawals (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,             -- kobo
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED')),
  reference TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- AUTO TRUST TIER TRIGGER
CREATE OR REPLACE FUNCTION update_trust_tier_and_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trust_score >= 80 THEN
    NEW.trust_tier := 'Platinum';
    NEW.credit_limit := 35000000;
  ELSIF NEW.trust_score >= 60 THEN
    NEW.trust_tier := 'Gold';
    NEW.credit_limit := 15000000;
  ELSIF NEW.trust_score >= 40 THEN
    NEW.trust_tier := 'Silver';
    NEW.credit_limit := 5000000;
  ELSE
    NEW.trust_tier := 'Bronze';
    NEW.credit_limit := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_trust_tier ON public.profiles;
CREATE TRIGGER trg_update_trust_tier
  BEFORE INSERT OR UPDATE OF trust_score ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_trust_tier_and_limit();

-- DISABLE RLS (we use service role key server-side so RLS would block us)
-- In production you would enable RLS and use proper Supabase Auth
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_score_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals DISABLE ROW LEVEL SECURITY;

-- 7. SUPABASE STORAGE BUCKET FOR PRODUCT IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public Storage Access Policies for product-images bucket
DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
CREATE POLICY "Public Read Product Images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Upload Product Images" ON storage.objects;
CREATE POLICY "Public Upload Product Images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');
