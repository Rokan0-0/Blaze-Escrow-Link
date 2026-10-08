export interface Profile {
  id: string;
  phone: string;
  full_name: string;
  role: 'seller' | 'buyer' | 'both' | 'admin';
  trust_score: number;
  trust_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  completed_trades: number;
  disputed_trades: number;
  total_volume: number; // kobo
  ecobank_linked: boolean;
  blaze_account?: string;
  credit_limit: number; // kobo
  simulated_balance: number; // kobo
  is_suspended?: boolean;
  flagged?: boolean;
  flagged_note?: string;
  created_at: string;
}

export interface EscrowTransaction {
  id: string;
  code: string;
  seller_id: string;
  buyer_id?: string;
  seller_name?: string;
  buyer_name?: string;
  title: string;
  description: string;
  category: string;
  amount: number; // kobo
  fee: number; // kobo
  net_amount: number; // kobo
  state: 'CREATED' | 'PAID' | 'DISPATCHED' | 'CONFIRMED' | 'DISPUTED' | 'RELEASED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED' | 'AWAITING_RETURN' | 'RETURN_DISPATCHED' | 'RETURN_CONFIRMED' | 'PARTIAL_REFUND' | 'DAMAGE_CLAIMED';
  logistics?: 'GIG' | 'KWIK' | 'SENDBOX' | 'CAMPUS_DIRECT' | 'OTHER';
  tracking_id?: string;
  ussd_pin?: string;
  payment_method?: 'WALLET' | 'TRANSFER' | 'CARD';
  image_url?: string;
  transfer_account?: string;
  partial_buyer_amount?: number; // kobo
  partial_seller_amount?: number; // kobo
  return_tracking_id?: string;
  return_logistics?: string;
  return_dispatched_at?: string;
  return_confirmed_at?: string;
  return_proof_urls?: string[];
  expires_at: string;
  dispatched_at?: string;
  delivered_at?: string;
  confirmed_at?: string;
  released_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Dispute {
  id: string;
  transaction_id: string;
  raised_by: string;
  reason: string;
  description: string;
  evidence_urls: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'ESCALATED';
  ai_score?: {
    recommendation: 'RESOLVE_BUYER' | 'RESOLVE_SELLER' | 'MANUAL_REVIEW';
    confidence: number;
    reasoning: string;
  };
  seller_acceptance?: 'NO_RETURN' | 'RETURN_REQUIRED' | 'CONTESTED';
  seller_response?: string;
  seller_evidence_urls?: string[];
  seller_responded_at?: string;
  resolution_path?: 'NO_RETURN' | 'RETURN_REQUIRED' | 'PARTIAL' | 'DAMAGE_CLAIMED';
  partial_buyer_pct?: number;
  damage_claim_urls?: string[];
  damage_claim_note?: string;
  damage_claimed_at?: string;
  resolution_note?: string;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
}

export interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_id: string;
  sender_role: 'buyer' | 'seller' | 'admin';
  message: string;
  is_system: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'PAYMENT' | 'DISPATCH' | 'CONFIRMATION' | 'DISPUTE' | 'RELEASE' | 'SYSTEM';
  read: boolean;
  transaction_id?: string;
  created_at: string;
}

export interface TrustScoreEvent {
  id: string;
  user_id: string;
  event_type: string;
  delta: number;
  description: string;
  transaction_id?: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  seller_id: string;
  amount: number; // kobo
  bank_name: string;
  account_number: string;
  account_name: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  reference: string;
  created_at: string;
  processed_at?: string;
}
