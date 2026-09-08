'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { mockStore } from '@/lib/mock/store';
import { transitionEscrowState } from '@/lib/escrow/stateMachine';
import { Dispute, EscrowTransaction, Profile } from '@/lib/mock/types';
import { formatNaira, formatDate } from '@/lib/formatters';
import { Navbar } from '@/components/layout/Navbar';
import { DemoSwitcher } from '@/components/layout/DemoSwitcher';
import { Footer } from '@/components/layout/Footer';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Landmark,
  FileText,
  UserCheck,
} from 'lucide-react';

export default function AdminDisputePage() {
  const { user, switchDemoUser } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = () => {
    const dList = mockStore.getAllDisputes();
    setDisputes(dList);
    const tList = mockStore.getAllTransactions();
    setTransactions(tList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveDispute = async (
    dispute: Dispute,
    outcome: 'RESOLVE_BUYER' | 'RESOLVE_SELLER'
  ) => {
    setIsProcessing(true);
    setActionSuccess('');
    setActionError('');

    const tx = mockStore.getTransactionById(dispute.transaction_id);
    if (!tx) {
      setActionError('Transaction record not found');
      setIsProcessing(false);
      return;
    }

    if (outcome === 'RESOLVE_BUYER') {
      const res = await transitionEscrowState(tx.id, 'REFUND');
      if (res.success) {
        dispute.status = 'RESOLVED_BUYER';
        dispute.resolution_note = 'Ecobank Compliance resolved dispute in favor of buyer following evidence review.';
        dispute.resolved_at = new Date().toISOString();
        mockStore.saveDispute(dispute);
        setActionSuccess(`Dispute resolved. Escrow funds refunded back to buyer.`);
      }
    } else {
      const res = await transitionEscrowState(tx.id, 'RELEASE');
      if (res.success) {
        dispute.status = 'RESOLVED_SELLER';
        dispute.resolution_note = 'Ecobank Compliance resolved dispute in favor of seller. Payout authorized.';
        dispute.resolved_at = new Date().toISOString();
        mockStore.saveDispute(dispute);
        setActionSuccess(`Dispute resolved. Escrow funds released to seller.`);
      }
    }

    loadData();
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <DemoSwitcher />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" /> Ecobank Compliance & Dispute Hub
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Escrow arbitration portal with AI evidence assessment and automated refund/release execution.
            </p>
          </div>

          {user?.role !== 'admin' && (
            <button
              onClick={() => switchDemoUser('admin')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all shadow-lg"
            >
              Switch to Ecobank Admin Role
            </button>
          )}
        </div>

        {/* Action Alerts */}
        {actionError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {actionSuccess}
          </div>
        )}

        {/* Admin KPI Header Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Vault Escrow Lock</span>
            <div className="text-2xl font-extrabold text-white font-mono">
              {formatNaira(transactions.reduce((acc, curr) => acc + curr.amount, 0))}
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">Protected by Ecobank 256-Bit Vault</span>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Disputes</span>
            <div className="text-2xl font-extrabold text-rose-400 font-mono">
              {disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length}
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">Requiring Compliance Adjudication</span>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Resolved Disputes</span>
            <div className="text-2xl font-extrabold text-purple-400 font-mono">
              {disputes.filter((d) => d.status.startsWith('RESOLVED')).length}
            </div>
            <span className="text-[11px] text-purple-400 font-medium">100% SLA Resolution Rate</span>
          </div>
        </div>

        {/* Disputes Queue */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" /> Active Dispute Arbitration Queue
            </h2>
            <button onClick={loadData} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
            </button>
          </div>

          <div className="space-y-6">
            {disputes.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">No active dispute cases in queue.</div>
            ) : (
              disputes.map((d) => {
                const tx = mockStore.getTransactionById(d.transaction_id);
                return (
                  <div
                    key={d.id}
                    className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 shadow-xl space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2A2A2A] pb-3">
                      <div>
                        <span className="text-xs font-mono text-purple-400 font-bold">DISPUTE ID: {d.id}</span>
                        <h3 className="font-bold text-white text-base mt-0.5">{tx?.title || 'Escrow Item'}</h3>
                        <p className="text-xs text-zinc-400 font-mono">
                          Contract Code: <strong className="text-emerald-400">{tx?.code}</strong> • Locked Amount:{' '}
                          <strong className="text-white">{tx ? formatNaira(tx.amount) : 'N/A'}</strong>
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase self-start sm:self-center">
                        {d.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Reason & Evidence Column */}
                      <div className="space-y-2">
                        <div className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Buyer Dispute Claim</div>
                        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 text-zinc-200">
                          <span className="font-bold text-rose-400 block mb-1">{d.reason}</span>
                          <p className="leading-relaxed text-zinc-300">{d.description}</p>
                        </div>
                      </div>

                      {/* AI Evidence Assessment Card */}
                      {d.ai_score && (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3.5 space-y-2 text-purple-200">
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5 text-purple-300 text-xs">
                              <Sparkles className="w-4 h-4 text-purple-400" /> AI Evidence Assessment
                            </span>
                            <span className="font-mono text-xs text-purple-400">{d.ai_score.confidence}% Confidence</span>
                          </div>

                          <p className="text-[11px] text-zinc-300 leading-relaxed">{d.ai_score.reasoning}</p>

                          <div className="pt-1 border-t border-purple-500/20 text-[11px]">
                            Recommendation:{' '}
                            <strong className="text-white uppercase font-mono">{d.ai_score.recommendation}</strong>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Resolution Action Controls */}
                    {d.status === 'OPEN' || d.status === 'UNDER_REVIEW' ? (
                      <div className="pt-3 border-t border-[#2A2A2A] flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-xs text-zinc-400">Execute Binding Ecobank Resolution:</span>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleResolveDispute(d, 'RESOLVE_BUYER')}
                            disabled={isProcessing}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50"
                          >
                            Resolve Favor Buyer (Refund)
                          </button>

                          <button
                            onClick={() => handleResolveDispute(d, 'RESOLVE_SELLER')}
                            disabled={isProcessing}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50"
                          >
                            Resolve Favor Seller (Release Funds)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-[#2A2A2A] text-xs text-emerald-400 font-semibold flex items-center gap-2">
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
