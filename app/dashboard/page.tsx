'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ShareCardModal } from '@/components/escrow/ShareCardModal';
import { TrustBadge } from '@/components/trust/TrustBadge';
import { formatNaira, formatDate, calculateEscrowFee } from '@/lib/formatters';
import { mockStore } from '@/lib/mock/store';
import { EscrowTransaction, Withdrawal } from '@/lib/mock/types';
import confetti from 'canvas-confetti';
import {
  Link as LinkIcon,
  PlusCircle,
  Copy,
  Check,
  Landmark,
  Share2,
  ExternalLink,
  RefreshCw,
  X,
  MessageSquare,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, openAuthModal, isLoading, refreshProfile } = useAuth();

  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [historyTab, setHistoryTab] = useState<'ESCROW' | 'PAYOUTS'>('ESCROW');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Fashion & Apparel');
  const [amountNaira, setAmountNaira] = useState('');
  const [logistics, setLogistics] = useState<'GIG' | 'KWIK' | 'SENDBOX' | 'CAMPUS_DIRECT' | 'OTHER'>('CAMPUS_DIRECT');

  const [generatedLink, setGeneratedLink] = useState<EscrowTransaction | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const [activeShareTx, setActiveShareTx] = useState<EscrowTransaction | null>(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('Ecobank Nigeria');
  const [accountNumber, setAccountNumber] = useState('30987654321');
  const [accountName, setAccountName] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [activeReceipt, setActiveReceipt] = useState<Withdrawal | null>(null);

  useEffect(() => {
    if (user?.full_name) {
      setAccountName(user.full_name);
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const resTx = await fetch(`/api/transactions?seller_id=${user.id}`);
      const dataTx = await resTx.json();
      if (dataTx.transactions) {
        setTransactions(dataTx.transactions);
      } else {
        const local = mockStore.getAllTransactions().filter((t) => t.seller_id === user.id);
        setTransactions(local);
      }

      const resW = await fetch(`/api/withdraw?seller_id=${user.id}`);
      const dataW = await resW.json();
      if (dataW.withdrawals) {
        setWithdrawals(dataW.withdrawals);
      } else {
        setWithdrawals(mockStore.getWithdrawals(user.id));
      }
    } catch {
      const local = mockStore.getAllTransactions().filter((t) => t.seller_id === user.id);
      setTransactions(local);
      setWithdrawals(mockStore.getWithdrawals(user.id));
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    loadData();
    refreshProfile();
    const interval = setInterval(() => {
      loadData();
      refreshProfile();
    }, 3000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center text-center p-4">
        <div className="text-xs font-mono font-bold text-[#006B3F] animate-pulse">
          Loading Merchant Dashboard...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center text-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Access Merchant Dashboard</h2>
          <p className="text-xs text-slate-600 leading-relaxed">Please sign in to manage your Blaze Escrow links and bank payouts.</p>
          <button
            onClick={openAuthModal}
            className="w-full py-3 bg-[#006B3F] hover:bg-[#005432] text-white font-bold rounded-2xl text-xs transition-all shadow-md"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  const numAmount = (parseFloat(amountNaira) || 0) * 100;
  const feeKobo = calculateEscrowFee(numAmount);
  const netKobo = Math.max(0, numAmount - feeKobo);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) return;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: user.id,
          title,
          description,
          category,
          amount: numAmount,
          logistics,
        }),
      });
      const data = await res.json();

      if (data.success && data.transaction) {
        setGeneratedLink(data.transaction);
        mockStore.saveTransaction(data.transaction);
        loadData();
        refreshProfile();
        try {
          confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
        } catch (err) {}
      }
    } catch (err) {
      const fallbackTx = mockStore.createEscrowLink({
        seller_id: user.id,
        title,
        description,
        category,
        amount: numAmount,
        logistics,
      });
      setGeneratedLink(fallbackTx);
      loadData();
    }
  };

  const handleCopyLink = () => {
    if (generatedLink && typeof window !== 'undefined') {
      const url = `${window.location.origin}/pay/${encodeURIComponent(generatedLink.code)}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopySocialText = () => {
    if (generatedLink && typeof window !== 'undefined') {
      const url = `${window.location.origin}/pay/${encodeURIComponent(generatedLink.code)}`;
      const text = `Buy ${generatedLink.title} safely with Ecobank Escrow protection! 🔒\nPrice: ${formatNaira(generatedLink.amount)}\nPay via Escrow Link: ${url}`;
      navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMsg('');
    setWithdrawError('');
    const amountKobo = Math.round((parseFloat(withdrawAmount) || 0) * 100);

    if (!amountKobo || amountKobo <= 0) {
      setWithdrawError('Please enter a valid payout amount.');
      return;
    }
    if (amountKobo > user.simulated_balance) {
      setWithdrawError(`Insufficient balance. Available: ${formatNaira(user.simulated_balance)}`);
      return;
    }

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: user.id,
          amount_kobo: amountKobo,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
        }),
      });
      const data = await res.json();

      if (data.success && data.new_balance !== undefined) {
        const localProfile = mockStore.getProfileById(user.id);
        if (localProfile) {
          localProfile.simulated_balance = data.new_balance;
          mockStore.saveProfile(localProfile);
        }
        await loadData();
        refreshProfile();
        setHistoryTab('PAYOUTS');
        setWithdrawMsg('Withdrawal processed instantly to your linked Ecobank Blaze Account!');
        setTimeout(() => {
          setShowWithdrawModal(false);
          setWithdrawMsg('');
          setWithdrawAmount('');
        }, 1500);
      } else {
        setWithdrawError(data.error || 'Payout failed. Please try again.');
      }
    } catch (e) {
      setWithdrawError('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">Merchant Escrow Dashboard</h1>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">
              Welcome back, <span className="text-[#006B3F] font-bold">{user.full_name}</span> • Ecobank Blaze Merchant
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <a
              href="#create-link"
              className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 text-center"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" /> Create Link
            </a>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs text-center"
            >
              <Landmark className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Bank Payout
            </button>
          </div>
        </div>

        {/* Ecobank Amber Banner */}
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/50 to-white border border-amber-200 rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
              <Landmark className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900 text-xs sm:text-sm">Linked Ecobank Blaze Account</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                  ACTIVE
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-600 font-mono mt-0.5 font-medium leading-relaxed">
                Account: <strong className="text-slate-900">30987654321</strong> • Credit Limit:{' '}
                <strong className="text-[#006B3F]">{formatNaira(user.credit_limit)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <TrustBadge score={user.trust_score} tier={user.trust_tier} compact />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 space-y-1 shadow-2xs">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Available Balance</span>
            <div className="text-base sm:text-2xl font-extrabold text-slate-900 font-mono truncate">{formatNaira(user.simulated_balance)}</div>
            <span className="text-[10px] sm:text-[11px] text-[#006B3F] font-bold block truncate">Instant Payout</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 space-y-1 shadow-2xs">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Sales Volume</span>
            <div className="text-base sm:text-2xl font-extrabold text-slate-900 font-mono truncate">{formatNaira(user.total_volume)}</div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block truncate">Lifetime Sales</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 space-y-1 shadow-2xs">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="text-base sm:text-2xl font-extrabold text-slate-900 font-mono truncate">{user.completed_trades} Deals</div>
            <span className="text-[10px] sm:text-[11px] text-purple-700 font-bold block truncate">0.0% Disputes</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 space-y-1 shadow-2xs">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Trust Score</span>
            <div className="text-base sm:text-2xl font-extrabold text-[#006B3F] font-mono truncate">{user.trust_score}<span className="text-xs text-slate-400">/100</span></div>
            <span className="text-[10px] sm:text-[11px] text-amber-700 font-bold block truncate">{user.trust_tier} Status</span>
          </div>
        </div>

        {/* Link Generator */}
        <div id="create-link" className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#006B3F]" /> Instant Escrow Link Generator
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Generate payment link with 0.75% escrow logic for WhatsApp & Instagram.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <form onSubmit={handleCreateLink} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Vintage Levi 90s Oversized Denim Jacket"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-[#006B3F] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-slate-900 font-medium text-xs"
                  >
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Campus Textbooks">Campus Textbooks</option>
                    <option value="Beauty & Skincare">Beauty & Skincare</option>
                    <option value="Gadgets & Accessories">Gadgets & Accessories</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Price (NGN ₦)</label>
                  <input
                    type="number"
                    required
                    value={amountNaira}
                    onChange={(e) => setAmountNaira(e.target.value)}
                    placeholder="18500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-[#006B3F] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Item Description / Condition</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Grade A thrift condition, XL size..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-[#006B3F] text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Logistics Preference</label>
                <select
                  value={logistics}
                  onChange={(e) => setLogistics(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-medium text-xs"
                >
                  <option value="CAMPUS_DIRECT">Campus Direct (Handshake USSD PIN)</option>
                  <option value="GIG">GIG Logistics</option>
                  <option value="KWIK">Kwik Delivery Express</option>
                  <option value="SENDBOX">Sendbox Courier</option>
                  <option value="OTHER">Other Courier</option>
                </select>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#006B3F] hover:bg-[#005432] text-white font-extrabold text-xs transition-all shadow-md"
                >
                  Generate Escrow Link
                </button>
              </div>
            </form>

            {/* Generated Link Preview */}
            <div className="flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              {!generatedLink ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <LinkIcon className="w-8 h-8 opacity-40" />
                  <p className="text-xs">Fill the form to generate your escrow link & share card.</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[#006B3F] font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    Escrow Link Created! Share with buyer.
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono">CODE: {generatedLink.code}</span>
                    <h4 className="font-bold text-slate-900 text-sm truncate">{generatedLink.title}</h4>
                    <div className="text-[#006B3F] font-mono font-bold text-sm">
                      {formatNaira(generatedLink.amount)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleCopyLink}
                      className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedLink ? 'Copied Link!' : 'Copy Direct Payment Link'}
                    </button>

                    <button
                      onClick={() => setActiveShareTx(generatedLink)}
                      className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Open WhatsApp & IG Share Card
                    </button>

                    <button
                      onClick={handleCopySocialText}
                      className="w-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-[#006B3F]" /> : <MessageSquare className="w-3.5 h-3.5 text-[#006B3F]" />}
                      {copiedText ? 'Copied Caption!' : 'Copy Raw Text Caption'}
                    </button>

                    <Link
                      href={`/pay/${encodeURIComponent(generatedLink.code)}`}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Buyer Page
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity & History Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setHistoryTab('ESCROW')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  historyTab === 'ESCROW'
                    ? 'bg-[#006B3F] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Escrow Contracts ({transactions.length})
              </button>
              <button
                onClick={() => setHistoryTab('PAYOUTS')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  historyTab === 'PAYOUTS'
                    ? 'bg-[#006B3F] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                Bank Payout History ({withdrawals.length})
              </button>
            </div>

            <button onClick={loadData} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold self-end sm:self-auto">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            {historyTab === 'ESCROW' ? (
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Escrow Code</th>
                    <th className="py-2.5 px-3">Item Title</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">State</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No escrow contracts created yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[#006B3F] font-bold text-[11px]">{t.code}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 max-w-xs truncate">{t.title}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{formatNaira(t.amount)}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase border bg-slate-100 text-slate-700 border-slate-200">
                            {t.state}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">{formatDate(t.created_at)}</td>
                        <td className="py-2.5 px-3 text-right space-x-2">
                          <button
                            onClick={() => setActiveShareTx(t)}
                            className="text-xs text-[#006B3F] hover:underline font-bold inline-flex items-center gap-1"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Share Card
                          </button>
                          <Link
                            href={`/pay/${encodeURIComponent(t.code)}`}
                            className="text-xs text-blue-600 hover:underline font-bold"
                          >
                            View Contract
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Payout Ref</th>
                    <th className="py-2.5 px-3">Destination Bank & Account</th>
                    <th className="py-2.5 px-3">Beneficiary</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No bank payouts processed yet. Click &quot;Bank Payout&quot; to withdraw available funds.
                      </td>
                    </tr>
                  ) : (
                    withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-amber-700 font-bold text-[11px]">{w.reference}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {w.bank_name} • {w.account_number}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{w.account_name}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#006B3F]">{formatNaira(w.amount)}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-100 text-[#006B3F] border border-emerald-200">
                            {w.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">{formatDate(w.created_at)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setActiveReceipt(w)}
                            className="text-xs text-[#006B3F] hover:underline font-bold inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* BANK PAYOUT MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 glass-modal flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => {
                setShowWithdrawModal(false);
                setWithdrawMsg('');
                setWithdrawError('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Ecobank Instant Payout</h3>
                <p className="text-xs text-slate-500">Withdraw available escrow earnings to your bank account.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Available Wallet Balance</div>
              <div className="text-xl font-extrabold text-slate-900 font-mono">{formatNaira(user.simulated_balance)}</div>
            </div>

            {withdrawMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#006B3F] font-bold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                {withdrawMsg}
              </div>
            )}
            {withdrawError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {withdrawError}
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Payout Amount (NGN ₦)</label>
                <input
                  type="number"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-[#006B3F]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Destination Bank</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#006B3F] hover:bg-[#005432] text-white font-extrabold text-xs transition-all shadow-md mt-2"
              >
                Confirm Instant Bank Payout
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SHARE CARD MODAL */}
      {activeShareTx && (
        <ShareCardModal
          transaction={activeShareTx}
          onClose={() => setActiveShareTx(null)}
        />
      )}

      {/* RECEIPT MODAL */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 glass-modal flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 relative text-xs">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#006B3F] flex items-center justify-center mx-auto mb-2 font-bold">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Ecobank Payout Receipt</h3>
              <p className="text-[11px] text-slate-500 font-mono">{activeReceipt.reference}</p>
            </div>

            <div className="space-y-2 bg-slate-50 rounded-2xl p-3.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-[#006B3F]">{formatNaira(activeReceipt.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank:</span>
                <span className="text-slate-900">{activeReceipt.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account:</span>
                <span className="text-slate-900">{activeReceipt.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiary:</span>
                <span className="text-slate-900">{activeReceipt.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-[#006B3F] font-bold">{activeReceipt.status}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-700">{formatDate(activeReceipt.created_at)}</span>
              </div>
            </div>

            <button
              onClick={() => setActiveReceipt(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
