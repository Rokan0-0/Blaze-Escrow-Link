import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { mockStore } from '@/lib/mock/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_id, buyer_id, return_logistics, return_tracking_id, return_proof_urls } = body;

    if (!transaction_id || !buyer_id || !return_logistics || !return_tracking_id) {
      return NextResponse.json({ error: 'Missing required return dispatch fields' }, { status: 400 });
    }

    if (!return_proof_urls || !Array.isArray(return_proof_urls) || return_proof_urls.length === 0) {
      return NextResponse.json({ error: 'Return proof waybill/receipt photo is required' }, { status: 400 });
    }

    const tx = (await ServerDb.getTransactionById(transaction_id)) || mockStore.getTransactionById(transaction_id);
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.state !== 'AWAITING_RETURN') {
      return NextResponse.json({ error: `Cannot dispatch return for transaction in state: ${tx.state}` }, { status: 400 });
    }

    if (tx.buyer_id && tx.buyer_id !== buyer_id) {
      return NextResponse.json({ error: 'Unauthorized: buyer_id does not match contract buyer' }, { status: 403 });
    }

    const now = new Date().toISOString();

    tx.state = 'RETURN_DISPATCHED';
    tx.return_logistics = return_logistics;
    tx.return_tracking_id = return_tracking_id;
    tx.return_proof_urls = return_proof_urls;
    tx.return_dispatched_at = now;
    tx.updated_at = now;

    await ServerDb.saveTransaction(tx);
    mockStore.saveTransaction(tx);

    const dispute = (await ServerDb.getDisputeByTxId(tx.id)) || mockStore.getDisputeByTxId(tx.id);

    // Notify seller
    await ServerDb.addNotification(
      tx.seller_id,
      'Return Incoming',
      `The buyer has dispatched the item back to you on contract ${tx.code}. Tracking: ${return_tracking_id} via ${return_logistics}. Click 'Item Received' when it arrives.`,
      'DISPATCH',
      tx.id
    );
    mockStore.addNotification(
      tx.seller_id,
      'Return Incoming',
      `The buyer has dispatched the item back to you on contract ${tx.code}. Tracking: ${return_tracking_id} via ${return_logistics}. Click 'Item Received' when it arrives.`,
      'DISPATCH',
      tx.id
    );

    // Notify admin
    await ServerDb.addNotification(
      'usr_admin_ecobank_03',
      'Return Dispatched',
      `Return dispatched for contract ${tx.code}. Tracking: ${return_tracking_id}. Awaiting seller confirmation.`,
      'DISPATCH',
      tx.id
    );
    mockStore.addNotification(
      'usr_admin_ecobank_03',
      'Return Dispatched',
      `Return dispatched for contract ${tx.code}. Tracking: ${return_tracking_id}. Awaiting seller confirmation.`,
      'DISPATCH',
      tx.id
    );

    // Add thread system message
    if (dispute) {
      await ServerDb.saveDisputeMessage({
        id: `msg_${Date.now()}_sys`,
        dispute_id: dispute.id,
        sender_id: buyer_id,
        sender_role: 'buyer',
        message: `Buyer dispatched return via ${return_logistics} (Tracking: ${return_tracking_id}). Proof of dispatch uploaded.`,
        is_system: true,
        created_at: now,
      });
      mockStore.addDisputeMessage({
        dispute_id: dispute.id,
        sender_id: buyer_id,
        sender_role: 'buyer',
        message: `Buyer dispatched return via ${return_logistics} (Tracking: ${return_tracking_id}). Proof of dispatch uploaded.`,
        is_system: true,
      });
    }

    return NextResponse.json({ success: true, transaction: tx, dispute });
  } catch (error: any) {
    console.error('Error in return-dispatch:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
