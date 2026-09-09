'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { mockStore } from '@/lib/mock/store';
import { transitionEscrowState } from '@/lib/escrow/stateMachine';
import { EscrowTransaction, Profile, Dispute } from '@/lib/mock/types';
import { formatNaira, formatDate } from '@/lib/formatters';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
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
  Clock,
  X,
  Info,
  CheckCircle2,
} from 'lucide-react';

export default function EscrowPaymentPage() {
  const params = useParams();
  const rawCode = (params?.code as string) || '';
  const code = rawCode.startsWith('%23')
    ? decodeURIComponent(rawCode)
    : rawCode.startsWith('#')
    ? rawCode
    : `#${rawCode}`;

  const { user, openAuthModal, refreshProfile } = useAuth();

  const [tx, setTx] = useState<EscrowTransaction | null>(null);
  const [sellerProfile, setSellerProfile] = useState<Profile | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [paymentTab, setPaymentTab] = useState<'WALLET' | 'TRANSFER' | 'CARD'>('WALLET');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [trackingId, setTrackingId] = useState('');
  const [logisticsProvider, setLogisticsProvider] = useState<'GIG' | 'KWIK' | 'SENDBOX' | 'CAMPUS_DIRECT' | 'OTHER'>('CAMPUS_DIRECT');

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('ITEM_DEFECTIVE');
  const [disputeDesc, setDisputeDesc] = useState('');

  const loadData = async () => {
    try {
      const res = await fetch(`/api/transactions?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.transaction) {
        setTx({ ...data.transaction });
        if (data.seller) setSellerProfile(data.seller);
        if (data.dispute) setDispute(data.dispute);
        return;
      }
    } catch (e) {}

    // Fallback to client store
    const item = mockStore.getTransactionByCode(code);
    if (item) {
      setTx({ ...item });
      const seller = mockStore.getProfileById(item.seller_id);
      if (seller) setSellerProfile(seller);
      const d = mockStore.getDisputeByTxId(item.id);
      if (d) setDispute(d);
    } else {
      // UX8: Mark not found so we show an error card instead of infinite loading
      setNotFound(true);
    }
  };

  useEffect(() => {
    loadData();
  }, [code]);

  // Live polling — 3s interval so buyer and seller see real-time state transitions
  useEffect(() => {
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [code]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm space-y-4 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <Lock className="w-10 h-10 text-slate-300 mx-auto" />
            <h2 className="font-extrabold text-slate-900">Escrow Contract Not Found</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              This escrow link is invalid, expired, or has been removed. Please verify the link from your seller.
            </p>
            <Link href="/" className="inline-block px-5 py-2.5 bg-[#006B3F] text-white rounded-2xl font-bold text-xs shadow-md">Back to Home</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 text-sm font-medium">
        Loading Escrow Contract...
      </div>
    );
  }

  // BUG-001: Fixed operator precedence — was: !!user && tx.buyer_id ? ... (evaluates tx.buyer_id as truthy string)
  // Now correctly: all three parts are boolean-AND'd before comparison
  const isSeller = !!user && user.id === tx.seller_id;
  const isBuyer = !!user && !!tx.buyer_id && user.id === tx.buyer_id;
  const isPotentialBuyer = !!user && !isSeller && tx.state === 'CREATED';
  const isGuest = !user;

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

  const handlePay = async () => {
    setActionError('');
    setActionSuccess('');

    if (!user) {
      openAuthModal();
      return;
    }

    if (isSeller) {
      setActionError('You are the seller of this contract. Share this link with your buyer to receive payment.');
      return;
    }

    setIsProcessing(true);

    const res = await transitionEscrowState(tx.id, 'PAY', {
      buyer_id: user.id,
      payment_method: paymentTab,
    });

    if (res.success && res.transaction) {
      setTx({ ...res.transaction });
      setActionSuccess('Payment locked in Escrow vault! Seller has been notified to dispatch.');
      refreshProfile();
      loadData();
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
      setActionSuccess('Item marked as dispatched. Buyer has been notified!');
      loadData();
    } else {
      setActionError(res.error || 'Failed to update dispatch status.');
    }
    setIsProcessing(false);
  };

  const handleConfirmDelivery = async () => {
    setActionError('');
    setActionSuccess('');
    setIsProcessing(true);

    const res = await transitionEscrowState(tx.id, 'CONFIRM', {
      buyer_id: user?.id,
    });

    if (res.success && res.transaction) {
      setTx({ ...res.transaction });
      setActionSuccess('Delivery confirmed! Escrow funds released to seller.');
      refreshProfile();
      loadData();
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
      setActionSuccess('Dispute submitted. Escrow funds frozen pending Ecobank Compliance review.');
      loadData();
    } else {
      setActionError(res.error || 'Failed to log dispute.');
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">

        {/* Top banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#006B3F] shrink-0" />
            <span>
              Escrow Vault: <strong className="text-slate-900 font-mono">{tx.code}</strong>{' '}
              {isSeller && <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] uppercase border border-amber-200">Your Listing</span>}
              {isBuyer && <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] uppercase border border-blue-200">Your Order</span>}
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#006B3F]" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copied' : 'Copy Link'}
          </button>
        </div>

        {/* State Progress */}
        <StateProgressBar state={tx.state} />

        {/* Action Alerts */}
        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-[#006B3F]" />
            {actionSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content — 2 cols */}
          <div className="md:col-span-2 space-y-6">

            {/* Product card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                  {tx.category}
                </span>
                <h1 className="text-xl font-extrabold text-slate-900 mt-2 leading-tight">{tx.title}</h1>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{tx.description}</p>
              </div>

              {/* Fee Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span>Item Price:</span>
                  <span className="text-sm font-bold text-slate-900">{formatNaira(tx.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Escrow Fee (0.75% max ₦500):</span>
                  <span>{formatNaira(tx.fee)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[#006B3F] font-bold">
                  <span>Net Payout to Seller:</span>
                  <span>{formatNaira(tx.net_amount)}</span>
                </div>
              </div>

              {/* Seller Info */}
              {sellerProfile && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#006B3F] text-white flex items-center justify-center font-extrabold font-mono text-sm shadow-xs">
                      {sellerProfile.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{sellerProfile.full_name}</span>
                        <ShieldCheck className="w-4 h-4 text-[#006B3F]" />
                      </div>
                      <div className="text-xs text-slate-500">
                        {sellerProfile.completed_trades} Completed Deals • Verified Seller
                      </div>
                    </div>
                  </div>
                  <TrustBadge score={sellerProfile.trust_score} tier={sellerProfile.trust_tier} compact />
                </div>
              )}
            </div>

            {/* ============================================================
                ROLE-AWARE ACTION PANELS
                ============================================================ */}

            {/* ---- SELLER VIEW: CREATED — Share link panel ---- */}
            {isSeller && tx.state === 'CREATED' && (
              <div className="bg-white border border-amber-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-amber-600" /> Share This Link with Your Buyer
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This is your escrow payment link. Send it to your buyer via WhatsApp, Instagram DM, or any channel.
                  Once they pay, you&apos;ll be notified here to dispatch the item.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-amber-900 break-all">
                    {typeof window !== 'undefined' ? `${window.location.origin}/pay/${encodeURIComponent(tx.code)}` : `/pay/${encodeURIComponent(tx.code)}`}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="shrink-0 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Link expires: <strong className="text-slate-700">{formatDate(tx.expires_at)}</strong></span>
                </div>
              </div>
            )}

            {/* ---- SELLER VIEW: PAID — Dispatch form ---- */}
            {isSeller && tx.state === 'PAID' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#006B3F] font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Payment locked in escrow by {tx.buyer_name || 'buyer'}. Ready to dispatch!
                </div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-600" /> Dispatch Controls — Seller Only
                </h3>
                <form onSubmit={handleDispatch} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Select Logistics Provider</label>
                    <select
                      value={logisticsProvider}
                      onChange={(e) => setLogisticsProvider(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium"
                    >
                      <option value="CAMPUS_DIRECT">Campus Direct (Handshake USSD PIN)</option>
                      <option value="GIG">GIG Logistics</option>
                      <option value="KWIK">Kwik Delivery Express</option>
                      <option value="SENDBOX">Sendbox Courier</option>
                      <option value="OTHER">Other Courier</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Waybill / Tracking Reference</label>
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder="e.g. KWK-NG-8849102"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-2xl text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    {isProcessing ? 'Updating Order...' : 'Confirm Dispatch & Send Tracking to Buyer'}
                  </button>
                </form>
              </div>
            )}

            {/* ---- SELLER VIEW: DISPATCHED — Awaiting buyer confirmation ---- */}
            {isSeller && tx.state === 'DISPATCHED' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" /> Awaiting Buyer Confirmation
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Logistics:</span>
                    <span className="font-bold text-slate-900">{tx.logistics}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-mono">
                    <span>Tracking:</span>
                    <span className="text-purple-700 font-bold">{tx.tracking_id}</span>
                  </div>
                  {tx.ussd_pin && (
                    <div className="flex justify-between text-slate-600 font-mono border-t border-blue-200 pt-2">
                      <span>USSD PIN for buyer:</span>
                      <span className="bg-emerald-100 text-[#006B3F] border border-emerald-200 px-2 py-0.5 rounded-lg font-extrabold text-xs">
                        *329*{tx.ussd_pin}#
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                  Escrow funds of <strong>{formatNaira(tx.net_amount)}</strong> will be released to your wallet once the buyer confirms receipt.
                </p>
              </div>
            )}

            {/* ---- SELLER VIEW: terminal states ---- */}
            {isSeller && tx.state === 'RELEASED' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-[#006B3F] font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5" /> Funds Released to Your Wallet
                </div>
                <p className="text-xs text-slate-600">
                  <strong>{formatNaira(tx.net_amount)}</strong> has been credited to your Blaze Escrow wallet balance.
                </p>
              </div>
            )}

            {/* ---- BUYER / GUEST VIEW: CREATED — Payment panel ---- */}
            {(isBuyer || isPotentialBuyer || isGuest) && tx.state === 'CREATED' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#006B3F]" /> Select Payment Method
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentTab('WALLET')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      paymentTab === 'WALLET'
                        ? 'bg-emerald-50 border-[#006B3F] text-[#006B3F]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-[#006B3F]" />
                    <span>Blaze Wallet</span>
                  </button>
                  <button
                    onClick={() => setPaymentTab('TRANSFER')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      paymentTab === 'TRANSFER'
                        ? 'bg-emerald-50 border-[#006B3F] text-[#006B3F]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span>Bank Transfer</span>
                  </button>
                  <button
                    onClick={() => setPaymentTab('CARD')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      paymentTab === 'CARD'
                        ? 'bg-emerald-50 border-[#006B3F] text-[#006B3F]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span>Debit Card</span>
                  </button>
                </div>

                {/* WALLET */}
                {paymentTab === 'WALLET' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Your Wallet Balance:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {user ? formatNaira(user.simulated_balance) : 'Sign in to view'}
                      </span>
                    </div>
                    {!user ? (
                      <button
                        onClick={openAuthModal}
                        className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md"
                      >
                        Sign In to Pay via Blaze Wallet
                      </button>
                    ) : (
                      <button
                        onClick={handlePay}
                        disabled={isProcessing || isSeller || user.simulated_balance < tx.amount}
                        className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-bold py-3 px-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                      >
                        {isProcessing ? 'Locking in Escrow...' : `Pay ${formatNaira(tx.amount)} via Escrow Vault`}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    {user && user.simulated_balance < tx.amount && (
                      <p className="text-[11px] text-rose-600 font-semibold">Insufficient wallet balance.</p>
                    )}
                  </div>
                )}

                {/* TRANSFER */}
                {paymentTab === 'TRANSFER' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                    <p className="text-slate-600 leading-relaxed">
                      Transfer exact amount to this dedicated virtual escrow account.
                    </p>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Bank Name:</span>
                        <span className="font-bold text-slate-900">Ecobank Nigeria</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Account Name:</span>
                        <span className="font-bold text-slate-900">BLAZE ESCROW VAULT #{tx.code.slice(-6)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                        <span>Virtual Account:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-900 text-base">
                            {tx.transfer_account || '9920194810'}
                          </span>
                          <button
                            onClick={handleCopyBank}
                            className="p-1 rounded bg-slate-100 text-slate-600 hover:text-slate-900"
                          >
                            {copiedBank ? <Check className="w-3.5 h-3.5 text-[#006B3F]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handlePay}
                      disabled={isProcessing || isSeller || !user}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl text-xs transition-all shadow-md disabled:opacity-50"
                    >
                      {isSeller ? 'You are the seller' : !user ? 'Sign In First' : isProcessing ? 'Verifying Transfer...' : 'Simulate Bank Transfer Webhook'}
                    </button>
                  </div>
                )}

                {/* CARD */}
                {paymentTab === 'CARD' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                    <div className="space-y-1.5">
                      <label className="block text-slate-700 font-bold">Card Number</label>
                      <input
                        type="text"
                        disabled
                        value="5399 •••• •••• 4910 (Demo Card)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono"
                      />
                    </div>
                    <button
                      onClick={handlePay}
                      disabled={isProcessing || isSeller || !user}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-2xl text-xs transition-all shadow-md disabled:opacity-50"
                    >
                      {isSeller ? 'You are the seller' : !user ? 'Sign In First' : isProcessing ? 'Authorizing Card...' : `Authorize ${formatNaira(tx.amount)} Payment`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ---- BUYER VIEW: PAID — Awaiting dispatch ---- */}
            {isBuyer && tx.state === 'PAID' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" /> Payment Locked — Awaiting Seller Dispatch
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#006B3F]" />
                    Your payment of <strong>{formatNaira(tx.amount)}</strong> is safely locked in the Ecobank Escrow Vault.
                  </div>
                  <p className="text-amber-700 leading-relaxed">
                    The seller has been notified to dispatch. This page will automatically update when the item is dispatched.
                  </p>
                </div>
              </div>
            )}

            {/* ---- BUYER VIEW: DISPATCHED — Confirm delivery ---- */}
            {isBuyer && tx.state === 'DISPATCHED' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#006B3F]" /> Delivery Confirmation
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Logistics Method:</span>
                    <span className="font-bold text-slate-900">{tx.logistics || 'CAMPUS_DIRECT'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-mono">
                    <span>Tracking Reference:</span>
                    <span className="text-purple-700 font-bold">{tx.tracking_id || 'TRK-901823'}</span>
                  </div>
                  {tx.ussd_pin && (
                    <div className="flex justify-between text-slate-600 font-mono border-t border-slate-200 pt-2">
                      <span>Offline USSD PIN:</span>
                      <span className="bg-emerald-100 text-[#006B3F] border border-emerald-200 px-2 py-0.5 rounded-lg font-extrabold text-xs">
                        *329*{tx.ussd_pin}#
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleConfirmDelivery}
                    disabled={isProcessing}
                    className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-bold py-3 px-4 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Confirm Delivery & Release
                  </button>
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-3 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Raise Dispute
                  </button>
                </div>
              </div>
            )}

            {/* ---- BUYER VIEW: RELEASED ---- */}
            {isBuyer && tx.state === 'RELEASED' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-[#006B3F] font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5" /> Delivery Confirmed. Funds Released to Seller.
                </div>
                <p className="text-xs text-slate-600">
                  This escrow contract is now closed. Thank you for using Blaze Escrow!
                </p>
              </div>
            )}

            {/* ---- DISPUTED state — visible to all parties ---- */}
            {tx.state === 'DISPUTED' && (
              <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-rose-700 text-sm uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Dispute Filed — Funds Frozen
                </h3>
                {dispute && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-rose-700">
                      <span className="font-bold">Dispute Reason:</span>
                      <span className="font-mono">{dispute.reason}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{dispute.description}</p>
                    {dispute.ai_score && (
                      <div className="pt-2 border-t border-rose-200">
                        <p className="font-bold text-rose-700">AI Recommendation: <span className="text-slate-900">{dispute.ai_score.recommendation}</span></p>
                        <p className="text-slate-500 leading-relaxed mt-1">{dispute.ai_score.reasoning}</p>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  Ecobank Compliance team will review and resolve within 48–72 hours. Funds remain frozen until resolution.
                </p>
              </div>
            )}

            {/* ---- Guest CTA on non-CREATED states ---- */}
            {isGuest && tx.state !== 'CREATED' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3 text-center">
                <p className="text-xs text-slate-600">Sign in to track your role in this escrow contract.</p>
                <button
                  onClick={openAuthModal}
                  className="px-6 py-2.5 bg-[#006B3F] hover:bg-[#005432] text-white font-bold rounded-2xl text-xs shadow-md"
                >
                  Sign In
                </button>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#006B3F]" /> Vault Guarantees
              </h3>
              <div className="space-y-3 text-slate-600">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#006B3F] flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">1</div>
                  <p className="leading-relaxed">Funds locked in Ecobank 256-bit vault.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#006B3F] flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">2</div>
                  <p className="leading-relaxed">Dispatched with tracking code or *329# USSD PIN.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#006B3F] flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">3</div>
                  <p className="leading-relaxed">Buyer verifies item to release payout.</p>
                </div>
              </div>
            </div>

            {/* Contract metadata */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 text-xs font-mono">
              <h3 className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wider">Contract Details</h3>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold text-slate-900 uppercase">{tx.state}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="text-slate-800">{formatDate(tx.created_at)}</span>
                </div>
                {tx.buyer_name && (
                  <div className="flex justify-between">
                    <span>Buyer:</span>
                    <span className="font-bold text-blue-700">{tx.buyer_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Expires:</span>
                  <span className="text-rose-600 font-bold">{formatDate(tx.expires_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* DISPUTE MODAL */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 glass-modal flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowDisputeModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" /> Raise Escrow Dispute
            </h3>
            <p className="text-xs text-slate-500">
              Freezes escrow funds immediately. Ecobank Compliance team will review evidence within 48–72 hours.
            </p>

            <form onSubmit={handleRaiseDispute} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Dispute Reason</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium"
                >
                  <option value="ITEM_NOT_RECEIVED">Item Not Received / Non-Delivery</option>
                  <option value="ITEM_DEFECTIVE">Item Defective / Damaged in Transit</option>
                  <option value="WRONG_ITEM">Wrong Item Delivered</option>
                  <option value="COUNTERFEIT">Counterfeit Item</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Detailed Explanation</label>
                <textarea
                  required
                  rows={4}
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Describe the defect or issue in detail..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md"
                >
                  Submit Dispute
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
