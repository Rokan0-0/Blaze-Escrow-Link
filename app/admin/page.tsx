'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { mockStore } from '@/lib/mock/store';
import { Dispute, EscrowTransaction } from '@/lib/mock/types';
import { formatNaira } from '@/lib/formatters';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  FileText,
  Lock,
} from 'lucide-react';

export default function AdminDisputePage() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    try {
      const [txRes, dispRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/disputes'),
      ]);
      const txData = await txRes.json();
      const dispData = await dispRes.json();
      if (txData.transactions) setTransactions(txData.transactions);
      if (dispData.disputes) setDisputes(dispData.disputes);
    } catch {
      setTransactions(mockStore.getAllTransactions());
      setDisputes(mockStore.getAllDisputes());
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
      // Poll every 5s so new disputes appear without manual refresh
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleResolveDispute = async (
    dispute: Dispute,
    outcome: 'RESOLVE_BUYER' | 'RESOLVE_SELLER'
  ) => {
    setIsProcessing(true);
    setActionSuccess('');
    setActionError('');

    try {
      // BUG-025: Call /api/dispute RESOLVE directly instead of broken stateMachine 'REFUND'
      const res = await fetch('/api/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE',
          dispute_id: dispute.id,
          outcome,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const label = outcome === 'RESOLVE_BUYER' ? 'Buyer refunded' : 'Seller paid out';
        setActionSuccess(`Dispute resolved: ${label}. Escrow vault updated.`);
        await loadData();
      } else {
        setActionError(data.error || 'Resolution failed.');
      }
    } catch (e) {
      setActionError('Network error — please try again.');
    }

    setIsProcessing(false);
  };

  // BUG-005: Guard — admin access only
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <Lock className="w-10 h-10 text-slate-400 mx-auto" />
            <h2 className="font-extrabold text-slate-900">Sign In Required</h2>
            <p className="text-xs text-slate-500">This page is restricted to Ecobank Compliance administrators.</p>
            <Link href="/" className="inline-block px-5 py-2.5 bg-[#006B3F] text-white rounded-xl font-bold text-xs">Back to Home</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm p-8 bg-white border border-rose-200 rounded-3xl shadow-sm">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="font-extrabold text-slate-900">Access Denied</h2>
            <p className="text-xs text-slate-500">This compliance hub is restricted to Ecobank admin accounts only.</p>
            <Link href="/dashboard" className="inline-block px-5 py-2.5 bg-slate-100 text-slate-800 rounded-xl font-bold text-xs">Back to Dashboard</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-purple-600" /> Ecobank Compliance & Dispute Hub
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Escrow arbitration portal with AI evidence assessment and automated refund/release execution.
            </p>
          </div>
        </div>

        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006B3F] text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {actionSuccess}
          </div>
        )}

        {/* Header Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Vault Escrow Lock</span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {formatNaira(transactions.reduce((acc, curr) => acc + curr.amount, 0))}
            </div>
            <span className="text-[11px] text-[#006B3F] font-bold">Protected by Ecobank 256-Bit Vault</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Disputes</span>
            <div className="text-2xl font-extrabold text-rose-600 font-mono">
              {disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Requiring Compliance Review</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved Disputes</span>
            <div className="text-2xl font-extrabold text-purple-600 font-mono">
              {disputes.filter((d) => d.status.startsWith('RESOLVED')).length}
            </div>
            <span className="text-[11px] text-purple-700 font-bold">100% SLA Resolution Rate</span>
          </div>
        </div>

        {/* Dispute Queue */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" /> Active Dispute Queue
            </h2>
            <button onClick={loadData} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
            </button>
          </div>

          <div className="space-y-6">
            {disputes.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No active dispute cases in queue.</div>
            ) : (
              disputes.map((d) => {
                const tx = mockStore.getTransactionById(d.transaction_id);
                return (
                  <div
                    key={d.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                      <div>
                        <span className="text-xs font-mono text-purple-700 font-bold">DISPUTE ID: {d.id}</span>
                        <h3 className="font-bold text-slate-900 text-base mt-0.5">{tx?.title || 'Escrow Item'}</h3>
                        <p className="text-xs text-slate-600 font-mono">
                          Contract Code: <strong className="text-[#006B3F]">{tx?.code}</strong> • Locked Amount:{' '}
                          <strong className="text-slate-900">{tx ? formatNaira(tx.amount) : 'N/A'}</strong>
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase self-start sm:self-center">
                        {d.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <div className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Buyer Claim</div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-slate-800">
                          <span className="font-bold text-rose-700 block mb-1">{d.reason}</span>
                          <p className="leading-relaxed text-slate-600">{d.description}</p>
                        </div>
                      </div>

                      {d.ai_score && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 space-y-2 text-purple-900">
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5 text-purple-800 text-xs">
                              <Sparkles className="w-4 h-4 text-purple-600" /> AI Evidence Assessment
                            </span>
                            <span className="font-mono text-xs text-purple-700">{d.ai_score.confidence}% Confidence</span>
                          </div>

                          <p className="text-[11px] text-slate-700 leading-relaxed">{d.ai_score.reasoning}</p>

                          <div className="pt-1 border-t border-purple-200 text-[11px] font-bold">
                            Recommendation:{' '}
                            <strong className="text-slate-900 uppercase font-mono">{d.ai_score.recommendation}</strong>
                          </div>
                        </div>
                      )}
                    </div>

                    {d.status === 'OPEN' || d.status === 'UNDER_REVIEW' ? (
                      <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-xs text-slate-500 font-medium">Execute Resolution:</span>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleResolveDispute(d, 'RESOLVE_BUYER')}
                            disabled={isProcessing}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50"
                          >
                            Resolve Favor Buyer (Refund)
                          </button>

                          <button
                            onClick={() => handleResolveDispute(d, 'RESOLVE_SELLER')}
                            disabled={isProcessing}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50"
                          >
                            Resolve Favor Seller (Release Payout)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-slate-200 text-xs text-[#006B3F] font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Case Closed: {d.resolution_note}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
