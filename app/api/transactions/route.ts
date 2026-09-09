import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { calculateEscrowFee, generateEscrowCode } from '@/lib/formatters';
import { MOCK_SELLER } from '@/lib/mock/store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const buyerId = searchParams.get('buyer_id');
  const sellerId = searchParams.get('seller_id');

  if (code) {
    const tx = await ServerDb.getTransactionByCode(code);
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    const seller = (await ServerDb.getProfileById(tx.seller_id)) || MOCK_SELLER;
    const dispute = await ServerDb.getDisputeByTxId(tx.id);
    return NextResponse.json({ transaction: tx, seller, dispute });
  }

  let transactions = await ServerDb.getTransactions();

  if (buyerId) {
    transactions = transactions.filter((t) => t.buyer_id === buyerId);
  } else if (sellerId) {
    transactions = transactions.filter((t) => t.seller_id === sellerId);
  }

  return NextResponse.json({ transactions });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seller_id, title, description, category, amount, logistics } = body;

    if (!title || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Title and amount required' }, { status: 400 });
    }

    if (!seller_id) {
      return NextResponse.json({ error: 'seller_id is required' }, { status: 400 });
    }

    // seller MUST exist in Supabase Postgres
    const seller = await ServerDb.getProfileById(seller_id);
    if (!seller) {
      return NextResponse.json(
        { error: `Seller profile not found. Please sign out and sign back in.` },
        { status: 404 }
      );
    }

    const fee = calculateEscrowFee(amount);
    const code = generateEscrowCode(title);

    const newTx = await ServerDb.saveTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code,
      seller_id: seller.id,
      seller_name: seller.full_name,
      title,
      description: description || '',
      category: category || 'Fashion & Apparel',
      amount,
      fee,
      net_amount: amount - fee,
      state: 'CREATED',
      logistics: logistics || 'CAMPUS_DIRECT',
      transfer_account: `992${Math.floor(10000000 + Math.random() * 90000000)}`,
      expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Notify seller that their escrow link is live and ready to share
    await ServerDb.addNotification(
      seller.id,
      'Escrow Link Created',
      `Your link for "${title}" (${code}) is live. Share it with your buyer to receive payment.`,
      'SYSTEM',
      newTx.id
    );

    return NextResponse.json({ success: true, transaction: newTx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
