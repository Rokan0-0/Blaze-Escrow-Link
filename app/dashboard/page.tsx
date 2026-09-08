'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { mockStore } from '@/lib/mock/store';
import { EscrowTransaction } from '@/lib/mock/types';
import { formatNaira, calculateEscrowFee, formatDate, getStateBadgeStyle } from '@/lib/formatters';
import { Navbar } from '@/components/layout/Navbar';
import { DemoSwitcher } from '@/components/layout/DemoSwitcher';
import { Footer } from '@/components/layout/Footer';
import { TrustBadge } from '@/components/trust/TrustBadge';
import confetti from 'canvas-confetti';
import {
  PlusCircle,
  Copy,
  Check,
  Share2,
  Wallet,
  TrendingUp,
  ShieldCheck,
  Landmark,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  Link as LinkIcon,
  MessageSquare,
  Building2,
  RefreshCw,
} from 'lucide-react';

export default function MerchantDashboard() {
  const { user, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);

  // Generator form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Fashion & Apparel');
  const [amountNaira, setAmountNaira] = useState('');
  const [logistics, setLogistics] = useState<'CAMPUS_DIRECT' | 'GIG' | 'KWIK' | 'SENDBOX' | 'OTHER'>('CAMPUS_DIRECT');

  const [generatedLink, setGeneratedLink] = useState<EscrowTransaction | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Withdrawal form states
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('Ecobank Nigeria');
  const [accountNumber, setAccountNumber] = useState('30987654321');
  const [accountName, setAccountName] = useState('Amina Bello');
  const [withdrawMsg, setWithdrawMsg] = useState('');

  const loadData = () => {
    if (user) {
      const all = mockStore.getAllTransactions();
      const userTx = all.filter((t) => t.seller_id === user.id || t.buyer_id === user.id);
      setTransactions(userTx);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center text-center p-4">
        <h2 className="text-lg font-bold text-white mb-2">Access Merchant Dashboard</h2>
        <p className="text-xs text-zinc-400 mb-4">Please sign in with your phone number to access seller tools.</p>
        <Link href="/login" className="px-4 py-2.5 bg-[#006B3F] text-white font-semibold rounded-xl text-xs">
          Sign In
        </Link>
      </div>
    );
  }

  const numAmount = (parseFloat(amountNaira) || 0) * 100; // to kobo
  const feeKobo = calculateEscrowFee(numAmount);
  const netKobo = numAmount - feeKobo;

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) return;

    const newTx = mockStore.createEscrowLink({
      seller_id: user.id,
      title,
      description,
      category,
      amount: numAmount,
      logistics,
    });

    setGeneratedLink(newTx);
    loadData();
    refreshProfile();
    try {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
    } catch (e) {}
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

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amountKobo = parseFloat(withdrawAmount) * 100;
    if (!amountKobo || amountKobo > user.simulated_balance) {
      setWithdrawMsg('Invalid amount or insufficient wallet balance.');
      return;
    }

    mockStore.createWithdrawal(user.id, amountKobo, bankName, accountNumber, accountName);
    refreshProfile();
    setWithdrawMsg('Withdrawal processed instantly to your linked Ecobank Blaze Account!');
    setTimeout(() => {
      setShowWithdrawModal(false);
      setWithdrawMsg('');
      setWithdrawAmount('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <DemoSwitcher />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Merchant Escrow Dashboard</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Welcome back, <span className="text-emerald-400 font-semibold">{user.full_name}</span> • Ecobank Blaze Merchant
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#create-link"
              className="px-4 py-2.5 rounded-xl bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold text-xs transition-all shadow-lg flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Create Escrow Link
            </a>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] text-white font-semibold text-xs border border-[#2A2A2A] transition-all flex items-center gap-2"
            >
              <Landmark className="w-4 h-4 text-amber-400" /> Payout to Bank
            </button>
          </div>
        </div>

        {/* Ecobank Amber Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Linked Ecobank Blaze Account</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-mono mt-0.5">
                Account: <strong className="text-white">30987654321</strong> • Unlocked Credit Line:{' '}
                <strong className="text-emerald-400">{formatNaira(user.credit_limit)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrustBadge score={user.trust_score} tier={user.trust_tier} compact />
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Available Balance</span>
            <div className="text-2xl font-extrabold text-white font-mono">{formatNaira(user.simulated_balance)}</div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              Ready for instant payout
            </span>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Sales Volume</span>
            <div className="text-2xl font-extrabold text-white font-mono">{formatNaira(user.total_volume)}</div>
            <span className="text-[11px] text-zinc-400 font-medium">Lifetime processed</span>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Completed Trades</span>
            <div className="text-2xl font-extrabold text-white font-mono">{user.completed_trades}</div>
            <span className="text-[11px] text-purple-400 font-medium">0.0% Dispute Rate</span>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Trust Score</span>
            <div className="text-2xl font-extrabold text-[#00874E] font-mono">{user.trust_score}<span className="text-xs text-zinc-500">/100</span></div>
            <span className="text-[11px] text-amber-400 font-medium">{user.trust_tier} Tier Status</span>
          </div>
        </div>

        {/* Link Generator Section */}
        <div id="create-link" className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-[#00874E]" /> Instant Escrow Link Generator
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Generate instant payment link with embedded 0.75% escrow logic for WhatsApp & Instagram buyers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <form onSubmit={handleCreateLink} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Vintage Levi 90s Oversized Denim Jacket"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#006B3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white"
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
                  <label className="block text-zinc-300 font-semibold mb-1">Price (NGN ₦)</label>
                  <input
                    type="number"
                    required
                    value={amountNaira}
                    onChange={(e) => setAmountNaira(e.target.value)}
                    placeholder="18500"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-[#006B3F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Item Description / Condition</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Grade A thrift condition, XL size, authentic..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#006B3F]"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Logistics / Delivery Method</label>
                <select
                  value={logistics}
                  onChange={(e) => setLogistics(e.target.value as any)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-white"
                >
                  <option value="CAMPUS_DIRECT">Campus Direct (Handshake USSD PIN)</option>
                  <option value="GIG">GIG Logistics Courier</option>
                  <option value="KWIK">Kwik Express Dispatch</option>
                  <option value="SENDBOX">Sendbox Pickup</option>
                  <option value="OTHER">Other Local Logistics</option>
                </select>
              </div>

              {/* Fee Breakdown Preview */}
              {numAmount > 0 && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Buyer Price:</span>
                    <span className="text-white font-bold">{formatNaira(numAmount)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Escrow Fee (0.75% max ₦500):</span>
                    <span>{formatNaira(feeKobo)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold border-t border-[#2A2A2A] pt-1">
                    <span>Your Net Payout:</span>
                    <span>{formatNaira(netKobo)}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Generate Escrow Payment Link
              </button>
            </form>

            {/* Generated Result Card */}
            <div className="flex flex-col justify-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 space-y-4">
              {!generatedLink ? (
                <div className="text-center py-10 text-zinc-500 space-y-2">
                  <LinkIcon className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="text-xs">Fill the form to create your shareable Escrow Payment Link.</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Link Active & Ready!
                    </span>
                    <span className="font-mono text-xs text-zinc-400">{generatedLink.code}</span>
                  </div>

                  <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-3.5 space-y-2">
                    <div className="font-semibold text-white text-sm">{generatedLink.title}</div>
                    <div className="text-emerald-400 font-mono font-bold text-base">
                      {formatNaira(generatedLink.amount)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleCopyLink}
                      className="w-full bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? 'Copied Direct Link!' : 'Copy Direct Link'}
                    </button>

                    <button
                      onClick={handleCopySocialText}
                      className="w-full bg-[#111111] hover:bg-[#252525] text-zinc-200 border border-[#2A2A2A] font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <MessageSquare className="w-4 h-4 text-emerald-400" />}
                      {copiedText ? 'Copied WhatsApp Post Text!' : 'Copy WhatsApp / IG Caption Text'}
                    </button>

                    <Link
                      href={`/pay/${encodeURIComponent(generatedLink.code)}`}
                      className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" /> Test Buyer Payment Page
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Escrow Transactions Table */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Escrow Transactions History</h3>
            <button
              onClick={loadData}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2A2A2A] text-zinc-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-3">Escrow Code</th>
                  <th className="py-3 px-3">Item Title</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">State</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No escrow contracts created yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    const badge = getStateBadgeStyle(t.state);
                    return (
                      <tr key={t.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                        <td className="py-3 px-3 font-mono text-emerald-400 font-semibold">{t.code}</td>
                        <td className="py-3 px-3 font-medium text-white max-w-xs truncate">{t.title}</td>
                        <td className="py-3 px-3 font-mono font-bold text-white">{formatNaira(t.amount)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {t.state}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 text-[11px]">{formatDate(t.created_at)}</td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/pay/${encodeURIComponent(t.code)}`}
                            className="text-xs text-emerald-400 hover:underline font-semibold"
                          >
                            View Contract
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400" /> Instant Bank Withdrawal
            </h3>

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400">Available Wallet Balance:</span>
              <span className="font-bold text-emerald-400">{formatNaira(user.simulated_balance)}</span>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Withdrawal Amount (NGN)</label>
                <input
                  type="number"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Bank Name</label>
                <input
                  type="text"
                  readOnly
                  value={bankName}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-zinc-400 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Account Number</label>
                  <input
                    type="text"
                    readOnly
                    value={accountNumber}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Account Name</label>
                  <input
                    type="text"
                    readOnly
                    value={accountName}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
              </div>

              {withdrawMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  {withdrawMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1A1A1A] text-zinc-300 hover:text-white border border-[#2A2A2A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold shadow-lg"
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
