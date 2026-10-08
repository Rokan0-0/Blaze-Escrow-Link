import { Profile, EscrowTransaction, Dispute, DisputeMessage, NotificationItem, TrustScoreEvent, Withdrawal } from './types';
import { calculateEscrowFee, generateEscrowCode } from '../formatters';

export const MOCK_SELLER: Profile = {
  id: 'usr_seller_amina_01',
  phone: '+2348000000001',
  full_name: 'Amina Bello',
  role: 'seller',
  trust_score: 72,
  trust_tier: 'Gold', // BUG-017: score 72 ≥ 60 = Gold tier per calculateTrustTier
  completed_trades: 14,
  disputed_trades: 0,
  total_volume: 45000000, // 450,000 NGN
  ecobank_linked: true,
  blaze_account: '30987654321',
  credit_limit: 15000000, // Gold tier = ₦150,000 credit limit
  simulated_balance: 18500000, // 185,000 NGN current wallet
  created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
};

export const MOCK_BUYER: Profile = {
  id: 'usr_buyer_tunde_02',
  phone: '+2348000000002',
  full_name: 'Tunde Bakare',
  role: 'buyer',
  trust_score: 65,
  trust_tier: 'Gold', // BUG-018: score 65 ≥ 60 = Gold tier per calculateTrustTier
  completed_trades: 5,
  disputed_trades: 1, // has one open dispute (Keyboard)
  total_volume: 12700000, // 127,000 NGN (AirPods 85k + Keyboard 42k)
  ecobank_linked: false,
  blaze_account: undefined,
  credit_limit: 15000000, // Gold tier = ₦150,000 credit limit
  // BUG-016: Balance reflects post-purchase state. Started with ₦211k, paid ₦85k+₦42k = ₦84k left.
  // Adding Vintage Denim (₦18,500) headroom so the demo pay flow works.
  simulated_balance: 21100000, // ₦211,000 — pre-payment starting balance shown to buyer
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
};

export const MOCK_ADMIN: Profile = {
  id: 'usr_admin_ecobank_03',
  phone: '+2348000000003',
  full_name: 'Ecobank Compliance Admin',
  role: 'admin',
  trust_score: 100,
  trust_tier: 'Platinum',
  completed_trades: 0,
  disputed_trades: 0,
  total_volume: 0,
  ecobank_linked: true,
  blaze_account: '10000000000',
  credit_limit: 35000000,
  simulated_balance: 0,
  created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
};

export const INITIAL_TRANSACTIONS: EscrowTransaction[] = [
  {
    // Vintage Jacket: Amina listed it, Tunde hasn't paid yet — CREATED state, no buyer_id
    id: 'tx_vintage_jacket_01',
    code: '#escrow-vintage-denim-99a2',
    seller_id: MOCK_SELLER.id,
    seller_name: MOCK_SELLER.full_name,
    title: 'Vintage Levi 90s Oversized Denim Jacket (XL)',
    description: 'Authentic 90s oversized blue denim jacket. Grade A thrift, no tear or stain.',
    category: 'Fashion & Apparel',
    amount: 1850000, // 18,500 NGN
    fee: calculateEscrowFee(1850000),
    net_amount: 1850000 - calculateEscrowFee(1850000),
    state: 'CREATED',
    logistics: 'CAMPUS_DIRECT',
    transfer_account: '9920194810',
    image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80',
    expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    // AirPods: Tunde paid, Amina dispatched — awaiting Tunde's delivery confirmation
    id: 'tx_airpods_pro_02',
    code: '#escrow-airpods-pro-gen2-7b1c',
    seller_id: MOCK_SELLER.id,
    buyer_id: MOCK_BUYER.id,
    seller_name: MOCK_SELLER.full_name,
    buyer_name: MOCK_BUYER.full_name,
    title: 'Apple AirPods Pro Gen 2 (MagSafe Case)',
    description: 'Clean unit with active noise cancellation. Original USB-C cable included.',
    category: 'Electronics',
    amount: 8500000, // 85,000 NGN
    fee: calculateEscrowFee(8500000),
    net_amount: 8500000 - calculateEscrowFee(8500000),
    state: 'DISPATCHED',
    logistics: 'KWIK',
    tracking_id: 'KWK-NG-8849102',
    ussd_pin: '910283',
    payment_method: 'TRANSFER',
    transfer_account: '9920194820',
    image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80',
    expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
    dispatched_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    // Keyboard: Tunde raised a dispute — funds frozen, under Ecobank review
    id: 'tx_macbook_keyboard_03',
    code: '#escrow-macbook-keyboard-3m9x',
    seller_id: MOCK_SELLER.id,
    buyer_id: MOCK_BUYER.id,
    seller_name: MOCK_SELLER.full_name,
    buyer_name: MOCK_BUYER.full_name,
    title: 'Logitech MX Keys Mini (Space Gray)',
    description: 'Bluetooth multi-device keyboard for Mac/Windows.',
    category: 'Electronics',
    amount: 4200000, // 42,000 NGN
    fee: calculateEscrowFee(4200000),
    net_amount: 4200000 - calculateEscrowFee(4200000),
    state: 'DISPUTED',
    logistics: 'GIG',
    tracking_id: 'GIG-LAK-90812',
    payment_method: 'WALLET',
    transfer_account: '9920194830',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    expires_at: new Date(Date.now() + 12 * 3600000).toISOString(),
    dispatched_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  }
];

