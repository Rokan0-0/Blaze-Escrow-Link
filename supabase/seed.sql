-- BLAZE ESCROW — SEED DATA
-- Run this AFTER schema.sql in Supabase SQL Editor
-- Inserts Amina (seller), Tunde (buyer), Admin, 3 seed transactions, 1 dispute, 3 notifications

-- PROFILES
INSERT INTO public.profiles (id, phone, full_name, role, trust_score, trust_tier, completed_trades, disputed_trades, total_volume, ecobank_linked, blaze_account, credit_limit, simulated_balance, created_at)
VALUES
  ('usr_seller_amina_01', '+2348000000001', 'Amina Bello', 'seller', 72, 'Gold', 14, 0, 45000000, true, '30987654321', 15000000, 18500000, NOW() - INTERVAL '90 days'),
  ('usr_buyer_tunde_02',  '+2348000000002', 'Tunde Bakare', 'buyer', 65, 'Gold', 5, 1, 12700000, false, NULL, 15000000, 21100000, NOW() - INTERVAL '30 days'),
  ('usr_admin_blaze_03',  '+2348000000003', 'Blaze Admin', 'admin', 100, 'Platinum', 0, 0, 0, false, NULL, 35000000, 0, NOW() - INTERVAL '180 days')
ON CONFLICT (id) DO NOTHING;

-- SEED TRANSACTIONS
INSERT INTO public.escrow_transactions (id, code, seller_id, buyer_id, seller_name, buyer_name, title, description, category, amount, fee, net_amount, state, logistics, transfer_account, tracking_id, ussd_pin, payment_method, expires_at, dispatched_at, created_at, updated_at)
VALUES
  (
    'tx_vintage_jacket_01',
    '#escrow-vintage-denim-99a2',
    'usr_seller_amina_01', NULL,
    'Amina Bello', NULL,
    'Vintage Denim Jacket (Thrifted, Size M)',
    'Authentic vintage Levi''s denim jacket, size M, excellent condition. Minor fade adds character.',
    'Fashion & Apparel',
    1850000, 13875, 1836125,
    'CREATED', 'CAMPUS_DIRECT',
    '99201948107',
    NULL, NULL, NULL,
    NOW() + INTERVAL '48 hours',
    NULL,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'tx_airpods_pro_02',
    '#escrow-airpods-pro-gen2-7b1c',
    'usr_seller_amina_01', 'usr_buyer_tunde_02',
    'Amina Bello', 'Tunde Bakare',
    'Apple AirPods Pro (2nd Gen) — Sealed Box',
    'Brand new sealed AirPods Pro Gen 2. Apple warranty intact. IMEI verified.',
    'Electronics & Gadgets',
    8500000, 50000, 8450000,
    'DISPATCHED', 'KWIK',
    '99208843921',
    'KWK-NG-8849102', '*329*910283#', 'WALLET',
    NOW() + INTERVAL '46 hours',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '3 hours'
  ),
  (
    'tx_macbook_keyboard_03',
    '#escrow-macbook-keyboard-3m9x',
    'usr_seller_amina_01', 'usr_buyer_tunde_02',
    'Amina Bello', 'Tunde Bakare',
    'Logitech MX Keys for Mac — Barely Used',
    'Logitech MX Keys for Mac. Used 2 months, excellent condition. Includes USB-C cable.',
    'Electronics & Gadgets',
    4200000, 31500, 4168500,
    'DISPUTED', 'GIG',
    '99207712301',
    'GIG-LG-339821', '*329*772019#', 'WALLET',
    NOW() + INTERVAL '44 hours',
    NOW() - INTERVAL '7 hours',
    NOW() - INTERVAL '9 hours',
    NOW() - INTERVAL '6 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- DISPUTE (for Keyboard)
INSERT INTO public.disputes (id, transaction_id, raised_by, reason, description, evidence_urls, status, ai_score, created_at)
VALUES (
  'disp_keyboard_01',
  'tx_macbook_keyboard_03',
  'usr_buyer_tunde_02',
  'ITEM_DEFECTIVE',
  'The spacebar key requires double tap to register. Seller stated it was 100% functional.',
  ARRAY['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80'],
  'OPEN',
  '{"recommendation": "RESOLVE_BUYER", "confidence": 88, "reasoning": "Buyer attached clear video showing spacebar key latency. Seller chat confirms claim of 100% working condition prior to dispatch."}'::jsonb,
  NOW() - INTERVAL '6 hours'
)
ON CONFLICT (id) DO NOTHING;

-- NOTIFICATIONS
INSERT INTO public.notifications (id, user_id, title, body, type, read, transaction_id, created_at)
VALUES
  (
    'notif_01',
    'usr_seller_amina_01',
    'AirPods Pro — Awaiting Delivery Confirmation',
    'Tunde Bakare has received dispatch notification for AirPods Pro Gen 2 (KWK-NG-8849102). Awaiting buyer confirmation.',
    'DISPATCH', false,
    'tx_airpods_pro_02',
    NOW() - INTERVAL '3 hours'
  ),
  (
    'notif_02',
    'usr_buyer_tunde_02',
    'Package Dispatched — Confirm When Received',
    'Amina Bello dispatched AirPods Pro Gen 2 via Kwik Delivery. Tracking: KWK-NG-8849102. USSD PIN: *329*910283#',
    'DISPATCH', false,
    'tx_airpods_pro_02',
    NOW() - INTERVAL '3 hours'
  ),
  (
    'notif_03',
    'usr_seller_amina_01',
    'Dispute Filed on Logitech Keyboard',
    'Tunde Bakare filed a dispute on #escrow-macbook-keyboard-3m9x. Escrow funds are frozen pending review.',
    'DISPUTE', false,
    'tx_macbook_keyboard_03',
    NOW() - INTERVAL '6 hours'
  )
ON CONFLICT (id) DO NOTHING;
