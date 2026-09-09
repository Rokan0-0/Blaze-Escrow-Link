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
    'CREATED','PAID','DISPATCHED','CONFIRMED','DISPUTED','RELEASED','REFUNDED','CANCELLED','EXPIRED'
  )),
  logistics TEXT CHECK (logistics IN ('GIG','KWIK','SENDBOX','CAMPUS_DIRECT','OTHER')),
  tracking_id TEXT,
  ussd_pin TEXT,
  payment_method TEXT CHECK (payment_method IN ('WALLET','TRANSFER','CARD')),
  transfer_account TEXT,
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
  resolution_note TEXT,
  resolved_by TEXT REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
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
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_score_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals DISABLE ROW LEVEL SECURITY;
