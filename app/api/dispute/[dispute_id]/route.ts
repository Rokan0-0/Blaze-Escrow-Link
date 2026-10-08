import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { mockStore } from '@/lib/mock/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dispute_id: string }> }
) {
  try {
    const { dispute_id } = await params;

    let dispute = await ServerDb.getDisputeByTxId(dispute_id);
    if (!dispute) {
      const all = await ServerDb.getDisputes();
      dispute = all.find((d) => d.id === dispute_id);
    }

    if (!dispute) {
      dispute = mockStore.getAllDisputes().find((d) => d.id === dispute_id || d.transaction_id === dispute_id);
    }

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute record not found' }, { status: 404 });
    }

    const transaction =
      (await ServerDb.getTransactionById(dispute.transaction_id)) ||
      mockStore.getTransactionById(dispute.transaction_id);

    if (!transaction) {
      return NextResponse.json({ error: 'Associated transaction not found' }, { status: 404 });
    }

    const sellerId = transaction.seller_id;
    const buyerId = dispute.raised_by || transaction.buyer_id || 'usr_buyer_tunde_02';

    const sellerProfile =
      (await ServerDb.getProfileById(sellerId)) || mockStore.getProfileById(sellerId);
    const buyerProfile =
      (await ServerDb.getProfileById(buyerId)) || mockStore.getProfileById(buyerId);

    const messages =
      (await ServerDb.getDisputeMessages(dispute.id)) ||
      mockStore.getDisputeMessages(dispute.id);

    const evidence = {
      buyer: dispute.evidence_urls || [],
      seller: dispute.seller_evidence_urls || [],
      damage: dispute.damage_claim_urls || [],
    };

    const timestamps = {
      created_at: transaction.created_at,
      dispatched_at: transaction.dispatched_at,
      dispute_raised_at: dispute.created_at,
      seller_responded_at: dispute.seller_responded_at,
      return_dispatched_at: transaction.return_dispatched_at,
      return_confirmed_at: transaction.return_confirmed_at,
      damage_claimed_at: dispute.damage_claimed_at,
      resolved_at: dispute.resolved_at,
    };

    return NextResponse.json({
      dispute,
      transaction,
      buyerProfile,
      sellerProfile,
      messages,
      evidence,
      timestamps,
    });
  } catch (error: any) {
    console.error('Error fetching dispute detail:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
