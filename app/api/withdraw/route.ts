import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { Withdrawal } from '@/lib/mock/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('seller_id') || undefined;
    const withdrawals = await ServerDb.getWithdrawals(sellerId);
    return NextResponse.json({ withdrawals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seller_id, amount_kobo, bank_name, account_number, account_name } = body;

    if (!amount_kobo || amount_kobo <= 0) {
      return NextResponse.json({ error: 'Please enter a valid payout amount.' }, { status: 400 });
    }

    let seller = await ServerDb.getProfileById(seller_id);
    if (!seller) {
      return NextResponse.json({ error: 'Seller profile not found. Please sign in first.' }, { status: 404 });
    }

    if (seller.simulated_balance < amount_kobo) {
      return NextResponse.json(
        { error: `Insufficient wallet balance. Available: ₦${(seller.simulated_balance / 100).toLocaleString()}` },
        { status: 400 }
      );
    }

    // Deduct balance
    seller.simulated_balance = Math.max(0, seller.simulated_balance - amount_kobo);
    await ServerDb.saveProfile(seller);

    const withdrawal: Withdrawal = {
      id: `wth_${Date.now()}`,
      seller_id,
      amount: amount_kobo,
      bank_name: bank_name || 'Ecobank Nigeria',
      account_number: account_number || '30987654321',
      account_name: account_name || seller.full_name,
      status: 'COMPLETED',
      reference: `ECB-WTH-${Math.floor(100000 + Math.random() * 900000)}`,
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
    };

    await ServerDb.saveWithdrawal(withdrawal);

    await ServerDb.addNotification(
      seller_id,
      'Bank Payout Completed',
      `₦${(amount_kobo / 100).toLocaleString()} successfully transferred to ${bank_name || 'Ecobank'} (${account_number || '30987654321'}). Ref: ${withdrawal.reference}`,
      'PAYMENT'
    );

    return NextResponse.json({
      success: true,
      withdrawal,
      new_balance: seller.simulated_balance,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
