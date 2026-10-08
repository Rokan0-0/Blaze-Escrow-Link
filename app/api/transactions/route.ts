import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { calculateEscrowFee, generateEscrowCode } from '@/lib/formatters';
import { mockStore, MOCK_SELLER } from '@/lib/mock/store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const buyerId = searchParams.get('buyer_id');
  const sellerId = searchParams.get('seller_id');

  if (code) {
    let tx = await ServerDb.getTransactionByCode(code);
    if (!tx) {
      tx = mockStore.getTransactionByCode(code);
    }
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    const seller = (await ServerDb.getProfileById(tx.seller_id)) || mockStore.getProfileById(tx.seller_id) || MOCK_SELLER;
    const dispute = (await ServerDb.getDisputeByTxId(tx.id)) || mockStore.getDisputeByTxId(tx.id) || null;
    return NextResponse.json({ transaction: tx, seller, dispute });
  }

  let transactions = await ServerDb.getTransactions();
  if (transactions.length === 0) {
    transactions = mockStore.getAllTransactions();
  }

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
    const { seller_id, title, description, category, amount, logistics, image_url } = body;

    if (!title || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Title and amount required' }, { status: 400 });
    }

    if (!seller_id) {
      return NextResponse.json({ error: 'seller_id is required' }, { status: 400 });
    }

    let seller = await ServerDb.getProfileById(seller_id);
    if (!seller) {
      seller = mockStore.getProfileById(seller_id) || {
        id: seller_id,
        full_name: 'Amina Bello',
        phone: '+2348000000001',
        role: 'seller',
        trust_score: 72,
        trust_tier: 'Gold',
        completed_trades: 14,
        disputed_trades: 0,
        total_volume: 45000000,
        ecobank_linked: true,
        credit_limit: 15000000,
        simulated_balance: 18500000,
        created_at: new Date().toISOString(),
      };
    }

    const fee = calculateEscrowFee(amount);
    const code = generateEscrowCode(title);

    const txData = {
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
      state: 'CREATED' as const,
      logistics: logistics || 'CAMPUS_DIRECT',
      image_url: image_url || undefined,
      transfer_account: `992${Math.floor(10000000 + Math.random() * 90000000)}`,
      expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newTx = await ServerDb.saveTransaction(txData);
    mockStore.saveTransaction(newTx);

    // Notify seller that their escrow link is live and ready to share
    try {
      await ServerDb.addNotification(
        seller.id,
        'Escrow Link Created',
        `Your link for "${title}" (${code}) is live. Share it with your buyer to receive payment.`,
        'SYSTEM',
        newTx.id
      );
    } catch (e) {}

    return NextResponse.json({ success: true, transaction: newTx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
