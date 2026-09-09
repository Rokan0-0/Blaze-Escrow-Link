import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_id, buyer_id, payment_method } = body;

    const tx = await ServerDb.getTransactionById(transaction_id);
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.state !== 'CREATED') {
      return NextResponse.json({ error: `Cannot pay transaction in state ${tx.state}` }, { status: 400 });
    }

    // Prevent seller from buying their own contract
    if (buyer_id && buyer_id === tx.seller_id) {
      return NextResponse.json({ error: 'Sellers cannot pay their own escrow contract.' }, { status: 403 });
    }

    if (!buyer_id) {
      return NextResponse.json({ error: 'buyer_id is required to pay.' }, { status: 400 });
    }

    const buyer = await ServerDb.getProfileById(buyer_id);
    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer profile not found. Please sign out and sign back in.' },
        { status: 404 }
      );
    }

    if (payment_method === 'WALLET' && buyer.simulated_balance < tx.amount) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    if (payment_method === 'WALLET') {
      buyer.simulated_balance -= tx.amount;
      await ServerDb.saveProfile(buyer);
    }

    const now = new Date().toISOString();
    tx.buyer_id = buyer.id;
    tx.buyer_name = buyer.full_name;
    tx.state = 'PAID';
    tx.payment_method = payment_method || 'WALLET';
    tx.updated_at = now;
    await ServerDb.saveTransaction(tx);

    // Notifications
    await ServerDb.addNotification(
      tx.seller_id,
      'Payment Locked in Escrow Vault',
      `${buyer.full_name} paid ₦${(tx.amount / 100).toLocaleString()} for ${tx.code}. Escrow lock active.`,
      'PAYMENT',
      tx.id
    );
    await ServerDb.addNotification(
      buyer.id,
      'Escrow Payment Locked',
      `Payment of ₦${(tx.amount / 100).toLocaleString()} for ${tx.code} is held safely in Ecobank Escrow Vault.`,
      'PAYMENT',
      tx.id
    );

    return NextResponse.json({ success: true, transaction: tx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
