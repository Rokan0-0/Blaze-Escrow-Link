'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { mockStore } from '@/lib/mock/store';
import { EscrowTransaction, Withdrawal } from '@/lib/mock/types';
import { formatNaira, calculateEscrowFee, formatDate } from '@/lib/formatters';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TrustBadge } from '@/components/trust/TrustBadge';
import { ShareCardModal } from '@/components/escrow/ShareCardModal';
import confetti from 'canvas-confetti';
import {
  PlusCircle,
  Copy,
  Check,
  Landmark,
  ExternalLink,
  Link as LinkIcon,
  MessageSquare,
  RefreshCw,
  Share2,
  X,
  FileText,
  CheckCircle2,
} from 'lucide-react';

export default function MerchantDashboard() {
  const { user, isLoading, openAuthModal, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [historyTab, setHistoryTab] = useState<'ESCROW' | 'PAYOUTS'>('ESCROW');
  const [selectedReceipt, setSelectedReceipt] = useState<Withdrawal | null>(null);
  const [activeShareTx, setActiveShareTx] = useState<EscrowTransaction | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Fashion & Apparel');
  const [amountNaira, setAmountNaira] = useState('');
  const [logistics, setLogistics] = useState<'CAMPUS_DIRECT' | 'GIG' | 'KWIK' | 'SENDBOX' | 'OTHER'>('CAMPUS_DIRECT');

  const [generatedLink, setGeneratedLink] = useState<EscrowTransaction | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName] = useState('Ecobank Nigeria');
  const [accountNumber] = useState('30987654321');
  const [accountName] = useState('Amina Bello');
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  const loadData = async () => {
    // BUG-009/023: Guard — don't fetch if no user is logged in
    if (!user?.id) return;

    try {
      // BUG-003: Filter by seller_id so only Amina's contracts appear in her dashboard
      const res = await fetch(`/api/transactions?seller_id=${user.id}`);
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
      } else {
        setTransactions(mockStore.getAllTransactions().filter((t) => t.seller_id === user.id));
      }
    } catch (e) {
      setTransactions(mockStore.getAllTransactions().filter((t) => t.seller_id === user.id));
    }

    try {
      const resW = await fetch(`/api/withdraw?seller_id=${user.id}`);
      const dataW = await resW.json();
      if (dataW.withdrawals) {
        setWithdrawals(dataW.withdrawals);
      } else {
        setWithdrawals(mockStore.getWithdrawals(user.id));
      }
    } catch (e) {
      setWithdrawals(mockStore.getWithdrawals(user.id));
    }
  };

  useEffect(() => {
    if (!user?.id) return; // BUG-023: Don't set interval after logout
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
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-lg space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Access Merchant Dashboard</h2>
          <p className="text-xs text-slate-600">Please sign in to manage your Blaze Escrow links and bank payouts.</p>
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
    const amountKobo = Math.round((parseFloat(withdrawAmount) || 0) * 100);
    setWithdrawMsg('');
    setWithdrawError('');
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
        // Sync local mockStore profile balance
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
        // BUG-006: Show error clearly instead of silently falling through to local execution
        setWithdrawError(data.error || 'Payout failed. Please try again.');
      }
    } catch (e) {
      // BUG-006: Network error — show clear error, do NOT silently deduct balance locally
      setWithdrawError('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Merchant Escrow Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Welcome back, <span className="text-[#006B3F] font-bold">{user.full_name}</span> • Ecobank Blaze Merchant
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <a
              href="#create-link"
              className="px-3.5 py-2.5 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 text-center"
            >
              <PlusCircle className="w-4 h-4 shrink-0" /> Create Link
            </a>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-xs text-center"
            >
              <Landmark className="w-4 h-4 text-amber-600 shrink-0" /> Bank Payout
            </button>
          </div>
        </div>

        {/* Ecobank Amber Banner */}
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/50 to-white border border-amber-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
              <Landmark className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-xs sm:text-sm">Linked Ecobank Blaze Account</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 font-mono mt-0.5 font-medium leading-relaxed">
                Account: <strong className="text-slate-900">30987654321</strong> • Unlocked Credit Line:{' '}
                <strong className="text-[#006B3F]">{formatNaira(user.credit_limit)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <TrustBadge score={user.trust_score} tier={user.trust_tier} compact />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Balance</span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{formatNaira(user.simulated_balance)}</div>
            <span className="text-[11px] text-[#006B3F] font-bold">Ready for instant payout</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales Volume</span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{formatNaira(user.total_volume)}</div>
            <span className="text-[11px] text-slate-500 font-medium">Lifetime processed</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Trades</span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{user.completed_trades}</div>
            <span className="text-[11px] text-purple-700 font-bold">0.0% Dispute Rate</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trust Score</span>
            <div className="text-2xl font-extrabold text-[#006B3F] font-mono">{user.trust_score}<span className="text-xs text-slate-400">/100</span></div>
            <span className="text-[11px] text-amber-700 font-bold">{user.trust_tier} Tier Status</span>
          </div>
        </div>

        {/* Link Generator */}
        <div id="create-link" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-[#006B3F]" /> Instant Escrow Link Generator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate instant payment link with embedded 0.75% escrow logic for WhatsApp & Instagram.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form onSubmit={handleCreateLink} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Vintage Levi 90s Oversized Denim Jacket"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-[#006B3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-medium"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-[#006B3F]"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-[#006B3F]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Logistics Preference</label>
                <select
                  value={logistics}
                  onChange={(e) => setLogistics(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium"
                >
                  <option value="CAMPUS_DIRECT">Campus Direct (Handshake USSD PIN)</option>
                  <option value="GIG">GIG Logistics Courier</option>
                  <option value="KWIK">Kwik Express Dispatch</option>
                  <option value="SENDBOX">Sendbox Courier</option>
                  <option value="OTHER">Other Logistics</option>
                </select>
              </div>

              {numAmount > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Buyer Price:</span>
                    <span className="text-slate-900 font-bold">{formatNaira(numAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Escrow Vault Fee (0.75% max ₦500):</span>
                    <span>{formatNaira(feeKobo)}</span>
                  </div>
                  <div className="flex justify-between text-[#006B3F] font-extrabold border-t border-slate-200 pt-1">
                    <span>Your Net Payout:</span>
                    <span>{formatNaira(netKobo)}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                Generate Escrow Link
              </button>
            </form>

            <div className="flex flex-col justify-center bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              {!generatedLink ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <LinkIcon className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs">Fill form to create your shareable Escrow Payment Link.</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between text-[#006B3F] font-bold">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Link Active & Ready!
                    </span>
                    <span className="font-mono text-xs text-slate-500">{generatedLink.code}</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs">
                    <div className="font-bold text-slate-900 text-sm">{generatedLink.title}</div>
                    <div className="text-[#006B3F] font-mono font-bold text-base">
                      {formatNaira(generatedLink.amount)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleCopyLink}
                      className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? 'Copied Link!' : 'Copy Direct Payment Link'}
                    </button>

                    <button
                      onClick={() => setActiveShareTx(generatedLink)}
                      className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
                    >
                      <Share2 className="w-4 h-4" /> Open WhatsApp & IG Share Card
                    </button>

                    <button
                      onClick={handleCopySocialText}
                      className="w-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
                    >
                      {copiedText ? <Check className="w-4 h-4 text-[#006B3F]" /> : <MessageSquare className="w-4 h-4 text-[#006B3F]" />}
                      {copiedText ? 'Copied Caption Text!' : 'Copy Raw Text Caption'}
                    </button>

                    <Link
                      href={`/pay/${encodeURIComponent(generatedLink.code)}`}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" /> View Buyer Contract Page
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity & History Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryTab('ESCROW')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                  historyTab === 'ESCROW'
                    ? 'bg-[#006B3F] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Escrow Contracts ({transactions.length})
              </button>
              <button
                onClick={() => setHistoryTab('PAYOUTS')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                  historyTab === 'PAYOUTS'
                    ? 'bg-[#006B3F] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                Bank Payout History ({withdrawals.length})
              </button>
            </div>

            <button onClick={loadData} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            {historyTab === 'ESCROW' ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Escrow Code</th>
                    <th className="py-3 px-3">Item Title</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">State</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Actions</th>
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
                        <td className="py-3 px-3 font-mono text-[#006B3F] font-bold">{t.code}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 max-w-xs truncate">{t.title}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{formatNaira(t.amount)}</td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border bg-slate-100 text-slate-700 border-slate-200">
                            {t.state}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">{formatDate(t.created_at)}</td>
                        <td className="py-3 px-3 text-right space-x-2">
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
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Payout Ref</th>
                    <th className="py-3 px-3">Destination Bank & Account</th>
                    <th className="py-3 px-3">Beneficiary</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3 text-right">Receipt</th>
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
                        <td className="py-3 px-3 font-mono text-amber-700 font-bold">{w.reference}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {w.bank_name} • <span className="font-mono text-slate-600">{w.account_number}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{w.account_name}</td>
                        <td className="py-3 px-3 font-mono font-extrabold text-[#006B3F]">
                          {formatNaira(w.amount)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border bg-emerald-50 text-[#006B3F] border-emerald-200 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3 text-[#006B3F]" /> COMPLETED
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">{formatDate(w.created_at)}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedReceipt(w)}
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

      {/* Share Card Modal */}
      {activeShareTx && (
        <ShareCardModal
          transaction={activeShareTx}
          onClose={() => setActiveShareTx(null)}
        />
      )}

      {/* PAYOUT RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 glass-modal flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#006B3F] text-white flex items-center justify-center font-extrabold shadow-md">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Ecobank Digital Payout Receipt</h3>
                <p className="text-[11px] text-slate-500 font-mono">Reference: {selectedReceipt.reference}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Amount Transferred</span>
              <div className="text-2xl font-extrabold text-[#006B3F] font-mono">
                {formatNaira(selectedReceipt.amount)}
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#006B3F] uppercase">
                <CheckCircle2 className="w-3 h-3" /> NIBSS Instant Settlement
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-mono border-t border-b border-slate-100 py-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiary:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination Bank:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Number:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Processed At:</span>
                <span className="font-bold text-slate-900">{formatDate(selectedReceipt.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Status:</span>
                <span className="font-bold text-[#006B3F]">COMPLETED / SUCCESS</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 glass-modal flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-600" /> Bank Payout Withdrawal
            </h3>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-500 font-medium">Available Balance:</span>
              <span className="font-bold text-[#006B3F] text-sm">{formatNaira(user.simulated_balance)}</span>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Amount to Payout (NGN)</label>
                <input
                  type="number"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Bank Name</label>
                <input
                  type="text"
                  readOnly
                  value={bankName}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Number</label>
                  <input
                    type="text"
                    readOnly
                    value={accountNumber}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Name</label>
                  <input
                    type="text"
                    readOnly
                    value={accountName}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* BUG-028: Error messages in red, success messages in green */}
              {withdrawMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006B3F] text-xs font-bold">
                  {withdrawMsg}
                </div>
              )}
              {withdrawError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {withdrawError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold shadow-md"
                >
                  Confirm Payout
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
