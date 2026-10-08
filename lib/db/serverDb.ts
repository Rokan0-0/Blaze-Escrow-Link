import { supabaseAdmin } from '../supabase/admin';
import { Profile, EscrowTransaction, Dispute, DisputeMessage, NotificationItem, Withdrawal } from '../mock/types';
import { mockStore, MOCK_SELLER, MOCK_BUYER, MOCK_ADMIN, INITIAL_TRANSACTIONS, INITIAL_DISPUTES, INITIAL_DISPUTE_MESSAGES, INITIAL_NOTIFICATIONS } from '../mock/store';

export function mergeDispute(primary?: Dispute, secondary?: Dispute): Dispute | undefined {
  if (!primary && !secondary) return undefined;
  if (!primary) return secondary;
  if (!secondary) return primary;

  return {
    ...secondary,
    ...primary,
    seller_acceptance: primary.seller_acceptance || secondary.seller_acceptance,
    seller_response: primary.seller_response || secondary.seller_response,
    seller_evidence_urls:
      (primary.seller_evidence_urls && primary.seller_evidence_urls.length > 0)
        ? primary.seller_evidence_urls
        : (secondary.seller_evidence_urls || []),
    seller_responded_at: primary.seller_responded_at || secondary.seller_responded_at,
    resolution_path: primary.resolution_path || secondary.resolution_path,
    damage_claim_urls:
      (primary.damage_claim_urls && primary.damage_claim_urls.length > 0)
        ? primary.damage_claim_urls
        : (secondary.damage_claim_urls || []),
    damage_claim_note: primary.damage_claim_note || secondary.damage_claim_note,
    damage_claimed_at: primary.damage_claimed_at || secondary.damage_claimed_at,
    resolution_note: primary.resolution_note || secondary.resolution_note,
    resolved_by: primary.resolved_by || secondary.resolved_by,
    resolved_at: primary.resolved_at || secondary.resolved_at,
    status: (primary.status && primary.status !== 'OPEN') ? primary.status : (secondary.status || primary.status),
  };
}

export class ServerDb {
  private static seeded = false;

  private static async ensureSeeded() {
    if (this.seeded) return;
    try {
      const { count, error } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
      if (error) {
        console.warn('[ServerDb] Table profiles count check error:', error.message);
        return;
      }
      if (count === 0 || count === null) {
        console.log('[ServerDb] Seeding Supabase Postgres...');
        await supabaseAdmin.from('profiles').upsert([MOCK_SELLER, MOCK_BUYER, MOCK_ADMIN]);
        await supabaseAdmin.from('escrow_transactions').upsert(INITIAL_TRANSACTIONS);
        await supabaseAdmin.from('disputes').upsert(INITIAL_DISPUTES);
        await supabaseAdmin.from('dispute_messages').upsert(INITIAL_DISPUTE_MESSAGES);
        await supabaseAdmin.from('notifications').upsert(INITIAL_NOTIFICATIONS);
        console.log('[ServerDb] Supabase seeding complete.');
      }
      this.seeded = true;
    } catch (e) {
      console.warn('[ServerDb] Seed check warning:', e);
    }
  }

  // Transactions
  static async getTransactions(): Promise<EscrowTransaction[]> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from('escrow_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as EscrowTransaction[];
  }

  static async getTransactionByCode(code: string): Promise<EscrowTransaction | undefined> {
    await this.ensureSeeded();
    const searchCode = code.startsWith('#') ? code : `#${code}`;
    const { data, error } = await supabaseAdmin
      .from('escrow_transactions')
      .select('*')
      .ilike('code', searchCode)
      .maybeSingle();
    if (error || !data) return undefined;
    return data as EscrowTransaction;
  }

  static async getTransactionById(id: string): Promise<EscrowTransaction | undefined> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from('escrow_transactions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return undefined;
    return data as EscrowTransaction;
  }

