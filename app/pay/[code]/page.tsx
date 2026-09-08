'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { mockStore } from '@/lib/mock/store';
import { transitionEscrowState } from '@/lib/escrow/stateMachine';
import { EscrowTransaction, Profile, Dispute } from '@/lib/mock/types';
import { formatNaira, formatDate, formatTimeRemaining } from '@/lib/formatters';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { DemoSwitcher } from '@/components/layout/DemoSwitcher';
import { Footer } from '@/components/layout/Footer';
import { StateProgressBar } from '@/components/escrow/StateProgressBar';
import { TrustBadge } from '@/components/trust/TrustBadge';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Lock,
  Copy,
  Check,
  CreditCard,
  Building2,
  Wallet,
  Truck,
  AlertTriangle,
  ArrowRight,
  Share2,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export default function EscrowPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = (params?.code as string) || '';
  const code = rawCode.startsWith('%23')
    ? decodeURIComponent(rawCode)
    : rawCode.startsWith('#')
    ? rawCode
    : `#${rawCode}`;

  const { user, switchDemoUser, refreshProfile } = useAuth();

  const [tx, setTx] = useState<EscrowTransaction | null>(null);
  const [sellerProfile, setSellerProfile] = useState<Profile | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);

  const [paymentTab, setPaymentTab] = useState<'WALLET' | 'TRANSFER' | 'CARD'>('WALLET');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  // Form states
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Dispatch form state
  const [trackingId, setTrackingId] = useState('');
  const [logisticsProvider, setLogisticsProvider] = useState<'GIG' | 'KWIK' | 'SENDBOX' | 'CAMPUS_DIRECT' | 'OTHER'>('CAMPUS_DIRECT');

  // Dispute form state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('ITEM_DEFECTIVE');
  const [disputeDesc, setDisputeDesc] = useState('');

  const loadData = () => {
    let item = mockStore.getTransactionByCode(code);
    if (!item) {
      // Fallback search by ID or return first initial item
      item = mockStore.getAllTransactions()[0];
    }
    if (item) {
      setTx({ ...item });
      const seller = mockStore.getProfileById(item.seller_id);
      if (seller) setSellerProfile(seller);

      const d = mockStore.getDisputeByTxId(item.id);
      if (d) setDispute(d);
    }
  };

  useEffect(() => {
    loadData();
  }, [code]);

  if (!tx) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-zinc-400 text-sm">
        Loading Escrow Contract...
      </div>
    );
  }

  const isSeller = user?.id === tx.seller_id;
  const isBuyer = user?.id === tx.buyer_id;
  const expiry = formatTimeRemaining(tx.expires_at);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}/pay/${encodeURIComponent(tx.code)}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyBank = () => {
    if (tx.transfer_account) {
      navigator.clipboard.writeText(tx.transfer_account);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    }
  };

  // Action Handlers
  const handlePay = async () => {
    setActionError('');
    setActionSuccess('');
    setIsProcessing(true);

    if (!user) {
      router.push(`/login?redirect=/pay/${encodeURIComponent(tx.code)}`);
      return;
    }

    const res = await transitionEscrowState(tx.id, 'PAY', {
      buyer_id: user.id,
      payment_method: paymentTab,
    });

    if (res.success && res.transaction) {
      setTx({ ...res.transaction });
      setActionSuccess('Payment locked in Escrow vault! Seller notified to dispatch.');
      refreshProfile();
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    } else {
      setActionError(res.error || 'Payment failed.');
    }
    setIsProcessing(false);
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setIsProcessing(true);

    const res = await transitionEscrowState(tx.id, 'DISPATCH', {
      logistics: logisticsProvider,
      tracking_id: trackingId || `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
    });

    if (res.success && res.transaction) {
      setTx({ ...res.transaction });
      setActionSuccess('Item marked dispatched. Buyer notified!');
    } else {
      setActionError(res.error || 'Failed to update dispatch status.');
    }
    setIsProcessing(false);
  };

  const handleConfirmDelivery = async () => {
    setActionError('');
    setActionSuccess('');
    setIsProcessing(true);

    const res = await transitionEscrowState(tx.id, 'CONFIRM');

    if (res.success && res.transaction) {
      setTx({ ...res.transaction });
      setActionSuccess('Delivery confirmed! Escrow funds released to seller.');
      refreshProfile();
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
      } catch (e) {}
    } else {
      setActionError(res.error || 'Failed to confirm delivery.');
    }
    setIsProcessing(false);
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setIsProcessing(true);

    const res = await transitionEscrowState(tx.id, 'DISPUTE', {
      buyer_id: user?.id,
      dispute_reason: disputeReason,
      dispute_description: disputeDesc,
    });

    if (res.success && res.transaction) {
      setTx({ ...res.transaction });
      setShowDisputeModal(false);
      setActionSuccess('Dispute submitted. Funds frozen pending Ecobank review.');
      loadData();
    } else {
      setActionError(res.error || 'Failed to log dispute.');
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <DemoSwitcher />
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Banner Alert for Persona Action Guidance */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 text-xs flex items-center justify-between gap-3 text-zinc-300">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#00874E] shrink-0" />
            <span>
              Escrow Vault Status: <strong className="text-white font-mono">{tx.code}</strong> held by Ecobank Nigeria
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1 rounded bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied Link' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* State Flow Bar */}
        <StateProgressBar state={tx.state} />

        {/* Action Alerts */}
        {actionError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            {actionSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Escrow Item Info (Left 2 cols) */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#1A1A1A] text-zinc-400 border border-[#2A2A2A] uppercase tracking-wider">
                    {tx.category}
                  </span>
                  <h1 className="text-xl font-bold text-white mt-2 leading-tight">{tx.title}</h1>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{tx.description}</p>
                </div>
              </div>

              {/* Price & Fee Breakdown Box */}
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Item Amount:</span>
                  <span className="text-sm font-bold text-white">{formatNaira(tx.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>Escrow Fee (0.75% max ₦500):</span>
                  <span>{formatNaira(tx.fee)}</span>
                </div>
                <div className="border-t border-[#2A2A2A] pt-2 flex items-center justify-between text-emerald-400 font-bold">
                  <span>Net Payout to Seller:</span>
                  <span>{formatNaira(tx.net_amount)}</span>
                </div>
              </div>

              {/* Seller Trust Profile Info */}
              {sellerProfile && (
                <div className="pt-3 border-t border-[#2A2A2A] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#006B3F] text-white flex items-center justify-center font-extrabold font-mono text-sm">
                      {sellerProfile.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{sellerProfile.full_name}</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-xs text-zinc-400">
                        {sellerProfile.completed_trades} Completed Trades • {sellerProfile.disputed_trades} Disputes
                      </div>
                    </div>
                  </div>
                  <TrustBadge score={sellerProfile.trust_score} tier={sellerProfile.trust_tier} compact />
                </div>
              )}
            </div>

            {/* ACTION SECTION ACCORDING TO STATE */}
            {tx.state === 'CREATED' && (
              <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" /> Select Buyer Payment Method
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentTab('WALLET')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      paymentTab === 'WALLET'
                        ? 'bg-[#006B3F]/20 border-[#006B3F] text-white'
                        : 'bg-[#1A1A1A] border-[#2A2A2A] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    <span>Blaze Wallet</span>
                  </button>
                  <button
                    onClick={() => setPaymentTab('TRANSFER')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      paymentTab === 'TRANSFER'
                        ? 'bg-[#006B3F]/20 border-[#006B3F] text-white'
                        : 'bg-[#1A1A1A] border-[#2A2A2A] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <span>Bank Transfer</span>
                  </button>
                  <button
                    onClick={() => setPaymentTab('CARD')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      paymentTab === 'CARD'
                        ? 'bg-[#006B3F]/20 border-[#006B3F] text-white'
                        : 'bg-[#1A1A1A] border-[#2A2A2A] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    <span>Debit Card</span>
                  </button>
                </div>

                {/* TAB 1: WALLET */}
                {paymentTab === 'WALLET' && (
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Your Wallet Balance:</span>
                      <span className="font-mono font-bold text-white">
                        {user ? formatNaira(user.simulated_balance) : 'Sign in to view'}
                      </span>
                    </div>

                    {!user ? (
                      <div className="text-xs text-zinc-400">
                        You need to be signed in as a buyer to pay directly from your Blaze wallet.
                        <button
                          onClick={() => switchDemoUser('buyer')}
                          className="block mt-2 text-emerald-400 hover:underline font-semibold"
                        >
                          Switch to Buyer Persona (Tunde Bakare)
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handlePay}
                        disabled={isProcessing || user.simulated_balance < tx.amount}
                        className="w-full bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                      >
                        {isProcessing ? 'Locking Payout in Escrow...' : `Pay ${formatNaira(tx.amount)} via Escrow Wallet`}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* TAB 2: BANK TRANSFER */}
                {paymentTab === 'TRANSFER' && (
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-3 text-xs">
                    <div className="text-zinc-400 leading-relaxed">
                      Transfer exact amount to this dedicated virtual escrow account. Funds will lock instantly upon receipt.
                    </div>
                    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Bank Name:</span>
                        <span className="font-semibold text-white">Ecobank Nigeria</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Account Name:</span>
                        <span className="font-semibold text-white">BLAZE ESCROW VAULT #{tx.code.slice(-6)}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-[#2A2A2A]">
                        <span>Virtual Account Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-white text-base">
                            {tx.transfer_account || '9920194810'}
                          </span>
                          <button
                            onClick={handleCopyBank}
                            className="p-1 rounded bg-[#1A1A1A] text-zinc-300 hover:text-white"
                          >
                            {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handlePay}
                      disabled={isProcessing}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isProcessing ? 'Verifying Transfer...' : 'Simulate Instant Bank Transfer Webhook'}
                    </button>
                  </div>
                )}

                {/* TAB 3: CARD */}
                {paymentTab === 'CARD' && (
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-3 text-xs">
                    <div className="space-y-2">
                      <label className="block text-[#A1A1AA]">Card Number</label>
                      <input
                        type="text"
                        disabled
                        value="5399 •••• •••• 4910 (Demo Card)"
                        className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <button
                      onClick={handlePay}
                      disabled={isProcessing}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isProcessing ? 'Authorizing Card...' : `Authorize ${formatNaira(tx.amount)} Card Payment`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SELLER DISPATCH FORM (When state is PAID) */}
            {tx.state === 'PAID' && (
              <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-400" /> Seller Dispatch Controls
                </h3>

                {!isSeller ? (
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-xs text-zinc-300 space-y-2">
                    <p>
                      Payment is locked safely in the Escrow vault! The seller (<strong className="text-white">{sellerProfile?.full_name}</strong>) is currently preparing the item for dispatch.
                    </p>
                    <button
                      onClick={() => switchDemoUser('seller')}
                      className="text-emerald-400 hover:underline font-semibold block"
                    >
                      Switch to Seller Persona (Amina Bello) to Dispatch Item
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleDispatch} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-zinc-300 font-semibold mb-1">Select Logistics Logistics Provider</label>
                      <select
                        value={logisticsProvider}
                        onChange={(e) => setLogisticsProvider(e.target.value as any)}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-white"
                      >
                        <option value="CAMPUS_DIRECT">Campus Direct Delivery (Handshake PIN)</option>
                        <option value="GIG">GIG Logistics</option>
                        <option value="KWIK">Kwik Delivery Express</option>
                        <option value="SENDBOX">Sendbox Courier</option>
                        <option value="OTHER">Other Local Logistics</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-semibold mb-1">Waybill / Waybill Tracking ID</label>
                      <input
                        type="text"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        placeholder="e.g. KWK-NG-8849102"
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-white font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isProcessing ? 'Updating Order...' : 'Confirm Dispatch & Send Tracking to Buyer'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* BUYER CONFIRMATION & DISPUTE CONTROLS (When state is DISPATCHED) */}
            {tx.state === 'DISPATCHED' && (
              <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Buyer Handshake & Confirmation
                </h3>

                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span>Logistics Method:</span>
                    <span className="font-semibold text-white">{tx.logistics || 'CAMPUS_DIRECT'}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-300 font-mono">
                    <span>Tracking Reference:</span>
                    <span className="text-purple-400 font-bold">{tx.tracking_id || 'TRK-901823'}</span>
                  </div>
                  {tx.ussd_pin && (
                    <div className="flex items-center justify-between text-zinc-300 font-mono border-t border-[#2A2A2A] pt-2">
                      <span>Offline USSD PIN:</span>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold text-sm">
                        *329*{tx.ussd_pin}#
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleConfirmDelivery}
                    disabled={isProcessing}
                    className="w-full bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Confirm Delivery & Release Funds
                  </button>

                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Raise Dispute / Report Issue
                  </button>
                </div>
              </div>
            )}

            {/* DISPUTE STATUS (When state is DISPUTED) */}
            {tx.state === 'DISPUTED' && dispute && (
              <div className="bg-[#111111] border border-rose-500/30 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" /> Active Dispute Record
                  </h3>
                  <span className="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-xs font-bold border border-rose-500/30">
                    {dispute.status}
                  </span>
                </div>

                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-2 text-xs">
                  <div className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Reason Reported</div>
                  <div className="text-white font-semibold text-sm">{dispute.reason}</div>
                  <p className="text-zinc-300 leading-relaxed mt-1">{dispute.description}</p>
                </div>

                {dispute.ai_score && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-xs space-y-1 text-purple-300">
                    <div className="flex items-center gap-2 font-bold text-purple-200">
                      <Sparkles className="w-4 h-4 text-purple-400" /> AI Evidence Assessment ({dispute.ai_score.confidence}% Confidence)
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-300">{dispute.ai_score.reasoning}</p>
                  </div>
                )}

                <div className="text-center pt-2">
                  <Link
                    href="/admin"
                    className="text-xs text-purple-400 hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    Open Ecobank Compliance Admin Resolution Portal <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Protection Summary (Right 1 col) */}
          <div className="space-y-6">
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 shadow-xl space-y-4 text-xs">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" /> How Protection Works
              </h3>

              <div className="space-y-3 text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#006B3F]/20 text-[#00874E] flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="leading-relaxed">Funds remain locked in Ecobank 256-bit vault during transit.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#006B3F]/20 text-[#00874E] flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="leading-relaxed">Seller dispatches item with verifiable tracking code or USSD PIN.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#006B3F]/20 text-[#00874E] flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="leading-relaxed">Buyer verifies condition upon arrival to release funds instantly.</p>
                </div>
              </div>

              <div className="border-t border-[#2A2A2A] pt-3 text-[11px] text-zinc-500 leading-relaxed">
                48-hour auto-release protection active. Backed by Ecobank Nigeria Fraud Protection Guarantee.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* DISPUTE MODAL */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" /> Raise Escrow Dispute
            </h3>
            <p className="text-xs text-zinc-400">
              Freezes escrow funds immediately. Ecobank Compliance team will review evidence within 4 hours.
            </p>

            <form onSubmit={handleRaiseDispute} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Dispute Reason</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-white"
                >
                  <option value="ITEM_NOT_RECEIVED">Item Not Received / Non-Delivery</option>
                  <option value="ITEM_DEFECTIVE">Item Defective / Damaged in Transit</option>
                  <option value="WRONG_ITEM">Wrong Item / Significantly Not as Described</option>
                  <option value="COUNTERFEIT">Counterfeit / Fake Item</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Detailed Explanation & Evidence</label>
                <textarea
                  required
                  rows={4}
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1A1A1A] text-zinc-300 hover:text-white border border-[#2A2A2A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-lg"
                >
                  Submit Dispute to Compliance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
