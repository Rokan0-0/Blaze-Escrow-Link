import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { updateTrustScore } from '@/lib/trust/scoreEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_id, buyer_id } = body;

    const tx = await ServerDb.getTransactionById(transaction_id);
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.state !== 'DISPATCHED') {
      return NextResponse.json(
        { error: `Cannot confirm delivery — contract is in state: ${tx.state}` },
        { status: 400 }
      );
    }

    if (tx.buyer_id && buyer_id && buyer_id !== tx.buyer_id) {
      return NextResponse.json(
        { error: 'Only the buyer of this contract can confirm delivery.' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    tx.state = 'RELEASED';
    tx.confirmed_at = now;
    tx.released_at = now;
    tx.updated_at = now;
    await ServerDb.saveTransaction(tx);

    const seller = await ServerDb.getProfileById(tx.seller_id);
    if (seller) {
      seller.simulated_balance += tx.net_amount;
      seller.completed_trades += 1;
      seller.total_volume += tx.amount;
      await ServerDb.saveProfile(seller);
      await updateTrustScore(seller.id, 3, 'Completed Escrow Trade', tx.id);
    }

    if (tx.buyer_id) {
      const buyer = await ServerDb.getProfileById(tx.buyer_id);
      if (buyer) {
        buyer.completed_trades += 1;
        buyer.total_volume += tx.amount;
        await ServerDb.saveProfile(buyer);
        await updateTrustScore(buyer.id, 2, 'Verified Handshake', tx.id);
      }
    }

    await ServerDb.addNotification(
      tx.seller_id,
      'Escrow Funds Released',
      `₦${(tx.net_amount / 100).toLocaleString()} credited to your wallet balance for ${tx.code}.`,
      'RELEASE',
      tx.id
    );

    if (tx.buyer_id) {
      await ServerDb.addNotification(
        tx.buyer_id,
        'Trade Completed',
        `Order ${tx.code} is marked complete. Thank you for using Blaze Escrow!`,
        'CONFIRMATION',
        tx.id
      );
    }

    return NextResponse.json({ success: true, transaction: tx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
