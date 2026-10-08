import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { mockStore } from '@/lib/mock/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_id, seller_id, condition, damage_note, damage_claim_urls } = body;

    if (!transaction_id || !seller_id || !condition) {
      return NextResponse.json({ error: 'Missing required return confirm fields' }, { status: 400 });
    }

    const tx = (await ServerDb.getTransactionById(transaction_id)) || mockStore.getTransactionById(transaction_id);
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.state !== 'RETURN_DISPATCHED') {
      return NextResponse.json({ error: `Cannot confirm return for transaction in state: ${tx.state}` }, { status: 400 });
    }

    if (tx.seller_id !== seller_id) {
      return NextResponse.json({ error: 'Unauthorized: seller_id does not match contract seller' }, { status: 403 });
    }

    const now = new Date().toISOString();
    let dispute = (await ServerDb.getDisputeByTxId(tx.id)) || mockStore.getDisputeByTxId(tx.id);

    if (condition === 'ACCEPTABLE') {
      tx.state = 'RETURN_CONFIRMED';
      tx.return_confirmed_at = now;
      tx.updated_at = now;

      await ServerDb.saveTransaction(tx);
      mockStore.saveTransaction(tx);

      // Notify admin
      await ServerDb.addNotification(
        'usr_admin_ecobank_03',
        'Return Confirmed',
        `Seller confirmed return received in acceptable condition on contract ${tx.code}. Ready to release refund to buyer.`,
        'CONFIRMATION',
        tx.id
      );
      mockStore.addNotification(
        'usr_admin_ecobank_03',
        'Return Confirmed',
        `Seller confirmed return received in acceptable condition on contract ${tx.code}. Ready to release refund to buyer.`,
        'CONFIRMATION',
        tx.id
      );

      // Post system message
      if (dispute) {
        await ServerDb.saveDisputeMessage({
          id: `msg_${Date.now()}_sys`,
          dispute_id: dispute.id,
          sender_id: seller_id,
          sender_role: 'seller',
          message: 'Seller confirmed return item received in acceptable condition.',
          is_system: true,
          created_at: now,
        });
        mockStore.addDisputeMessage({
          dispute_id: dispute.id,
          sender_id: seller_id,
          sender_role: 'seller',
          message: 'Seller confirmed return item received in acceptable condition.',
          is_system: true,
        });
      }
    } else if (condition === 'DAMAGED') {
      if (!damage_claim_urls || !Array.isArray(damage_claim_urls) || damage_claim_urls.length === 0) {
        return NextResponse.json({ error: 'Damage claim requires at least 1 photo evidence file' }, { status: 400 });
      }

      tx.state = 'DAMAGE_CLAIMED';
      tx.updated_at = now;
      await ServerDb.saveTransaction(tx);
      mockStore.saveTransaction(tx);

      if (dispute) {
        dispute.damage_claim_urls = damage_claim_urls;
        dispute.damage_claim_note = damage_note || 'Seller reported item arrived damaged.';
        dispute.damage_claimed_at = now;
        dispute.resolution_path = 'DAMAGE_CLAIMED';
        dispute.status = 'UNDER_REVIEW';

        await ServerDb.saveDispute(dispute);
        mockStore.saveDispute(dispute);

        await ServerDb.saveDisputeMessage({
          id: `msg_${Date.now()}_sys`,
          dispute_id: dispute.id,
          sender_id: seller_id,
          sender_role: 'seller',
          message: `Seller flagged returned item as damaged. Note: "${damage_note || 'No note'}"`,
          is_system: true,
          created_at: now,
        });
        mockStore.addDisputeMessage({
          dispute_id: dispute.id,
          sender_id: seller_id,
          sender_role: 'seller',
          message: `Seller flagged returned item as damaged. Note: "${damage_note || 'No note'}"`,
          is_system: true,
        });
      }

      // Notify admin
      await ServerDb.addNotification(
        'usr_admin_ecobank_03',
        'Damage Claim Filed',
        `Seller reports returned item was damaged on contract ${tx.code}. Evidence uploaded. Manual review required.`,
        'DISPUTE',
        tx.id
      );
      mockStore.addNotification(
        'usr_admin_ecobank_03',
        'Damage Claim Filed',
        `Seller reports returned item was damaged on contract ${tx.code}. Evidence uploaded. Manual review required.`,
        'DISPUTE',
        tx.id
      );

      // Notify buyer
      if (tx.buyer_id) {
        await ServerDb.addNotification(
          tx.buyer_id,
          'Dispute Update — Return Flagged Damaged',
          `The seller has flagged the returned item on contract ${tx.code} as damaged. An admin will review and resolve within 24 hours.`,
          'DISPUTE',
          tx.id
        );
        mockStore.addNotification(
          tx.buyer_id,
          'Dispute Update — Return Flagged Damaged',
          `The seller has flagged the returned item on contract ${tx.code} as damaged. An admin will review and resolve within 24 hours.`,
          'DISPUTE',
          tx.id
        );
      }
    } else {
      return NextResponse.json({ error: 'Invalid condition value' }, { status: 400 });
    }

    return NextResponse.json({ success: true, transaction: tx, dispute });
  } catch (error: any) {
    console.error('Error in return-confirm:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