  static async saveTransaction(tx: EscrowTransaction): Promise<EscrowTransaction> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from('escrow_transactions')
      .upsert(tx)
      .select()
      .single();
    if (error) {
      console.error('[ServerDb] Error saving transaction:', error);
    }
    return (data || tx) as EscrowTransaction;
  }

  // Profiles
  static async getProfiles(): Promise<Profile[]> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin.from('profiles').select('*');
    if (error || !data) return [];
    return data as Profile[];
  }

  static async getProfileById(id: string): Promise<Profile | undefined> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return undefined;
    return data as Profile;
  }

  static async getProfileByPhone(phone: string): Promise<Profile | undefined> {
    await this.ensureSeeded();
    const formatted = phone.replace(/\s+/g, '');
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('phone', formatted)
      .maybeSingle();
    if (error || !data) return undefined;
    return data as Profile;
  }

  static async saveProfile(profile: Profile): Promise<Profile> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(profile)
      .select()
      .single();
    if (error) {
      console.error('[ServerDb] Error saving profile:', error);
    }
    return (data || profile) as Profile;
  }

  // Disputes
  static async getDisputes(): Promise<Dispute[]> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false });

    const dbList = (error || !data) ? [] : (data as Dispute[]);
    const mockList = mockStore.getAllDisputes();

    const map = new Map<string, Dispute>();
    mockList.forEach((d) => map.set(d.id, d));

    dbList.forEach((d) => {
      const existing = map.get(d.id);
      if (existing) {
        const merged = mergeDispute(d, existing);
        if (merged) map.set(d.id, merged);
      } else {
        map.set(d.id, d);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const aScore = (a.seller_acceptance ? 2 : 0) + (a.seller_responded_at ? 1 : 0);
      const bScore = (b.seller_acceptance ? 2 : 0) + (b.seller_responded_at ? 1 : 0);
      if (aScore !== bScore) return bScore - aScore;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  static async getDisputeById(id: string): Promise<Dispute | undefined> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from('disputes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    const dbDispute = (error || !data) ? undefined : (data as Dispute);
    const mockDispute = mockStore.getAllDisputes().find((d) => d.id === id);
    return mergeDispute(dbDispute, mockDispute);
  }

  static async getDisputeByTxId(txId: string): Promise<Dispute | undefined> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from('disputes')
      .select('*')
      .eq('transaction_id', txId)
      .order('created_at', { ascending: false });

    let dbDispute: Dispute | undefined = undefined;
    if (!error && data && data.length > 0) {
      const sorted = [...(data as Dispute[])].sort((a, b) => {
        const aScore = (a.seller_acceptance ? 2 : 0) + (a.seller_responded_at ? 1 : 0);
        const bScore = (b.seller_acceptance ? 2 : 0) + (b.seller_responded_at ? 1 : 0);
        if (aScore !== bScore) return bScore - aScore;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      dbDispute = sorted[0];
    }

    const mockDispute = mockStore.getDisputeByTxId(txId);
    return mergeDispute(dbDispute, mockDispute);
  }

  static async getDisputeByIdOrTxId(idOrTxId: string): Promise<Dispute | undefined> {
    let d = await this.getDisputeByTxId(idOrTxId);
    if (!d) d = await this.getDisputeById(idOrTxId);
    if (!d) {
      const all = await this.getDisputes();
      const matches = all.filter((item) => item.id === idOrTxId || item.transaction_id === idOrTxId);
      if (matches.length > 0) {
        matches.sort((a, b) => {
          const aScore = (a.seller_acceptance ? 2 : 0) + (a.seller_responded_at ? 1 : 0);
          const bScore = (b.seller_acceptance ? 2 : 0) + (b.seller_responded_at ? 1 : 0);
          if (aScore !== bScore) return bScore - aScore;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        d = matches[0];
      }
    }
    const mockDispute = mockStore.getDisputeByIdOrTxId(idOrTxId);
    return mergeDispute(d, mockDispute);
  }

  static async saveDispute(dispute: Dispute): Promise<Dispute> {
    await this.ensureSeeded();
    mockStore.saveDispute(dispute);
    const { data, error } = await supabaseAdmin
      .from('disputes')
      .upsert(dispute)
      .select()
      .single();
    if (error) {
      console.error('[ServerDb] Error saving dispute:', error);
    }
    return (data || dispute) as Dispute;
  }

  // Dispute Messages
  static async getDisputeMessages(disputeId: string): Promise<DisputeMessage[]> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from('dispute_messages')
      .select('*')
      .eq('dispute_id', disputeId)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return data as DisputeMessage[];
  }

  static async saveDisputeMessage(msg: DisputeMessage): Promise<DisputeMessage> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from('dispute_messages')
      .upsert(msg)
      .select()
      .single();
    if (error) {
      console.error('[ServerDb] Error saving dispute message:', error);
    }
    return (data || msg) as DisputeMessage;
  }

  // Notifications
  static async getNotifications(userId: string): Promise<NotificationItem[]> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as NotificationItem[];
  }

  static async addNotification(
    userId: string,
    title: string,
    body: string,
    type: NotificationItem['type'],
    transactionId?: string
  ): Promise<NotificationItem> {
    await this.ensureSeeded();
    const notif: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      user_id: userId,
      title,
      body,
      type,
      read: false,
      transaction_id: transactionId,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notif)
      .select()
      .single();
    if (error) {
      console.error('[ServerDb] Error adding notification:', error);
    }
    return (data || notif) as NotificationItem;
  }

  static async markNotificationsRead(userId: string): Promise<void> {
    await this.ensureSeeded();
    await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);
  }

  // Withdrawals
  static async getWithdrawals(sellerId?: string): Promise<Withdrawal[]> {
    await this.ensureSeeded();
    let query = supabaseAdmin
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data as Withdrawal[];
  }

  static async saveWithdrawal(withdrawal: Withdrawal): Promise<Withdrawal> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .upsert(withdrawal)
      .select()
      .single();
    if (error) {
      console.error('[ServerDb] Error saving withdrawal:', error);
    }
    return (data || withdrawal) as Withdrawal;
  }
}
