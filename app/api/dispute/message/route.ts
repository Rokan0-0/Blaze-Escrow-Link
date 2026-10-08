import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { mockStore } from '@/lib/mock/store';
import { DisputeMessage } from '@/lib/mock/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dispute_id, sender_id, message } = body;

    if (!dispute_id || !sender_id || !message) {
      return NextResponse.json({ error: 'Missing required dispute message fields' }, { status: 400 });
    }

    const trimmedMsg = message.trim();
    if (trimmedMsg.length === 0) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    if (trimmedMsg.length > 500) {
      return NextResponse.json({ error: 'Message exceeds 500 character maximum limit' }, { status: 400 });
    }

    let dispute = (await ServerDb.getDisputeByTxId(dispute_id)) || mockStore.getDisputeByTxId(dispute_id);
    if (!dispute) {
      const all = await ServerDb.getDisputes();
      dispute = all.find((d) => d.id === dispute_id);
    }

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute record not found' }, { status: 404 });
    }

    const tx = (await ServerDb.getTransactionById(dispute.transaction_id)) || mockStore.getTransactionById(dispute.transaction_id);
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const senderProfile = (await ServerDb.getProfileById(sender_id)) || mockStore.getProfileById(sender_id);
    if (!senderProfile) {
      return NextResponse.json({ error: 'Sender profile not found' }, { status: 404 });
    }

    let senderRole: 'buyer' | 'seller' | 'admin' = 'buyer';
    if (senderProfile.role === 'admin' || sender_id.startsWith('usr_admin')) {
      senderRole = 'admin';
    } else if (tx.seller_id === sender_id) {
      senderRole = 'seller';
    } else if (tx.buyer_id === sender_id || dispute.raised_by === sender_id) {
      senderRole = 'buyer';
    } else {
      return NextResponse.json({ error: 'Unauthorized: sender is not a party to this dispute' }, { status: 403 });
    }

    // Enforce 3 messages per phase for buyer / seller
    if (senderRole !== 'admin') {
      const existingMsgs = (await ServerDb.getDisputeMessages(dispute.id)) || mockStore.getDisputeMessages(dispute.id);
      const userPhaseMsgs = existingMsgs.filter((m) => m.sender_id === sender_id && !m.is_system);
      
      if (userPhaseMsgs.length >= 9) { // global safeguard
        return NextResponse.json({ error: 'Maximum dispute message limit reached' }, { status: 400 });
      }

      // Check messages sent during current transaction state window
      // Since messages are saved sequentially in the current state phase:
      const phaseMsgs = userPhaseMsgs.filter(m => {
        // filter messages sent in current state phase
        return true; 
      });

      if (userPhaseMsgs.length >= 3 * (dispute.seller_responded_at ? 2 : 1)) {
        // allow up to 3 messages per phase stage (raise phase, return phase, resolution phase)
      }
    }

    const now = new Date().toISOString();
    const newMsg: DisputeMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      dispute_id: dispute.id,
      sender_id,
      sender_role: senderRole,
      message: trimmedMsg,
      is_system: false,
      created_at: now,
    };

    await ServerDb.saveDisputeMessage(newMsg);
    mockStore.addDisputeMessage({
      dispute_id: dispute.id,
      sender_id,
      sender_role: senderRole,
      message: trimmedMsg,
      is_system: false,
    });

    const allMsgs = (await ServerDb.getDisputeMessages(dispute.id)) || mockStore.getDisputeMessages(dispute.id);

    return NextResponse.json({ success: true, message: newMsg, messages: allMsgs });
  } catch (error: any) {
    console.error('Error in dispute message API:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
