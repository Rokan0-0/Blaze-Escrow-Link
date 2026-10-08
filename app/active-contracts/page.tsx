'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { mockStore } from '@/lib/mock/store';
import { EscrowTransaction } from '@/lib/mock/types';
import { formatNaira, formatDate } from '@/lib/formatters';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ShareCardModal } from '@/components/escrow/ShareCardModal';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import {
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Share2,
  RefreshCw,
  Image as ImageIcon,
  Copy,
  Check,
  PackageCheck,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const STATE_BADGES: Record<string, { bg: string; text: string; label: string; desc: string }> = {
  CREATED: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    label: 'Awaiting Payment',
    desc: 'Escrow payment link generated. Awaiting buyer deposit into Ecobank vault.',
  },
  PAID: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-[#006B3F]',
    label: 'Paid — Ready to Dispatch',
    desc: 'Funds secured in Ecobank vault. Seller is authorized to dispatch item.',
  },
  DISPATCHED: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    label: 'In Transit',
    desc: 'Item in transit with logistics courier. Awaiting buyer inspection & confirmation.',
  },
  DISPUTED: {
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
    label: 'Under Review',
    desc: 'Dispute filed. Escrow vault funds frozen pending compliance resolution.',
  },
};

export default function ActiveContractsPage() {
  const { user, openAuthModal, isLoading, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'CREATED' | 'PAID' | 'DISPATCHED' | 'DISPUTED'>('ALL');
  const [activeShareTx, setActiveShareTx] = useState<EscrowTransaction | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadData = async () => {
    if (!user) return;
    try {
      const resSeller = await fetch(`/api/transactions?seller_id=${user.id}`);
      const dataSeller = await resSeller.json();
      const resBuyer = await fetch(`/api/transactions?buyer_id=${user.id}`);
      const dataBuyer = await resBuyer.json();

      const combinedMap = new Map<string, EscrowTransaction>();
      if (dataSeller.transactions) {
        dataSeller.transactions.forEach((t: EscrowTransaction) => combinedMap.set(t.id, t));
      }
      if (dataBuyer.transactions) {
        dataBuyer.transactions.forEach((t: EscrowTransaction) => combinedMap.set(t.id, t));
      }

      if (combinedMap.size > 0) {
        setTransactions(Array.from(combinedMap.values()));
        return;
      }
    } catch (e) {}

    const all = mockStore.getAllTransactions();
    setTransactions(all.filter((t) => t.seller_id === user.id || t.buyer_id === user.id));
  };

  useEffect(() => {
    if (user) {
      loadData();
      refreshProfile();
      const interval = setInterval(() => {
        loadData();
        refreshProfile();
      }, 2000);

      const handleUpdate = () => {
        loadData();
        refreshProfile();
      };
      window.addEventListener('storage', handleUpdate);
      window.addEventListener('blaze_data_updated', handleUpdate);
      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleUpdate);
        window.removeEventListener('blaze_data_updated', handleUpdate);
      };
    }
  }, [user?.id]);

  if (isLoading) {
    return <LoadingScreen message="Loading Active Escrow Contracts..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 text-center space-y-4 shadow-2xs max-w-md w-full">
            <ShieldCheck className="w-10 h-10 mx-auto text-[#006B3F]" />
            <h2 className="text-slate-900 font-extrabold text-base">Sign In to View Active Contracts</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Track and manage all unclosed escrow deals protected by Ecobank Blaze.
            </p>
            <button
              onClick={openAuthModal}
              className="px-6 py-3 rounded-2xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold text-xs shadow-md transition-all"
            >
              Sign In Now
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const activeUnclosed = transactions.filter(
    (t) => t.state !== 'RELEASED' && t.state !== 'REFUNDED' && t.state !== 'CANCELLED'
  );

  const filtered = activeUnclosed.filter((t) => {
    if (filterTab === 'ALL') return true;
    return t.state === filterTab;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#006B3F]" /> Active Escrow Contracts
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-emerald-100 text-[#006B3F] border border-emerald-200">
                {activeUnclosed.length} UNCLOSED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Monitor, dispatch, and track active escrow contracts before final payout settlement.
            </p>
          </div>

          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh List
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'ALL', label: `All Active (${activeUnclosed.length})` },
            { id: 'CREATED', label: `Awaiting Payment (${activeUnclosed.filter((t) => t.state === 'CREATED').length})` },
            { id: 'PAID', label: `Ready to Dispatch (${activeUnclosed.filter((t) => t.state === 'PAID').length})` },
            { id: 'DISPATCHED', label: `In Transit (${activeUnclosed.filter((t) => t.state === 'DISPATCHED').length})` },
            { id: 'DISPUTED', label: `Under Review (${activeUnclosed.filter((t) => t.state === 'DISPUTED').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                filterTab === tab.id
                  ? 'bg-[#006B3F] text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Contracts Display */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-3 shadow-2xs">
            <PackageCheck className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="text-slate-900 font-extrabold text-sm sm:text-base">No Contracts in this Category</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              All deals matching this filter are either settled or no unclosed contracts exist currently.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#006B3F] text-white font-bold text-xs shadow-md"
            >
              Create New Escrow Link <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: SLEEK EXPANDABLE ACCORDION LIST */}
            <div className="md:hidden space-y-3">
              {filtered.map((t) => {
                const badge = STATE_BADGES[t.state] || {
                  bg: 'bg-slate-100 border-slate-200',
                  text: 'text-slate-700',
                  label: t.state,
                  desc: 'Active Escrow Contract',
                };
                const isExpanded = !!expandedIds[t.id];
                const isSeller = user.id === t.seller_id;

                return (
                  <div
                    key={t.id}
                    className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden transition-all"
                  >
                    {/* Collapsed Header Bar */}
                    <div
                      onClick={() => toggleExpand(t.id)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {t.image_url ? (
                          <img
                            src={t.image_url}
                            alt={t.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[#006B3F] font-extrabold text-xs">{t.code}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase border ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs truncate mt-0.5">{t.title}</h4>
                          <div className="text-[#006B3F] font-mono font-extrabold text-xs mt-0.5">
                            {formatNaira(t.amount)}
                          </div>
                        </div>
                      </div>

                      <button
                        className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0"
                        title={isExpanded ? 'Collapse details' : 'Expand details'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Expandable Body */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 animate-in fade-in-50 duration-150">
                        <p className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded-xl p-2.5 leading-relaxed font-medium">
                          {badge.desc}
                        </p>

                        <div className="space-y-1.5 text-[11px] text-slate-600 font-mono bg-white p-2.5 rounded-xl border border-slate-200">
                          <div className="flex justify-between">
                            <span>Your Role:</span>
                            <strong className={isSeller ? 'text-amber-800' : 'text-blue-700'}>
                              {isSeller ? 'Merchant (Seller)' : 'Buyer'}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Logistics:</span>
                            <strong className="text-slate-800">{t.logistics}</strong>
                          </div>
                          {t.tracking_id && (
                            <div className="flex justify-between text-purple-700">
                              <span>Tracking Ref:</span>
                              <strong className="font-bold">{t.tracking_id}</strong>
                            </div>
                          )}
                          {t.buyer_name && (
                            <div className="flex justify-between text-slate-700">
                              <span>Buyer Name:</span>
                              <strong className="font-bold">{t.buyer_name}</strong>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Link
                            href={`/pay/${t.code.replace(/^#/, '')}`}
                            target="_blank"
                            className="flex-1 py-2 px-3 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold text-xs text-center transition-all shadow-2xs flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View Contract
                          </Link>

                          <button
                            onClick={() => setActiveShareTx(t)}
                            className="p-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all shadow-2xs shrink-0"
                            title="Share Link / Card"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW: PREMIUM ALIGNED CARD GRID */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((t) => {
                const badge = STATE_BADGES[t.state] || {
                  bg: 'bg-slate-100 border-slate-200',
                  text: 'text-slate-700',
                  label: t.state,
                  desc: 'Active Escrow Contract',
                };
                const isSeller = user.id === t.seller_id;

                return (
                  <div
                    key={t.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-lg transition-all duration-200 relative overflow-hidden"
                  >
                    <div className="space-y-3.5">
                      {/* Top Bar: Code & State Badge */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <button
                          onClick={() => handleCopyCode(t.code)}
                          className="font-mono text-[#006B3F] font-extrabold text-xs flex items-center gap-1.5 hover:underline bg-emerald-50/70 border border-emerald-200/80 px-2.5 py-1 rounded-lg"
                          title="Click to copy code"
                        >
                          {t.code} {copiedCode === t.code ? <Check className="w-3.5 h-3.5 text-[#006B3F]" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        </button>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase border ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Main Product Hero Row */}
                      <div className="flex items-start gap-3.5">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
                          {t.image_url ? (
                            <img
                              src={t.image_url}
                              alt={t.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold text-center py-0.5 rounded-md truncate uppercase tracking-wider">
                            {t.category}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 flex flex-col justify-between h-24 py-0.5">
                          <h3 className="font-extrabold text-slate-900 text-sm line-clamp-2 leading-snug">
                            {t.title}
                          </h3>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 font-mono block">CONTRACT VALUE</span>
                            <div className="text-[#006B3F] font-mono font-extrabold text-base sm:text-lg leading-none">
                              {formatNaira(t.amount)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* State Description Callout */}
                      <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200/90 rounded-2xl p-3 leading-relaxed font-medium">
                        {badge.desc}
                      </p>

                      {/* Aligned Spec Grid (2x2 Grid) */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-50/60 p-3 rounded-2xl border border-slate-200/80">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 uppercase font-sans block">YOUR ROLE</span>
                          <span className={`font-bold block truncate ${isSeller ? 'text-amber-800' : 'text-blue-700'}`}>
                            {isSeller ? 'Merchant (Seller)' : 'Buyer'}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 uppercase font-sans block">LOGISTICS</span>
                          <span className="font-bold text-slate-800 block truncate">{t.logistics}</span>
                        </div>

                        {t.buyer_name ? (
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 uppercase font-sans block">BUYER NAME</span>
                            <span className="font-bold text-slate-800 block truncate">{t.buyer_name}</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 uppercase font-sans block">BUYER STATUS</span>
                            <span className="font-bold text-amber-700 block truncate">Unclaimed</span>
                          </div>
                        )}

                        {t.tracking_id ? (
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 uppercase font-sans block">TRACKING ID</span>
                            <span className="font-bold text-purple-700 block truncate">{t.tracking_id}</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 uppercase font-sans block">EXPIRES IN</span>
                            <span className="font-bold text-slate-600 block truncate">48 Hours</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Equalized Action Footer */}
                    <div className="flex items-center gap-2 pt-3.5 border-t border-slate-100 mt-auto">
                      <Link
                        href={`/pay/${t.code.replace(/^#/, '')}`}
                        target="_blank"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold text-xs text-center transition-all shadow-2xs flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Contract
                      </Link>

                      <button
                        onClick={() => setActiveShareTx(t)}
                        className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs transition-all shadow-2xs shrink-0 flex items-center gap-1.5"
                        title="Share Link / Card"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {activeShareTx && (
        <ShareCardModal transaction={activeShareTx} onClose={() => setActiveShareTx(null)} />
      )}

      <Footer />
    </div>
  );
}