export const INITIAL_DISPUTES: Dispute[] = [
  {
    id: 'disp_01',
    transaction_id: 'tx_macbook_keyboard_03',
    raised_by: MOCK_BUYER.id,
    reason: 'ITEM_DEFECTIVE',
    description: 'The spacebar key requires double tap to register. Seller stated it was 100% functional.',
    evidence_urls: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    ],
    status: 'OPEN',
    ai_score: {
      recommendation: 'RESOLVE_BUYER',
      confidence: 88,
      reasoning: 'Buyer attached clear video showing spacebar key latency. Seller chat confirms claim of 100% working condition prior to dispatch.',
    },
    seller_acceptance: undefined,
    seller_response: undefined,
    seller_evidence_urls: [],
    resolution_path: undefined,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  }
];

export const INITIAL_DISPUTE_MESSAGES: DisputeMessage[] = [
  {
    id: 'msg_init_01',
    dispute_id: 'disp_01',
    sender_id: MOCK_BUYER.id,
    sender_role: 'buyer',
    message: 'Dispute filed by buyer. Awaiting seller response.',
    is_system: true,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    // BUG-013: Old notif falsely said Tunde paid for Vintage Denim (which is CREATED/unpaid).
    // Replaced with accurate notification: AirPods was paid and dispatched.
    id: 'notif_01',
    user_id: MOCK_SELLER.id,
    title: 'AirPods Pro — Awaiting Delivery Confirmation',
    body: 'Tunde Bakare has received dispatch notification for AirPods Pro Gen 2 (KWK-NG-8849102). Awaiting buyer confirmation.',
    type: 'DISPATCH',
    read: false,
    transaction_id: 'tx_airpods_pro_02',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'notif_02',
    user_id: MOCK_BUYER.id,
    title: 'Package Dispatched — Confirm When Received',
    body: 'Amina Bello dispatched AirPods Pro Gen 2 via Kwik Delivery. Tracking: KWK-NG-8849102. USSD PIN: *329*910283#',
    type: 'DISPATCH',
    read: false,
    transaction_id: 'tx_airpods_pro_02',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'notif_03',
    user_id: MOCK_SELLER.id,
    title: 'Dispute Filed on Logitech Keyboard',
    body: 'Tunde Bakare filed a dispute on #escrow-macbook-keyboard-3m9x. Escrow funds are frozen pending Ecobank Compliance review.',
    type: 'DISPUTE',
    read: false,
    transaction_id: 'tx_macbook_keyboard_03',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  }
];

