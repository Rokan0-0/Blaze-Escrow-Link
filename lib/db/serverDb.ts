import { supabaseAdmin } from '../supabase/admin';
import { Profile, EscrowTransaction, Dispute, NotificationItem, Withdrawal } from '../mock/types';
import { MOCK_SELLER, MOCK_BUYER, MOCK_ADMIN, INITIAL_TRANSACTIONS, INITIAL_DISPUTES, INITIAL_NOTIFICATIONS } from '../mock/store';

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
    if (error || !data) return [];
    return data as Dispute[];
  }

  static async getDisputeByTxId(txId: string): Promise<Dispute | undefined> {
    await this.ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from('disputes')
      .select('*')
      .eq('transaction_id', txId)
      .maybeSingle();
    if (error || !data) return undefined;
    return data as Dispute;
  }

  static async saveDispute(dispute: Dispute): Promise<Dispute> {
    await this.ensureSeeded();
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
