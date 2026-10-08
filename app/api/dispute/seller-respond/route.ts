import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { mockStore } from '@/lib/mock/store';
import { updateTrustScore } from '@/lib/trust/scoreEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dispute_id, seller_id, acceptance, response_text, evidence_urls } = body;

    if (!dispute_id || !seller_id || !acceptance || !response_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let dispute = await ServerDb.getDisputeByTxId(dispute_id);
    if (!dispute) {
      const allDisputes = await ServerDb.getDisputes();
      dispute = allDisputes.find((d) => d.id === dispute_id);
    }

    if (!dispute) {
      // Fallback mockStore check
      dispute = mockStore.getAllDisputes().find((d) => d.id === dispute_id || d.transaction_id === dispute_id);
    }

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute record not found' }, { status: 404 });
    }

    if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
      return NextResponse.json({ error: `Cannot respond to dispute in status: ${dispute.status}` }, { status: 400 });
    }

    const tx = (await ServerDb.getTransactionById(dispute.transaction_id)) || mockStore.getTransactionById(dispute.transaction_id);
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.seller_id !== seller_id) {
      return NextResponse.json({ error: 'Unauthorized: seller_id does not match contract seller' }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Update dispute record
    dispute.seller_acceptance = acceptance;
    dispute.seller_response = response_text;
    dispute.seller_evidence_urls = evidence_urls || [];
    dispute.seller_responded_at = now;
    dispute.status = 'UNDER_REVIEW';

    await ServerDb.saveDispute(dispute);
    mockStore.saveDispute(dispute);

    // Check seller response speed (bonus +1 if responded within 12 hours)
    const hoursElapsed = (new Date(now).getTime() - new Date(dispute.created_at).getTime()) / 3600000;
    if (hoursElapsed <= 12) {
      await updateTrustScore(seller_id, 1, 'Quick Dispute Response (<12h)', tx.id);
    }

    // Logic per acceptance option
    if (acceptance === 'NO_RETURN') {
      await ServerDb.addNotification(
        'usr_admin_ecobank_03',
        'Dispute Update — Seller Accepted Claim',
        `Seller accepted claim on contract ${tx.code}. No return required. Ready for refund.`,
        'DISPUTE',
        tx.id
      );
      mockStore.addNotification(
        'usr_admin_ecobank_03',
        'Dispute Update — Seller Accepted Claim',
        `Seller accepted claim on contract ${tx.code}. No return required. Ready for refund.`,
        'DISPUTE',
        tx.id
      );

      if (tx.buyer_id) {
        await ServerDb.addNotification(
          tx.buyer_id,
          'Good News — Dispute Accepted',
          `The seller accepted your dispute claim. A refund is being processed by Ecobank Compliance.`,
          'DISPUTE',
          tx.id
        );
        mockStore.addNotification(
          tx.buyer_id,
          'Good News — Dispute Accepted',
          `The seller accepted your dispute claim. A refund is being processed by Ecobank Compliance.`,
          'DISPUTE',
          tx.id
        );
      }

      await ServerDb.saveDisputeMessage({
        id: `msg_${Date.now()}_sys`,
        dispute_id: dispute.id,
        sender_id: seller_id,
        sender_role: 'seller',
        message: `Seller accepted buyer claim (No return required). Statement: "${response_text}"`,
        is_system: true,
        created_at: now,
      });
      mockStore.addDisputeMessage({
        dispute_id: dispute.id,
        sender_id: seller_id,
        sender_role: 'seller',
        message: `Seller accepted buyer claim (No return required). Statement: "${response_text}"`,
        is_system: true,
      });
    } else if (acceptance === 'RETURN_REQUIRED') {
      tx.state = 'AWAITING_RETURN';
      tx.updated_at = now;
      await ServerDb.saveTransaction(tx);
      mockStore.saveTransaction(tx);

      if (tx.buyer_id) {
        await ServerDb.addNotification(
          tx.buyer_id,
          'Action Required — Return Requested',
          `The seller has requested the item be returned on contract ${tx.code}. Please dispatch and upload proof.`,
          'DISPUTE',
          tx.id
        );
        mockStore.addNotification(
          tx.buyer_id,
          'Action Required — Return Requested',
          `The seller has requested the item be returned on contract ${tx.code}. Please dispatch and upload proof.`,
          'DISPUTE',
          tx.id
        );
      }

      await ServerDb.addNotification(
        'usr_admin_ecobank_03',
        'Dispute Update — Return Required',
        `Seller requested return on contract ${tx.code}. Awaiting buyer dispatch.`,
        'DISPUTE',
        tx.id
      );
      mockStore.addNotification(
        'usr_admin_ecobank_03',
        'Dispute Update — Return Required',
        `Seller requested return on contract ${tx.code}. Awaiting buyer dispatch.`,
        'DISPUTE',
        tx.id
      );

      await ServerDb.saveDisputeMessage({
        id: `msg_${Date.now()}_sys`,
        dispute_id: dispute.id,
        sender_id: seller_id,
        sender_role: 'seller',
        message: `Seller requested item return prior to resolution. Statement: "${response_text}"`,
        is_system: true,
        created_at: now,
      });
      mockStore.addDisputeMessage({
        dispute_id: dispute.id,
        sender_id: seller_id,
        sender_role: 'seller',
        message: `Seller requested item return prior to resolution. Statement: "${response_text}"`,
        is_system: true,
      });
    } else if (acceptance === 'CONTESTED') {
      await ServerDb.addNotification(
        'usr_admin_ecobank_03',
        'Manual Review Required — Claim Contested',
        `Seller has contested the claim on contract ${tx.code}. Evidence submitted. Manual review required.`,
        'DISPUTE',
        tx.id
      );
      mockStore.addNotification(
        'usr_admin_ecobank_03',
        'Manual Review Required — Claim Contested',
        `Seller has contested the claim on contract ${tx.code}. Evidence submitted. Manual review required.`,
        'DISPUTE',
        tx.id
      );

      await ServerDb.saveDisputeMessage({
        id: `msg_${Date.now()}_sys`,
        dispute_id: dispute.id,
        sender_id: seller_id,
        sender_role: 'seller',
        message: `Seller contested the claim and submitted counter-evidence. Statement: "${response_text}"`,
        is_system: true,
        created_at: now,
      });
      mockStore.addDisputeMessage({
        dispute_id: dispute.id,
        sender_id: seller_id,
        sender_role: 'seller',
        message: `Seller contested the claim and submitted counter-evidence. Statement: "${response_text}"`,
        is_system: true,
      });
    }

    return NextResponse.json({ success: true, dispute, transaction: tx });
  } catch (error: any) {
    console.error('Error in seller-respond:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
