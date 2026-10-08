import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { mockStore } from '@/lib/mock/store';
import { updateTrustScore, flagProfile } from '@/lib/trust/scoreEngine';
import { isValidStateTransition } from '@/lib/escrow/stateMachine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dispute_id, admin_id, resolution_path, ruling, resolution_note, partial_buyer_pct, damage_ruling } = body;

    if (!dispute_id || !admin_id || !resolution_path || !ruling) {
      return NextResponse.json({ error: 'Missing required resolution parameters' }, { status: 400 });
    }

    if (!resolution_note || typeof resolution_note !== 'string' || resolution_note.trim().length < 20) {
      return NextResponse.json({ error: 'Compliance resolution note must be at least 20 characters long' }, { status: 400 });
    }

    if (resolution_path === 'PARTIAL' || damage_ruling === 'ACCIDENTAL') {
      if (typeof partial_buyer_pct !== 'number' || partial_buyer_pct < 1 || partial_buyer_pct > 99) {
        return NextResponse.json({ error: 'Partial resolution requires partial_buyer_pct between 1 and 99' }, { status: 400 });
      }
    }

    const adminProfile = (await ServerDb.getProfileById(admin_id)) || mockStore.getProfileById(admin_id);
    if (!adminProfile || (adminProfile.role !== 'admin' && !admin_id.startsWith('usr_admin'))) {
      return NextResponse.json({ error: 'Forbidden: caller is not an Ecobank compliance admin' }, { status: 403 });
    }

    let dispute = (await ServerDb.getDisputeByTxId(dispute_id)) || mockStore.getDisputeByTxId(dispute_id);
    if (!dispute) {
      const all = await ServerDb.getDisputes();
      dispute = all.find((d) => d.id === dispute_id);
    }

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute record not found' }, { status: 404 });
    }

    const tx = (await ServerDb.getTransactionById(dispute.transaction_id)) || mockStore.getTransactionById(dispute.transaction_id);
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (ruling === 'BUYER') {
      const isPartial = resolution_path === 'PARTIAL' || damage_ruling === 'ACCIDENTAL';
      let targetState = isPartial ? 'PARTIAL_REFUND' : 'REFUNDED';

      if (!isValidStateTransition(tx.state, targetState)) {
        console.warn(`[admin-resolve] Transition ${tx.state} -> ${targetState} overridden for admin resolution`);
      }

      let buyerRefundAmount = tx.amount;
      let sellerAmount = 0;

      if (isPartial) {
        const pct = partial_buyer_pct || 50;
        buyerRefundAmount = Math.floor((tx.amount * pct) / 100);
        sellerAmount = tx.amount - buyerRefundAmount;

        tx.partial_buyer_amount = buyerRefundAmount;
        tx.partial_seller_amount = sellerAmount;
      }

      tx.state = targetState as any;
      tx.updated_at = now;
      await ServerDb.saveTransaction(tx);
      mockStore.saveTransaction(tx);

      // Credit buyer
      if (tx.buyer_id) {
        const buyer = (await ServerDb.getProfileById(tx.buyer_id)) || mockStore.getProfileById(tx.buyer_id);
        if (buyer) {
          buyer.simulated_balance += buyerRefundAmount;
          await ServerDb.saveProfile(buyer);
          mockStore.saveProfile(buyer);
        }
      }

      // Credit seller if partial
      if (isPartial && sellerAmount > 0) {
        const seller = (await ServerDb.getProfileById(tx.seller_id)) || mockStore.getProfileById(tx.seller_id);
        if (seller) {
          seller.simulated_balance += sellerAmount;
          await ServerDb.saveProfile(seller);
          mockStore.saveProfile(seller);
        }
      }

      // Update dispute record
      dispute.status = 'RESOLVED_BUYER';
      dispute.resolution_note = resolution_note;
      dispute.resolution_path = resolution_path;
      dispute.resolved_by = admin_id;
      dispute.resolved_at = now;
      if (isPartial) dispute.partial_buyer_pct = partial_buyer_pct;

      await ServerDb.saveDispute(dispute);
      mockStore.saveDispute(dispute);

      // Trust Score deltas
      if (isPartial) {
        await updateTrustScore(tx.seller_id, -4, 'Dispute Resolved: Partial Split', tx.id);
        if (tx.buyer_id) {
          await updateTrustScore(tx.buyer_id, -1, 'Dispute Resolved: Partial Split', tx.id);
        }
      } else {
        await updateTrustScore(tx.seller_id, -8, 'Dispute Resolved: Full Refund to Buyer', tx.id);
        if (tx.buyer_id) {
          await updateTrustScore(tx.buyer_id, 2, 'Dispute Resolved in Buyer Favor', tx.id);
        }
      }

      // Notifications
      const formattedRefund = (buyerRefundAmount / 100).toLocaleString();
      if (tx.buyer_id) {
        await ServerDb.addNotification(
          tx.buyer_id,
          'Dispute Resolved — Refund Credited',
          `Your dispute on ${tx.code} has been resolved in your favor. ₦${formattedRefund} has been credited to your wallet balance. Note: "${resolution_note}"`,
          'RELEASE',
          tx.id
        );
        mockStore.addNotification(
          tx.buyer_id,
          'Dispute Resolved — Refund Credited',
          `Your dispute on ${tx.code} has been resolved in your favor. ₦${formattedRefund} has been credited to your wallet balance. Note: "${resolution_note}"`,
          'RELEASE',
          tx.id
        );
      }

      await ServerDb.addNotification(
        tx.seller_id,
        'Dispute Resolved — Refunded to Buyer',
        `Dispute on contract ${tx.code} was resolved by Compliance. ${isPartial ? `Partial refund processed (₦${(sellerAmount / 100).toLocaleString()} released to your wallet).` : 'Full refund issued to buyer.'}`,
        'DISPUTE',
        tx.id
      );
      mockStore.addNotification(
        tx.seller_id,
        'Dispute Resolved — Refunded to Buyer',
        `Dispute on contract ${tx.code} was resolved by Compliance. ${isPartial ? `Partial refund processed (₦${(sellerAmount / 100).toLocaleString()} released to your wallet).` : 'Full refund issued to buyer.'}`,
        'DISPUTE',
        tx.id
      );

      // Dispute thread system message
      await ServerDb.saveDisputeMessage({
        id: `msg_${Date.now()}_sys`,
        dispute_id: dispute.id,
        sender_id: admin_id,
        sender_role: 'admin',
        message: `Admin Binding Ruling: Resolved in favor of Buyer. ${isPartial ? `Partial split ${partial_buyer_pct}% / ${100 - (partial_buyer_pct || 50)}%.` : 'Full refund.'} Compliance Note: ${resolution_note}`,
        is_system: true,
        created_at: now,
      });
      mockStore.addDisputeMessage({
        dispute_id: dispute.id,
        sender_id: admin_id,
        sender_role: 'admin',
        message: `Admin Binding Ruling: Resolved in favor of Buyer. ${isPartial ? `Partial split ${partial_buyer_pct}% / ${100 - (partial_buyer_pct || 50)}%.` : 'Full refund.'} Compliance Note: ${resolution_note}`,
        is_system: true,
      });

      return NextResponse.json({ success: true, dispute, transaction: tx });
    }

    if (ruling === 'SELLER') {
      const targetState = 'RELEASED';

      tx.state = targetState;
      tx.released_at = now;
      tx.updated_at = now;
      await ServerDb.saveTransaction(tx);
      mockStore.saveTransaction(tx);

      // Credit seller with net_amount
      const seller = (await ServerDb.getProfileById(tx.seller_id)) || mockStore.getProfileById(tx.seller_id);
      if (seller) {
        seller.simulated_balance += tx.net_amount;
        seller.completed_trades += 1;
        await ServerDb.saveProfile(seller);
        mockStore.saveProfile(seller);
      }

      // Update dispute record
      dispute.status = 'RESOLVED_SELLER';
      dispute.resolution_note = resolution_note;
      dispute.resolution_path = resolution_path;
      dispute.resolved_by = admin_id;
      dispute.resolved_at = now;

      await ServerDb.saveDispute(dispute);
      mockStore.saveDispute(dispute);

      // Trust score updates
      if (damage_ruling === 'INTENTIONAL' && tx.buyer_id) {
        await updateTrustScore(tx.buyer_id, -20, 'Intentional Damage on Returned Item', tx.id);
        await flagProfile(tx.buyer_id, `Account flagged: Intentional damage caused to returned item on contract ${tx.code}`);
      } else if (tx.buyer_id) {
        await updateTrustScore(tx.buyer_id, -5, 'Dispute Resolved in Seller Favor', tx.id);
      }

      // Notifications
      const formattedRelease = (tx.net_amount / 100).toLocaleString();
      await ServerDb.addNotification(
        tx.seller_id,
        'Dispute Resolved — Funds Released',
        `Your dispute on ${tx.code} has been resolved in your favor. ₦${formattedRelease} has been credited to your wallet balance. Note: "${resolution_note}"`,
        'RELEASE',
        tx.id
      );
      mockStore.addNotification(
        tx.seller_id,
        'Dispute Resolved — Funds Released',
        `Your dispute on ${tx.code} has been resolved in your favor. ₦${formattedRelease} has been credited to your wallet balance. Note: "${resolution_note}"`,
        'RELEASE',
        tx.id
      );

      if (tx.buyer_id) {
        await ServerDb.addNotification(
          tx.buyer_id,
          'Dispute Resolved — Funds Released to Seller',
          `Dispute on contract ${tx.code} was resolved in favor of the seller by Compliance. Funds have been released. Note: "${resolution_note}"`,
          'DISPUTE',
          tx.id
        );
        mockStore.addNotification(
          tx.buyer_id,
          'Dispute Resolved — Funds Released to Seller',
          `Dispute on contract ${tx.code} was resolved in favor of the seller by Compliance. Funds have been released. Note: "${resolution_note}"`,
          'DISPUTE',
          tx.id
        );
      }

      // Dispute thread system message
      await ServerDb.saveDisputeMessage({
        id: `msg_${Date.now()}_sys`,
        dispute_id: dispute.id,
        sender_id: admin_id,
        sender_role: 'admin',
        message: `Admin Binding Ruling: Resolved in favor of Seller. Funds released (₦${formattedRelease}). Compliance Note: ${resolution_note}`,
        is_system: true,
        created_at: now,
      });
      mockStore.addDisputeMessage({
        dispute_id: dispute.id,
        sender_id: admin_id,
        sender_role: 'admin',
        message: `Admin Binding Ruling: Resolved in favor of Seller. Funds released (₦${formattedRelease}). Compliance Note: ${resolution_note}`,
        is_system: true,
      });

      return NextResponse.json({ success: true, dispute, transaction: tx });
    }

    return NextResponse.json({ error: 'Invalid ruling parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in admin-resolve:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
