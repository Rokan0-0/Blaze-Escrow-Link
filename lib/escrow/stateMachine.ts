import { EscrowTransaction, Profile } from '../mock/types';
import { mockStore } from '../mock/store';
import { updateTrustScore } from '../trust/scoreEngine';

export type EscrowState =
  | 'CREATED'
  | 'PAID'
  | 'DISPATCHED'
  | 'CONFIRMED'
  | 'DISPUTED'
  | 'RELEASED'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'EXPIRED';

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
  const tx = mockStore.getTransactionById(txId);
  if (!tx) {
    return { success: false, error: 'Transaction not found' };
  }

  const now = new Date().toISOString();

  switch (action) {
    case 'PAY': {
      if (tx.state !== 'CREATED') {
        return { success: false, error: `Cannot pay transaction in state ${tx.state}` };
      }
      const buyerId = payload?.buyer_id || 'usr_buyer_tunde_02';
      const buyer = mockStore.getProfileById(buyerId);

      if (!buyer) {
        return { success: false, error: 'Buyer profile not found' };
      }

      // Check simulated balance if payment method is wallet
      if (payload?.payment_method === 'WALLET' && buyer.simulated_balance < tx.amount) {
        return { success: false, error: 'Insufficient wallet balance' };
      }

      // Deduct buyer wallet balance if paid via WALLET
      if (payload?.payment_method === 'WALLET') {
        buyer.simulated_balance -= tx.amount;
        mockStore.saveProfile(buyer);
      }

      tx.buyer_id = buyer.id;
      tx.buyer_name = buyer.full_name;
      tx.state = 'PAID';
      tx.payment_method = payload?.payment_method || 'WALLET';
      tx.updated_at = now;
      mockStore.saveTransaction(tx);

      // Add Notifications
      mockStore.addNotification(
        tx.seller_id,
        'Payment Held in Escrow',
        `${buyer.full_name} paid ₦${(tx.amount / 100).toLocaleString()} for ${tx.code}. Escrow lock activated.`,
        'PAYMENT',
        tx.id
      );
      mockStore.addNotification(
        buyer.id,
        'Escrow Payment Locked',
        `Your payment of ₦${(tx.amount / 100).toLocaleString()} for ${tx.code} is held safely in Blaze Escrow.`,
        'PAYMENT',
        tx.id
      );

      return { success: true, transaction: tx };
    }

    case 'DISPATCH': {
      if (tx.state !== 'PAID') {
        return { success: false, error: `Cannot dispatch transaction in state ${tx.state}` };
      }

      tx.state = 'DISPATCHED';
      tx.logistics = payload?.logistics || tx.logistics || 'CAMPUS_DIRECT';
      tx.tracking_id = payload?.tracking_id || `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
      tx.ussd_pin = payload?.ussd_pin || Math.floor(100000 + Math.random() * 900000).toString();
      tx.dispatched_at = now;
      tx.updated_at = now;
      mockStore.saveTransaction(tx);

      if (tx.buyer_id) {
        mockStore.addNotification(
          tx.buyer_id,
          'Item Dispatched',
          `Seller dispatched ${tx.title} via ${tx.logistics}. Tracking: ${tx.tracking_id}. USSD Handshake PIN: ${tx.ussd_pin}`,
          'DISPATCH',
          tx.id
        );
      }

      return { success: true, transaction: tx };
    }

    case 'CONFIRM': {
      if (tx.state !== 'DISPATCHED' && tx.state !== 'PAID') {
        return { success: false, error: `Cannot confirm delivery for transaction in state ${tx.state}` };
      }

      tx.state = 'CONFIRMED';
      tx.confirmed_at = now;
      tx.updated_at = now;
      mockStore.saveTransaction(tx);

      // Auto-trigger fund release
      return await transitionEscrowState(tx.id, 'RELEASE');
    }

    case 'RELEASE': {
      if (tx.state !== 'CONFIRMED' && tx.state !== 'DISPUTED' && tx.state !== 'DISPATCHED' && tx.state !== 'PAID') {
        return { success: false, error: `Cannot release funds for transaction in state ${tx.state}` };
      }

      tx.state = 'RELEASED';
      tx.released_at = now;
      tx.updated_at = now;
      mockStore.saveTransaction(tx);

      // Credit seller balance & update stats
      const seller = mockStore.getProfileById(tx.seller_id);
      if (seller) {
        seller.simulated_balance += tx.net_amount; // Net amount after fee
        seller.completed_trades += 1;
        seller.total_volume += tx.amount;
        mockStore.saveProfile(seller);

        // Boost Trust Score (+3 for successfully completed escrow trade)
        updateTrustScore(seller.id, 3, 'Completed Escrow Trade', tx.id);
      }

      // If buyer exists, update buyer trade count
      if (tx.buyer_id) {
        const buyer = mockStore.getProfileById(tx.buyer_id);
        if (buyer) {
          buyer.completed_trades += 1;
          buyer.total_volume += tx.amount;
          mockStore.saveProfile(buyer);
          updateTrustScore(buyer.id, 2, 'Verified Delivery & Handshake', tx.id);
        }
      }

      // Send notifications
      mockStore.addNotification(
        tx.seller_id,
        'Escrow Funds Released',
        `₦${(tx.net_amount / 100).toLocaleString()} credited to your Blaze Escrow balance for ${tx.code}.`,
        'RELEASE',
        tx.id
      );

      if (tx.buyer_id) {
        mockStore.addNotification(
          tx.buyer_id,
          'Trade Completed',
          `Order ${tx.code} is marked complete. Thank you for using Blaze Escrow!`,
          'CONFIRMATION',
          tx.id
        );
      }

      return { success: true, transaction: tx };
    }

    case 'DISPUTE': {
      if (tx.state !== 'PAID' && tx.state !== 'DISPATCHED') {
        return { success: false, error: `Cannot raise dispute for transaction in state ${tx.state}` };
      }

      tx.state = 'DISPUTED';
      tx.updated_at = now;
      mockStore.saveTransaction(tx);

      const buyerId = payload?.buyer_id || tx.buyer_id || 'usr_buyer_tunde_02';

      // Create dispute record
      const dispute = mockStore.saveDispute({
        id: `disp_${Date.now()}`,
        transaction_id: tx.id,
        raised_by: buyerId,
        reason: payload?.dispute_reason || 'ITEM_DEFECTIVE',
        description: payload?.dispute_description || 'Buyer flagged issue with received item.',
        evidence_urls: [],
        status: 'OPEN',
        ai_score: {
          recommendation: 'MANUAL_REVIEW',
          confidence: 82,
          reasoning: 'Buyer reported issue within 48h window. Evidence uploaded matches defect query.',
        },
        created_at: now,
      });

      // Update seller stats (disputed_trades)
      const seller = mockStore.getProfileById(tx.seller_id);
      if (seller) {
        seller.disputed_trades += 1;
        mockStore.saveProfile(seller);
        // Deduct trust score (-5 for dispute opened)
        updateTrustScore(seller.id, -5, 'Dispute Raised by Buyer', tx.id);
      }

      // Notifications
      mockStore.addNotification(
        tx.seller_id,
        'Dispute Opened on Order',
        `Buyer raised a dispute for ${tx.code}. Escrow payout frozen pending compliance review.`,
        'DISPUTE',
        tx.id
      );
      mockStore.addNotification(
        buyerId,
        'Dispute Under Review',
        `Your dispute for ${tx.code} has been logged. Ecobank Compliance team will review evidence.`,
        'DISPUTE',
        tx.id
      );

      return { success: true, transaction: tx };
    }

    case 'REFUND': {
      if (tx.state !== 'DISPUTED' && tx.state !== 'PAID' && tx.state !== 'DISPATCHED') {
        return { success: false, error: `Cannot refund transaction in state ${tx.state}` };
      }

      tx.state = 'REFUNDED';
      tx.updated_at = now;
      mockStore.saveTransaction(tx);

      if (tx.buyer_id) {
        const buyer = mockStore.getProfileById(tx.buyer_id);
        if (buyer) {
          buyer.simulated_balance += tx.amount;
          mockStore.saveProfile(buyer);
        }

        mockStore.addNotification(
          tx.buyer_id,
          'Escrow Refunded',
          `Full refund of ₦${(tx.amount / 100).toLocaleString()} credited back to your wallet.`,
          'RELEASE',
          tx.id
        );
      }

      return { success: true, transaction: tx };
    }

    case 'CANCEL': {
      if (tx.state !== 'CREATED') {
        return { success: false, error: 'Only unfulfilled links can be cancelled' };
      }

      tx.state = 'CANCELLED';
      tx.updated_at = now;
      mockStore.saveTransaction(tx);

      return { success: true, transaction: tx };
    }

    default:
      return { success: false, error: 'Invalid state action' };
  }
}