export const INITIAL_WITHDRAWALS: Withdrawal[] = [
  {
    id: 'wth_sample_01',
    seller_id: MOCK_SELLER.id,
    amount: 5000000, // ₦50,000
    bank_name: 'Ecobank Nigeria',
    account_number: '3098765432',
    account_name: 'Amina Bello',
    status: 'PENDING',
    reference: 'ECB-WTH-882910',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'wth_sample_02',
    seller_id: MOCK_SELLER.id,
    amount: 12000000, // ₦120,000
    bank_name: 'Guaranty Trust Bank',
    account_number: '0123456789',
    account_name: 'Amina Bello',
    status: 'COMPLETED',
    reference: 'ECB-WTH-773412',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    processed_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

// Memory/localStorage state manager helper
class LocalStore {
  private profiles: Map<string, Profile> = new Map();
  private transactions: Map<string, EscrowTransaction> = new Map();
  private disputes: Map<string, Dispute> = new Map();
  private disputeMessages: DisputeMessage[] = [];
  private notifications: NotificationItem[] = [];
  private withdrawals: Withdrawal[] = [];

  constructor() {
    this.profiles.set(MOCK_SELLER.id, MOCK_SELLER);
    this.profiles.set(MOCK_BUYER.id, MOCK_BUYER);
    this.profiles.set(MOCK_ADMIN.id, MOCK_ADMIN);

    INITIAL_TRANSACTIONS.forEach((tx) => this.transactions.set(tx.id, tx));
    INITIAL_DISPUTES.forEach((d) => this.disputes.set(d.id, d));
    this.disputeMessages = [...INITIAL_DISPUTE_MESSAGES];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.withdrawals = [...INITIAL_WITHDRAWALS];

    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const savedTx = localStorage.getItem('blaze_transactions');
      if (savedTx) {
        const txArray: EscrowTransaction[] = JSON.parse(savedTx);
        txArray.forEach((t) => this.transactions.set(t.id, t));
      }

      const savedProfiles = localStorage.getItem('blaze_profiles');
      if (savedProfiles) {
        const pArray: Profile[] = JSON.parse(savedProfiles);
        pArray.forEach((p) => this.profiles.set(p.id, p));
      }

      const savedDisputes = localStorage.getItem('blaze_disputes');
      if (savedDisputes) {
        const dArray: Dispute[] = JSON.parse(savedDisputes);
        dArray.forEach((d) => this.disputes.set(d.id, d));
      }

      const savedMsgs = localStorage.getItem('blaze_dispute_messages');
      if (savedMsgs) {
        this.disputeMessages = JSON.parse(savedMsgs);
      }

      const savedNotifs = localStorage.getItem('blaze_notifs');
      if (savedNotifs) {
        this.notifications = JSON.parse(savedNotifs);
      }

      const savedWithdrawals = localStorage.getItem('blaze_withdrawals');
      if (savedWithdrawals) {
        this.withdrawals = JSON.parse(savedWithdrawals);
      }
    } catch (e) {
      console.warn('LocalStorage read fallback', e);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('blaze_transactions', JSON.stringify(Array.from(this.transactions.values())));
      localStorage.setItem('blaze_profiles', JSON.stringify(Array.from(this.profiles.values())));
      localStorage.setItem('blaze_disputes', JSON.stringify(Array.from(this.disputes.values())));
      localStorage.setItem('blaze_dispute_messages', JSON.stringify(this.disputeMessages));
      localStorage.setItem('blaze_notifs', JSON.stringify(this.notifications));
      localStorage.setItem('blaze_withdrawals', JSON.stringify(this.withdrawals));
    } catch (e) {
      console.warn('LocalStorage save fallback', e);
    }
  }

  // Profile operations
  getProfileByPhone(phone: string): Profile | undefined {
    const formatted = phone.replace(/\s+/g, '');
    return Array.from(this.profiles.values()).find((p) => p.phone === formatted);
  }

  getProfileById(id: string): Profile | undefined {
    return this.profiles.get(id);
  }

  saveProfile(profile: Profile): Profile {
    this.profiles.set(profile.id, profile);
    this.saveToStorage();
    return profile;
  }

  // Transaction operations
  getAllTransactions(): EscrowTransaction[] {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getTransactionByCode(code: string): EscrowTransaction | undefined {
    const searchCode = code.startsWith('#') ? code : `#${code}`;
    return Array.from(this.transactions.values()).find(
      (t) => t.code.toLowerCase() === searchCode.toLowerCase()
    );
  }

  getTransactionById(id: string): EscrowTransaction | undefined {
    return this.transactions.get(id);
  }

  saveTransaction(tx: EscrowTransaction): EscrowTransaction {
    this.transactions.set(tx.id, tx);
    this.saveToStorage();
    return tx;
  }

  // Create new link
  createEscrowLink(params: {
    seller_id: string;
    title: string;
    description: string;
    category: string;
    amount: number; // kobo
    logistics?: 'GIG' | 'KWIK' | 'SENDBOX' | 'CAMPUS_DIRECT' | 'OTHER';
    image_url?: string;
  }): EscrowTransaction {
    const seller = this.getProfileById(params.seller_id) || MOCK_SELLER;
    const fee = calculateEscrowFee(params.amount);
    const code = generateEscrowCode(params.title);

    const newTx: EscrowTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      code,
      seller_id: seller.id,
      seller_name: seller.full_name,
      title: params.title,
      description: params.description,
      category: params.category,
      amount: params.amount,
      fee,
      net_amount: params.amount - fee,
      state: 'CREATED',
      logistics: params.logistics || 'CAMPUS_DIRECT',
      image_url: params.image_url,
      transfer_account: `992${Math.floor(10000000 + Math.random() * 90000000)}`,
      expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return this.saveTransaction(newTx);
  }

  // Dispute operations
  getAllDisputes(): Dispute[] {
    return Array.from(this.disputes.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getDisputeByTxId(txId: string): Dispute | undefined {
    return Array.from(this.disputes.values()).find((d) => d.transaction_id === txId || d.id === txId);
  }

  getDisputeByIdOrTxId(idOrTxId: string): Dispute | undefined {
    return Array.from(this.disputes.values()).find((d) => d.id === idOrTxId || d.transaction_id === idOrTxId);
  }

  saveDispute(dispute: Dispute): Dispute {
    this.disputes.set(dispute.id, dispute);
    this.saveToStorage();
    return dispute;
  }

  getDisputeMessages(disputeId: string): DisputeMessage[] {
    return this.disputeMessages
      .filter((m) => m.dispute_id === disputeId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  addDisputeMessage(params: {
    dispute_id: string;
    sender_id: string;
    sender_role: 'buyer' | 'seller' | 'admin';
    message: string;
    is_system?: boolean;
  }): DisputeMessage {
    const msg: DisputeMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      dispute_id: params.dispute_id,
      sender_id: params.sender_id,
      sender_role: params.sender_role,
      message: params.message,
      is_system: params.is_system || false,
      created_at: new Date().toISOString(),
    };
    this.disputeMessages.push(msg);
    this.saveToStorage();
    return msg;
  }

  // Notifications
  getNotificationsForUser(userId: string): NotificationItem[] {
    return this.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  addNotification(userId: string, title: string, body: string, type: NotificationItem['type'], transaction_id?: string) {
    const notif: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      user_id: userId,
      title,
      body,
      type,
      read: false,
      transaction_id,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    this.saveToStorage();
    return notif;
  }

  markNotifAsRead(notifId: string) {
    const item = this.notifications.find((n) => n.id === notifId);
    if (item) {
      item.read = true;
      this.saveToStorage();
    }
  }

  // Withdrawals
  createWithdrawal(sellerId: string, amountKobo: number, bankName: string, accountNumber: string, accountName: string): Withdrawal {
    const w: Withdrawal = {
      id: `wth_${Date.now()}`,
      seller_id: sellerId,
      amount: amountKobo,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      status: 'PENDING',
      reference: `ECB-WTH-${Math.floor(100000 + Math.random() * 900000)}`,
      created_at: new Date().toISOString(),
    };
    this.withdrawals.unshift(w);
    
    // Deduct balance
    const profile = this.getProfileById(sellerId);
    if (profile) {
      profile.simulated_balance = Math.max(0, profile.simulated_balance - amountKobo);
      this.saveProfile(profile);
    }
    this.addNotification(
      sellerId,
      'Bank Payout Requested',
      `₦${(amountKobo / 100).toLocaleString()} payout request submitted for ${bankName} (${accountNumber}). Ref: ${w.reference}`,
      'PAYMENT'
    );
    this.saveToStorage();
    return w;
  }

  getWithdrawals(sellerId: string): Withdrawal[] {
    return this.withdrawals.filter(w => w.seller_id === sellerId);
  }

  // Admin Operations
  getAllProfiles(): Profile[] {
    return Array.from(this.profiles.values());
  }

  toggleUserSuspension(userId: string): Profile | undefined {
    const profile = this.profiles.get(userId);
    if (profile) {
      profile.is_suspended = !profile.is_suspended;
      this.saveProfile(profile);
    }
    return profile;
  }

  adjustTrustScore(userId: string, delta: number): Profile | undefined {
    const profile = this.profiles.get(userId);
    if (profile) {
      profile.trust_score = Math.max(0, Math.min(100, profile.trust_score + delta));
      if (profile.trust_score >= 80) profile.trust_tier = 'Platinum';
      else if (profile.trust_score >= 60) profile.trust_tier = 'Gold';
      else if (profile.trust_score >= 40) profile.trust_tier = 'Silver';
      else profile.trust_tier = 'Bronze';
      this.saveProfile(profile);
    }
    return profile;
  }

  getAllWithdrawals(): Withdrawal[] {
    return [...this.withdrawals].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  approveWithdrawal(id: string): Withdrawal | undefined {
    const w = this.withdrawals.find((item) => item.id === id);
    if (w) {
      w.status = 'COMPLETED';
      w.processed_at = new Date().toISOString();
      this.addNotification(
        w.seller_id,
        'Withdrawal Approved & Sent',
        `Your withdrawal of ₦${(w.amount / 100).toLocaleString()} to ${w.bank_name} (${w.account_number}) has been approved and processed. Ref: ${w.reference}`,
        'PAYMENT'
      );
      this.saveToStorage();
    }
    return w;
  }

  rejectWithdrawal(id: string): Withdrawal | undefined {
    const w = this.withdrawals.find((item) => item.id === id);
    if (w && w.status !== 'FAILED') {
      w.status = 'FAILED';
      w.processed_at = new Date().toISOString();
      // Refund balance to seller
      const profile = this.getProfileById(w.seller_id);
      if (profile) {
        profile.simulated_balance += w.amount;
        this.saveProfile(profile);
      }
      this.addNotification(
        w.seller_id,
        'Withdrawal Rejected & Refunded',
        `Your withdrawal request of ₦${(w.amount / 100).toLocaleString()} was rejected by Compliance. Funds have been refunded to your wallet balance.`,
        'PAYMENT'
      );
      this.saveToStorage();
    }
    return w;
  }
}

export const mockStore = new LocalStore();
