import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_id, logistics, tracking_id } = body;

    const tx = await ServerDb.getTransactionById(transaction_id);
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.state !== 'PAID') {
      return NextResponse.json({ error: `Cannot dispatch transaction in state ${tx.state}` }, { status: 400 });
    }

    const now = new Date().toISOString();
    tx.state = 'DISPATCHED';
    tx.logistics = logistics || 'CAMPUS_DIRECT';
    tx.tracking_id = tracking_id || `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
    tx.ussd_pin = Math.floor(100000 + Math.random() * 900000).toString();
    tx.dispatched_at = now;
    tx.updated_at = now;
    await ServerDb.saveTransaction(tx);

    if (tx.buyer_id) {
      await ServerDb.addNotification(
        tx.buyer_id,
        'Package Dispatched — Confirm When Received',
        `${tx.seller_name} dispatched ${tx.title} via ${tx.logistics}. Tracking: ${tx.tracking_id}. USSD Collection PIN: ${tx.ussd_pin}`,
        'DISPATCH',
        tx.id
      );
    }

    // Also notify seller that dispatch was recorded
    await ServerDb.addNotification(
      tx.seller_id,
      'Dispatch Confirmed — Awaiting Buyer',
      `${tx.title} (${tx.code}) marked as dispatched. Escrow funds release pending buyer confirmation.`,
      'DISPATCH',
      tx.id
    );

    return NextResponse.json({ success: true, transaction: tx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
