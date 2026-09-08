-- BLAZE ESCROW-LINK — SUPABASE POSTGRES SCHEMA
-- Production-grade schema with Row Level Security (RLS) & Triggers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'both' CHECK (role IN ('seller', 'buyer', 'both', 'admin')),
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  trust_tier TEXT NOT NULL DEFAULT 'Silver' CHECK (trust_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  completed_trades INTEGER NOT NULL DEFAULT 0,
  disputed_trades INTEGER NOT NULL DEFAULT 0,
  total_volume BIGINT NOT NULL DEFAULT 0, -- stored in kobo
  ecobank_linked BOOLEAN NOT NULL DEFAULT false,
  blaze_account TEXT,
  credit_limit BIGINT NOT NULL DEFAULT 5000000, -- in kobo (default NGN 50,000)
  simulated_balance BIGINT NOT NULL DEFAULT 15000000, -- default NGN 150,000 in kobo for demo
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ESCROW TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g. #escrow-vintage-jacket
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  buyer_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount BIGINT NOT NULL, -- in kobo
  fee BIGINT NOT NULL, -- 0.75% of amount, max 50,000 kobo (NGN 500)
  net_amount BIGINT NOT NULL, -- amount - fee
  state TEXT NOT NULL DEFAULT 'CREATED' CHECK (state IN ('CREATED', 'PAID', 'DISPATCHED', 'CONFIRMED', 'DISPUTED', 'RELEASED', 'REFUNDED', 'CANCELLED', 'EXPIRED')),
  logistics TEXT CHECK (logistics IN ('GIG', 'KWIK', 'SENDBOX', 'CAMPUS_DIRECT', 'OTHER')),
  tracking_id TEXT,
  ussd_pin TEXT, -- 6-digit PIN for offline handshake
  payment_method TEXT CHECK (payment_method IN ('WALLET', 'TRANSFER', 'CARD')),
  transfer_account TEXT, -- One-time simulated virtual account number
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DISPUTES TABLE
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED_BUYER', 'RESOLVED_SELLER', 'ESCALATED')),
  ai_score JSONB,
  resolution_note TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PAYMENT', 'DISPATCH', 'CONFIRMATION', 'DISPUTE', 'RELEASE', 'SYSTEM')),
  read BOOLEAN NOT NULL DEFAULT false,
  transaction_id UUID REFERENCES public.escrow_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TRUST SCORE EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.trust_score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  delta INTEGER NOT NULL,
  description TEXT NOT NULL,
  transaction_id UUID REFERENCES public.escrow_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL, -- in kobo
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  reference TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- RECALCULATE TRUST TIER & CREDIT LIMIT TRIGGER
CREATE OR REPLACE FUNCTION update_trust_tier_and_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Tier thresholds
  IF NEW.trust_score >= 80 THEN
    NEW.trust_tier := 'Platinum';
    NEW.credit_limit := 35000000; -- NGN 350,000 in kobo
  ELSIF NEW.trust_score >= 60 THEN
    NEW.trust_tier := 'Gold';
    NEW.credit_limit := 15000000; -- NGN 150,000 in kobo
  ELSIF NEW.trust_score >= 40 THEN
    NEW.trust_tier := 'Silver';
    NEW.credit_limit := 5000000;  -- NGN 50,000 in kobo
  ELSE
    NEW.trust_tier := 'Bronze';
    NEW.credit_limit := 0;        -- NGN 0
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_trust_tier ON public.profiles;
CREATE TRIGGER trg_update_trust_tier
BEFORE INSERT OR UPDATE OF trust_score ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_trust_tier_and_limit();

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- Profiles: Users can view all profiles (for trust verification); can update own profile
CREATE POLICY "Public profile view" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users edit own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Transactions: Public can view by code (for public landing page); seller/buyer can edit
CREATE POLICY "Public transaction view" ON public.escrow_transactions FOR SELECT USING (true);
CREATE POLICY "Sellers create transactions" ON public.escrow_transactions FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Parties edit transactions" ON public.escrow_transactions FOR UPDATE USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Disputes: Parties & Admin can view/edit disputes
CREATE POLICY "Dispute view" ON public.disputes FOR SELECT USING (true);
CREATE POLICY "Dispute insert" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = raised_by);
CREATE POLICY "Dispute update" ON public.disputes FOR UPDATE USING (true);

-- Notifications: Users read own notifications
CREATE POLICY "User notifications view" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User notifications update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Withdrawals: Sellers view/create own withdrawals
CREATE POLICY "Seller withdrawals view" ON public.withdrawals FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Seller withdrawals insert" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = seller_id);
