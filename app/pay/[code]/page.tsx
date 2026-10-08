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
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DisputeThread } from '@/components/dispute/DisputeThread';
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
  AlertCircle,
  LayoutDashboard,
  ShoppingBag,
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
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('ITEM_DEFECTIVE');
  const [disputeDesc, setDisputeDesc] = useState('');

  const [returnLogistics, setReturnLogistics] = useState('GIG');
  const [returnTrackingId, setReturnTrackingId] = useState('');
  const [returnProofUrl, setReturnProofUrl] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const handleReturnProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setReturnProofUrl(data.url);
    } catch {
      // Fallback
      setReturnProofUrl('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleReturnDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTrackingId || !returnProofUrl) {
      setActionError('Please enter tracking ID and upload waybill photo proof.');
      return;
    }
    setIsSubmittingReturn(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch('/api/dispute/return-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: tx?.id,
          buyer_id: user?.id || 'usr_buyer_tunde_02',
          return_logistics: returnLogistics,
          return_tracking_id: returnTrackingId,
          return_proof_urls: [returnProofUrl],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('Return package dispatched! Seller has been notified to confirm receipt.');
        loadData();
      } else {
        setActionError(data.error || 'Failed to dispatch return.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

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
      setNotFound(true);
    }
  };

  useEffect(() => {
    loadData();
  }, [code]);

  useEffect(() => {
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [code]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="text-center max-w-sm w-full space-y-4 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <Lock className="w-10 h-10 text-slate-300 mx-auto" />
            <h2 className="font-extrabold text-slate-900 text-base">Escrow Contract Not Found</h2>
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
    return <LoadingScreen message="Loading Escrow Contract..." />;
  }

  const isSeller = !!user && user.id === tx.seller_id;
  const isBuyer = !!user && !!tx.buyer_id && user.id === tx.buyer_id;
  const isPotentialBuyer = !!user && !isSeller && tx.state === 'CREATED';
  const isGuest = !user;
  const isThirdPartyOnClaimedContract = !isSeller && !isBuyer && tx.state !== 'CREATED';

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
      setShowReleaseModal(true);
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-6">

        {/* Top banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#006B3F] shrink-0" />
            <span className="truncate">
              Escrow Vault: <strong className="text-slate-900 font-mono text-[11px] sm:text-xs">{tx.code}</strong>{' '}
              {isSeller && <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[9px] sm:text-[10px] uppercase border border-amber-200">Your Listing</span>}
              {isBuyer && <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[9px] sm:text-[10px] uppercase border border-blue-200">Your Order</span>}
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ml-auto"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#006B3F]" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copied' : 'Copy Link'}
          </button>
        </div>

        {/* State Progress */}
        <StateProgressBar state={tx.state} />

        {/* Action Alerts */}
        {actionError && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-[#006B3F]" />
            {actionSuccess}
          </div>
        )}

        {/* Claimed Link Banner for Third Parties */}
        {isThirdPartyOnClaimedContract && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Escrow Link Already Claimed</h4>
              <p className="text-amber-800 leading-relaxed text-[11px] sm:text-xs">
                This escrow contract has already been paid for by a buyer and is currently in state <strong>{tx.state}</strong>. Escrow payment links are single-use per sale. If you wish to buy from this seller, please ask them for a new link.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-4 sm:space-y-6">

            {/* Product card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4">
              {tx.image_url && (
                <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={tx.image_url}
                    alt={tx.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-md text-white font-mono text-[10px] px-2.5 py-1 rounded-full font-bold">
                    Seller Verified Item
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                  {tx.category}
                </span>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2 leading-tight">{tx.title}</h1>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{tx.description}</p>
              </div>

              {/* Fee Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span>Item Price:</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">{formatNaira(tx.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-[11px]">
                  <span>Escrow Fee (0.75% max ₦500):</span>
                  <span>{formatNaira(tx.fee)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[#006B3F] font-bold text-xs sm:text-sm">
                  <span>Net Payout to Seller:</span>
                  <span>{formatNaira(tx.net_amount)}</span>
                </div>
              </div>

              {/* Seller Info */}
              {sellerProfile && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#006B3F] text-white flex items-center justify-center font-extrabold font-mono text-xs sm:text-sm shadow-2xs shrink-0">
                      {sellerProfile.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{sellerProfile.full_name}</span>
                        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#006B3F]" />
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {sellerProfile.completed_trades} Completed Deals • Verified
                      </div>
                    </div>
                  </div>
                  <TrustBadge score={sellerProfile.trust_score} tier={sellerProfile.trust_tier} compact />
                </div>
              )}
            </div>

            {/* SELLER VIEW: CREATED — Share link panel */}
            {isSeller && tx.state === 'CREATED' && (
              <div className="bg-white border border-amber-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-3.5">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-amber-600" /> Share This Link with Your Buyer
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This is your escrow payment link. Send it to your buyer via WhatsApp or Instagram DM.
                  Once they pay, you will be notified to dispatch.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-[11px] font-mono text-amber-900 truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/pay/${encodeURIComponent(tx.code)}` : `/pay/${encodeURIComponent(tx.code)}`}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="shrink-0 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {/* SELLER VIEW: PAID — Dispatch form */}
            {isSeller && tx.state === 'PAID' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-3.5">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#006B3F] font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Payment locked in escrow by {tx.buyer_name || 'buyer'}. Ready to dispatch!
                </div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-600" /> Dispatch Controls — Seller Only
                </h3>
                <form onSubmit={handleDispatch} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Select Logistics Provider</label>
                    <select
                      value={logisticsProvider}
                      onChange={(e) => setLogisticsProvider(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-medium text-xs"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono font-bold text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 sm:py-3 px-4 rounded-2xl text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    {isProcessing ? 'Updating Order...' : 'Confirm Dispatch & Send Tracking to Buyer'}
                  </button>
                </form>
              </div>
            )}

            {/* SELLER VIEW: DISPATCHED — Awaiting buyer confirmation */}
            {isSeller && tx.state === 'DISPATCHED' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-3.5">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" /> Awaiting Buyer Confirmation
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 sm:p-4 space-y-2 text-xs">
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
                      <span className="bg-emerald-100 text-[#006B3F] border border-emerald-200 px-2 py-0.5 rounded-lg font-extrabold text-[11px]">
                        *329*{tx.ussd_pin}#
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BUYER / GUEST VIEW: CREATED — Payment panel */}
            {(isBuyer || isPotentialBuyer || isGuest) && tx.state === 'CREATED' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#006B3F]" /> Select Payment Method
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentTab('WALLET')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-[11px] sm:text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentTab === 'WALLET'
                        ? 'bg-emerald-50 border-[#006B3F] text-[#006B3F]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-[#006B3F]" />
                    <span>Wallet</span>
                  </button>
                  <button
                    onClick={() => setPaymentTab('TRANSFER')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-[11px] sm:text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentTab === 'TRANSFER'
                        ? 'bg-emerald-50 border-[#006B3F] text-[#006B3F]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <span>Transfer</span>
                  </button>
                  <button
                    onClick={() => setPaymentTab('CARD')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-[11px] sm:text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentTab === 'CARD'
                        ? 'bg-emerald-50 border-[#006B3F] text-[#006B3F]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    <span>Card</span>
                  </button>
                </div>

                {/* WALLET */}
                {paymentTab === 'WALLET' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Your Wallet Balance:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {user ? formatNaira(user.simulated_balance) : 'Sign in to view'}
                      </span>
                    </div>
                    {!user ? (
                      <button
                        onClick={openAuthModal}
                        className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-bold py-2.5 sm:py-3 px-4 rounded-xl text-xs transition-all shadow-md"
                      >
                        Sign In to Pay via Blaze Wallet
                      </button>
                    ) : (
                      <button
                        onClick={handlePay}
                        disabled={isProcessing || isSeller || user.simulated_balance < tx.amount}
                        className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-bold py-2.5 sm:py-3 px-4 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
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
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3 text-xs">
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
                        <span className="font-bold text-slate-900 text-[11px]">BLAZE ESCROW #{tx.code.slice(-6)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                        <span>Virtual Account:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-900 text-sm sm:text-base">
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
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 sm:py-3 px-4 rounded-2xl text-xs transition-all shadow-md disabled:opacity-50"
                    >
                      {isSeller ? 'You are the seller' : !user ? 'Sign In First' : isProcessing ? 'Verifying Transfer...' : 'Simulate Bank Transfer Webhook'}
                    </button>
                  </div>
                )}

                {/* CARD */}
                {paymentTab === 'CARD' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3 text-xs">
                    <div className="space-y-1.5">
                      <label className="block text-slate-700 font-bold">Card Number</label>
                      <input
                        type="text"
                        disabled
                        value="5399 •••• •••• 4910 (Demo Card)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs"
                      />
                    </div>
                    <button
                      onClick={handlePay}
                      disabled={isProcessing || isSeller || !user}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 sm:py-3 px-4 rounded-2xl text-xs transition-all shadow-md disabled:opacity-50"
                    >
                      {isSeller ? 'You are the seller' : !user ? 'Sign In First' : isProcessing ? 'Authorizing Card...' : `Authorize ${formatNaira(tx.amount)} Payment`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* BUYER VIEW: PAID — Awaiting dispatch */}
            {isBuyer && tx.state === 'PAID' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-3">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" /> Payment Locked — Awaiting Seller Dispatch
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 sm:p-4 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#006B3F] shrink-0" />
                    Payment of {formatNaira(tx.amount)} locked in Ecobank Escrow Vault.
                  </div>
                  <p className="text-amber-700 text-[11px] leading-relaxed">
                    Seller notified to dispatch. This page will update once dispatched.
                  </p>
                </div>
              </div>
            )}

            {/* BUYER VIEW: DISPATCHED — Confirm delivery */}
            {isBuyer && tx.state === 'DISPATCHED' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#006B3F]" /> Delivery Confirmation
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2 text-xs">
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
                      <span className="bg-emerald-100 text-[#006B3F] border border-emerald-200 px-2 py-0.5 rounded-lg font-extrabold text-[11px]">
                        *329*{tx.ussd_pin}#
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={handleConfirmDelivery}
                    disabled={isProcessing}
                    className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-bold py-2.5 sm:py-3 px-4 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Confirm Delivery & Release
                  </button>
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 sm:py-3 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Raise Dispute
                  </button>
                </div>
              </div>
            )}

            {/* RELEASED state UI */}
            {tx.state === 'RELEASED' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4 text-xs">
                <div className="flex items-center gap-2 text-[#006B3F] font-extrabold text-sm sm:text-base">
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-[#006B3F]" /> Delivery Confirmed. Escrow Payout Released!
                </div>
                <p className="text-slate-700 leading-relaxed text-xs">
                  This escrow contract is fully settled and closed. Funds have been credited to the merchant&apos;s Ecobank Blaze account.
                </p>

                {/* Return to Dashboard Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Link
                    href="/dashboard"
                    className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-extrabold py-3 px-4 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 text-center"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Return to Dashboard
                  </Link>

                  <Link
                    href="/active-contracts"
                    className="w-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold py-3 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#006B3F]" /> View Active Contracts
                  </Link>
                </div>
              </div>
            )}

            {/* DISPUTED and Dispute Flow states */}
            {['DISPUTED', 'AWAITING_RETURN', 'RETURN_DISPATCHED', 'RETURN_CONFIRMED', 'DAMAGE_CLAIMED', 'PARTIAL_REFUND', 'REFUNDED'].includes(tx.state) && dispute && (
              <div className="space-y-4">
                {/* Dispute Summary Panel */}
                <div className="bg-white border border-rose-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-rose-700 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Dispute Active — Protection Window
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      ID: {dispute.id}
                    </span>
                  </div>

                  <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2.5 text-xs">
                    <div className="flex justify-between text-rose-800">
                      <span className="font-bold">Reason:</span>
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-rose-200">{dispute.reason}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-xs">{dispute.description}</p>
                    
                    {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
                      <div className="pt-2 border-t border-rose-200/80">
                        <span className="font-bold text-slate-700 text-[11px]">Buyer Claim Evidence:</span>
                        <div className="flex gap-2 mt-1.5 overflow-x-auto">
                          {dispute.evidence_urls.map((url, i) => (
                            <img key={i} src={url} alt="Evidence" className="w-16 h-16 object-cover rounded-lg border border-slate-300" />
                          ))}
                        </div>
                      </div>
                    )}

                    {dispute.ai_score && (
                      <div className="pt-2 border-t border-rose-200/80">
                        <p className="font-bold text-rose-800 text-[11px] flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#006B3F]" /> AI Assessment: <span className="text-slate-900 font-mono">{dispute.ai_score.recommendation} ({dispute.ai_score.confidence}% confidence)</span>
                        </p>
                        <p className="text-slate-600 text-[11px] mt-0.5 italic">{dispute.ai_score.reasoning}</p>
                      </div>
                    )}
                  </div>

                  {/* SELLER RESPONSE SECTION */}
                  {dispute.seller_acceptance === 'NO_RETURN' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-1">
                      <h4 className="font-bold text-[#006B3F] text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#006B3F]" /> Seller Accepted Claim
                      </h4>
                      <p className="text-slate-700 leading-relaxed">
                        The seller accepted your claim. No return is required. An Ecobank compliance admin will process your refund shortly.
                      </p>
                    </div>
                  )}

                  {dispute.seller_acceptance === 'CONTESTED' && (
                    <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs space-y-1">
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-blue-600" /> Seller Contested Claim
                      </h4>
                      <p className="text-slate-600 leading-relaxed">
                        The seller has submitted counter-evidence. Ecobank Compliance team is reviewing both sides before issuing a binding ruling.
                      </p>
                    </div>
                  )}

                  {(dispute.seller_acceptance === 'RETURN_REQUIRED' || tx.state === 'AWAITING_RETURN') && (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3.5 text-xs">
                      <div className="flex items-center gap-2 text-amber-900 font-bold">
                        <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                        Action Required: Return Dispatch Required
                      </div>
                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        The seller has requested the item be returned before refund processing. Please dispatch the package back to the seller and upload proof below.
                      </p>

                      {/* RETURN DISPATCH FORM */}
                      <form onSubmit={handleReturnDispatchSubmit} className="bg-white border border-amber-200 rounded-xl p-3.5 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-700">Logistics Provider</label>
                            <select
                              value={returnLogistics}
                              onChange={(e) => setReturnLogistics(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                            >
                              <option value="GIG">GIG Logistics</option>
                              <option value="KWIK">Kwik Delivery</option>
                              <option value="SENDBOX">Sendbox</option>
                              <option value="CAMPUS_DIRECT">Campus Direct Courier</option>
                              <option value="OTHER">Other Partner</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-700">Return Tracking ID</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. RET-GIG-99201"
                              value={returnTrackingId}
                              onChange={(e) => setReturnTrackingId(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-700">Upload Return Proof (Waybill / Receipt Photo)</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleReturnProofUpload}
                              className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                            />
                            {isUploadingProof && <span className="text-[11px] text-amber-700 animate-pulse">Uploading proof...</span>}
                          </div>
                          {returnProofUrl && (
                            <div className="mt-1.5 flex items-center gap-2">
                              <img src={returnProofUrl} alt="Return Proof" className="w-12 h-12 object-cover rounded-lg border border-slate-300" />
                              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Proof attached
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingReturn || !returnTrackingId || !returnProofUrl}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmittingReturn ? 'Submitting Dispatch...' : 'Submit Return Dispatch & Notify Seller'}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* RETURN DISPATCHED tracking view */}
                  {tx.state === 'RETURN_DISPATCHED' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2 text-xs">
                      <h4 className="font-bold text-blue-900 text-xs flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" /> Return In Transit
                      </h4>
                      <p className="text-slate-700 text-[11px]">
                        Your return is on its way. Tracking ID: <span className="font-mono font-bold text-blue-950">{tx.return_tracking_id}</span> via <span className="font-bold">{tx.return_logistics}</span>.
                      </p>
                      <p className="text-slate-500 text-[11px] italic">
                        Waiting for seller to confirm item receipt.
                      </p>
                    </div>
                  )}

                  {/* RESOLUTION SECTION */}
                  {tx.state === 'REFUNDED' && (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-1 text-xs">
                      <h4 className="font-bold text-[#006B3F] text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#006B3F]" /> Dispute Resolved — Refunded
                      </h4>
                      <p className="text-slate-700 leading-relaxed font-medium">
                        Your refund of <span className="font-bold font-mono text-[#006B3F]">{formatNaira(tx.partial_buyer_amount || tx.amount)}</span> has been credited to your Blaze wallet balance.
                      </p>
                      {dispute.resolution_note && (
                        <p className="text-slate-500 text-[11px] pt-1 italic border-t border-emerald-200/60 mt-1">
                          Compliance Rationale: {dispute.resolution_note}
                        </p>
                      )}
                    </div>
                  )}

                  {tx.state === 'PARTIAL_REFUND' && (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-1 text-xs">
                      <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-amber-600" /> Dispute Partially Resolved
                      </h4>
                      <p className="text-slate-800 leading-relaxed font-medium">
                        This dispute was partially resolved. <span className="font-bold font-mono text-amber-950">{formatNaira(tx.partial_buyer_amount || (tx.amount / 2))}</span> has been credited to your Blaze wallet balance.
                      </p>
                      {dispute.resolution_note && (
                        <p className="text-slate-600 text-[11px] pt-1 italic border-t border-amber-200/60 mt-1">
                          Compliance Rationale: {dispute.resolution_note}
                        </p>
                      )}
                    </div>
                  )}

                  {tx.state === 'RELEASED' && (
                    <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 space-y-1 text-xs">
                      <h4 className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600" /> Dispute Resolved in Seller Favor
                      </h4>
                      <p className="text-slate-700 leading-relaxed">
                        This dispute was resolved in the seller&apos;s favour. Funds have been released to the merchant.
                      </p>
                      {dispute.resolution_note && (
                        <p className="text-slate-500 text-[11px] pt-1 italic border-t border-rose-200/60 mt-1">
                          Compliance Rationale: {dispute.resolution_note}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* DISPUTE THREAD LOG */}
                <DisputeThread disputeId={dispute.id} currentUserId={user?.id || 'usr_buyer_tunde_02'} currentUserRole="buyer" />
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#006B3F]" /> Vault Guarantees
              </h3>
              <div className="space-y-2.5 text-slate-600 text-[11px] sm:text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-[#006B3F] flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">1</div>
                  <p className="leading-relaxed">Funds locked in Ecobank 256-bit vault.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-[#006B3F] flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">2</div>
                  <p className="leading-relaxed">Dispatched with tracking code or *329# USSD PIN.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-[#006B3F] flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">3</div>
                  <p className="leading-relaxed">Buyer verifies item to release payout.</p>
                </div>
              </div>
            </div>

            {/* Contract metadata */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-2.5 text-xs font-mono">
              <h3 className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wider">Contract Details</h3>
              <div className="space-y-1.5 text-slate-600 text-[11px]">
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
        <div className="fixed inset-0 z-50 glass-modal flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowDisputeModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs"
                >
                  <option value="ITEM_DEFECTIVE">Item Defective / Not Working</option>
                  <option value="WRONG_ITEM">Received Wrong Item</option>
                  <option value="NOT_DELIVERED">Package Never Delivered</option>
                  <option value="COUNTERFEIT">Counterfeit / Fake Product</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Dispute Description & Evidence Details</label>
                <textarea
                  required
                  rows={3}
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {isProcessing ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST-RELEASE SUCCESS DASHBOARD NAVIGATION MODAL */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 glass-modal flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowReleaseModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-emerald-100 border border-emerald-200 text-[#006B3F] rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">Escrow Funds Released!</h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Delivery has been confirmed and escrow funds have been credited. No need to press browser back button!
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/dashboard"
                className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" /> Return to Merchant Dashboard
              </Link>

              <Link
                href="/active-contracts"
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold py-3 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#006B3F]" /> View Active Contracts
              </Link>

              <button
                onClick={() => setShowReleaseModal(false)}
                className="w-full text-slate-500 hover:text-slate-900 font-semibold py-2 text-xs transition-colors"
              >
                Stay on Contract Page
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
