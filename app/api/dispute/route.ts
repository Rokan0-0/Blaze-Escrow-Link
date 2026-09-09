import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { updateTrustScore } from '@/lib/trust/scoreEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, transaction_id, buyer_id, dispute_reason, dispute_description, dispute_id, outcome } = body;

    if (action === 'RAISE') {
      const tx = await ServerDb.getTransactionById(transaction_id);
      if (!tx) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      if (!['DISPATCHED', 'PAID'].includes(tx.state)) {
        return NextResponse.json(
          { error: `Cannot raise a dispute on a contract in state: ${tx.state}` },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();
      tx.state = 'DISPUTED';
      tx.updated_at = now;
      await ServerDb.saveTransaction(tx);

      const dispute = await ServerDb.saveDispute({
        id: `disp_${Date.now()}`,
        transaction_id: tx.id,
        raised_by: buyer_id || tx.buyer_id || 'usr_buyer_tunde_02',
        reason: dispute_reason || 'ITEM_DEFECTIVE',
        description: dispute_description || 'Buyer flagged defect with received item.',
        evidence_urls: [],
        status: 'OPEN',
        ai_score: {
          recommendation: 'MANUAL_REVIEW',
          confidence: 88,
          reasoning: 'Buyer attached evidence within 48h protection window. Photo evidence indicates defect.',
        },
        created_at: now,
      });

      const seller = await ServerDb.getProfileById(tx.seller_id);
      if (seller) {
        seller.disputed_trades += 1;
        await ServerDb.saveProfile(seller);
        await updateTrustScore(seller.id, -5, 'Dispute Raised by Buyer', tx.id);
      }

      await ServerDb.addNotification(
        tx.seller_id,
        'Dispute Opened on Order',
        `Buyer raised a dispute for ${tx.code}. Escrow funds frozen pending Ecobank review.`,
        'DISPUTE',
        tx.id
      );

      return NextResponse.json({ success: true, dispute, transaction: tx });
    }

    if (action === 'RESOLVE') {
      const disputes = await ServerDb.getDisputes();
      const dispute = disputes.find((d) => d.id === dispute_id);
      if (!dispute) {
        return NextResponse.json({ error: 'Dispute record not found' }, { status: 404 });
      }

      const tx = await ServerDb.getTransactionById(dispute.transaction_id);
      if (!tx) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      const now = new Date().toISOString();

      if (outcome === 'RESOLVE_BUYER') {
        tx.state = 'REFUNDED';
        tx.updated_at = now;
        await ServerDb.saveTransaction(tx);

        if (tx.buyer_id) {
          const buyer = await ServerDb.getProfileById(tx.buyer_id);
          if (buyer) {
            buyer.simulated_balance += tx.amount;
            await ServerDb.saveProfile(buyer);
          }
        }

        dispute.status = 'RESOLVED_BUYER';
        dispute.resolution_note = 'Ecobank Compliance resolved dispute in favor of buyer.';
        dispute.resolved_at = now;
        await ServerDb.saveDispute(dispute);
      } else {
        tx.state = 'RELEASED';
        tx.released_at = now;
        tx.updated_at = now;
        await ServerDb.saveTransaction(tx);

        const seller = await ServerDb.getProfileById(tx.seller_id);
        if (seller) {
          seller.simulated_balance += tx.net_amount;
          await ServerDb.saveProfile(seller);
        }

        dispute.status = 'RESOLVED_SELLER';
        dispute.resolution_note = 'Ecobank Compliance resolved dispute in favor of seller.';
        dispute.resolved_at = now;
        await ServerDb.saveDispute(dispute);
      }

      return NextResponse.json({ success: true, dispute, transaction: tx });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
