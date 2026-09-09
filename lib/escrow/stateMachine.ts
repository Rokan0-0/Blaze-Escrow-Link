import { EscrowTransaction } from '../mock/types';
import { mockStore } from '../mock/store';

export async function transitionEscrowState(
  txId: string,
  action: 'PAY' | 'DISPATCH' | 'CONFIRM' | 'DISPUTE' | 'RELEASE' | 'REFUND' | 'CANCEL',
  payload?: {
    buyer_id?: string;
    logistics?: EscrowTransaction['logistics'];
    tracking_id?: string;
    ussd_pin?: string;
    payment_method?: 'WALLET' | 'TRANSFER' | 'CARD';
    dispute_reason?: string;
    dispute_description?: string;
    resolution_note?: string;
    resolved_by?: string;
  }
): Promise<{ success: boolean; transaction?: EscrowTransaction; error?: string }> {
  try {
    if (action === 'PAY') {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: txId,
          buyer_id: payload?.buyer_id,
          payment_method: payload?.payment_method || 'WALLET',
        }),
      });
      const data = await res.json();
      if (data.success) {
        mockStore.saveTransaction(data.transaction);
        return { success: true, transaction: data.transaction };
      }
      return { success: false, error: data.error };
    }

    if (action === 'DISPATCH') {
      const res = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: txId,
          logistics: payload?.logistics,
          tracking_id: payload?.tracking_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        mockStore.saveTransaction(data.transaction);
        return { success: true, transaction: data.transaction };
      }
      return { success: false, error: data.error };
    }

    if (action === 'CONFIRM' || action === 'RELEASE') {
      const res = await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: txId,
          buyer_id: payload?.buyer_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        mockStore.saveTransaction(data.transaction);
        return { success: true, transaction: data.transaction };
      }
      return { success: false, error: data.error };
    }

    if (action === 'DISPUTE') {
      const res = await fetch('/api/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RAISE',
          transaction_id: txId,
          buyer_id: payload?.buyer_id,
          dispute_reason: payload?.dispute_reason,
          dispute_description: payload?.dispute_description,
        }),
      });
      const data = await res.json();
      if (data.success) {
        mockStore.saveTransaction(data.transaction);
        if (data.dispute) mockStore.saveDispute(data.dispute);
        return { success: true, transaction: data.transaction };
      }
      return { success: false, error: data.error };
    }

    return { success: false, error: 'Unsupported state action' };
  } catch (e: any) {
    console.warn('API fetch fallback to local mock store', e);
    return { success: false, error: 'Network or server error' };
  }
}
