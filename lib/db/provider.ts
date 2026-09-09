import { createClient } from '../supabase/client';
import { mockStore } from '../mock/store';
import { Profile, EscrowTransaction, Dispute, NotificationItem, Withdrawal } from '../mock/types';

export class DatabaseProvider {
  private static isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !!url && !url.includes('placeholder');
  }

  // Profile operations
  static async getProfileByPhone(phone: string): Promise<Profile | undefined> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', phone)
          .single();
        if (data && !error) return data as Profile;
      } catch (e) {
        console.warn('Supabase profile fetch fallback to mock', e);
      }
    }
    return mockStore.getProfileByPhone(phone);
  }

  static async getProfileById(id: string): Promise<Profile | undefined> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        if (data && !error) return data as Profile;
      } catch (e) {
        console.warn('Supabase profile fetch by ID fallback', e);
      }
    }
    return mockStore.getProfileById(id);
  }

  static async saveProfile(profile: Profile): Promise<Profile> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('profiles').upsert(profile);
      } catch (e) {
        console.warn('Supabase save profile fallback', e);
      }
    }
    return mockStore.saveProfile(profile);
  }

  // Escrow Transaction operations
  static async getAllTransactions(): Promise<EscrowTransaction[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('escrow_transactions')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && !error) return data as EscrowTransaction[];
      } catch (e) {
        console.warn('Supabase getAllTransactions fallback', e);
      }
    }
    return mockStore.getAllTransactions();
  }

  static async getTransactionByCode(code: string): Promise<EscrowTransaction | undefined> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const searchCode = code.startsWith('#') ? code : `#${code}`;
        const { data, error } = await supabase
          .from('escrow_transactions')
          .select('*')
          .ilike('code', searchCode)
          .single();
        if (data && !error) return data as EscrowTransaction;
      } catch (e) {
        console.warn('Supabase getTransactionByCode fallback', e);
      }
    }
    return mockStore.getTransactionByCode(code);
  }

  static async saveTransaction(tx: EscrowTransaction): Promise<EscrowTransaction> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('escrow_transactions').upsert(tx);
      } catch (e) {
        console.warn('Supabase saveTransaction fallback', e);
      }
    }
    return mockStore.saveTransaction(tx);
  }

  // Disputes operations
  static async getAllDisputes(): Promise<Dispute[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('disputes')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && !error) return data as Dispute[];
      } catch (e) {
        console.warn('Supabase getAllDisputes fallback', e);
      }
    }
    return mockStore.getAllDisputes();
  }
}
