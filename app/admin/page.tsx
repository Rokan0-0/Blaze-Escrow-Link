'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { mockStore, MOCK_SELLER, MOCK_BUYER } from '@/lib/mock/store';
import { Dispute, EscrowTransaction, Profile, Withdrawal } from '@/lib/mock/types';
import { formatNaira } from '@/lib/formatters';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TrustBadge } from '@/components/trust/TrustBadge';
import {
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  FileText,
  Lock,
  BarChart3,
  ArrowUpDown,
  Users as UsersIcon,
  Landmark,
  Search,
  UserX,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Check,
  ExternalLink,
  ShieldCheck,
  Filter,
  Layers,
  Clock,
  Shield,
  Zap,
  Eye,
  Scale,
  X,
  AlertCircle,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type AdminTab = 'overview' | 'disputes' | 'transactions' | 'users' | 'withdrawals';

interface PendingRulingModal {
  dispute: Dispute;
  ruling: 'BUYER' | 'SELLER';
  resolution_path: 'NO_RETURN' | 'RETURN_REQUIRED' | 'PARTIAL' | 'DAMAGE_CLAIMED';
  note: string;
  partial_buyer_pct?: number;
  damage_ruling?: 'PRE_EXISTING' | 'ACCIDENTAL' | 'INTENTIONAL';
  tx?: EscrowTransaction;
  buyer?: Profile;
  seller?: Profile;
}

function AdminContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTabParam = (searchParams.get('tab') as AdminTab) || 'overview';
  const [activeTab, setActiveTab] = useState<AdminTab>(activeTabParam);

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mandatory Resolution Notes State (map of dispute.id -> note)
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  // Resolution path selector state per dispute.id
  const [selectedPaths, setSelectedPaths] = useState<Record<string, 'NO_RETURN' | 'RETURN_REQUIRED' | 'PARTIAL' | 'DAMAGE_CLAIMED'>>({});
  const [partialPcts, setPartialPcts] = useState<Record<string, number>>({});
  const [damageRulings, setDamageRulings] = useState<Record<string, 'PRE_EXISTING' | 'ACCIDENTAL' | 'INTENTIONAL'>>({});

  // Confirmation Modal State
  const [pendingRulingModal, setPendingRulingModal] = useState<PendingRulingModal | null>(null);

  // Image Lightbox Overlay State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Filters and Search
  const [txSearch, setTxSearch] = useState('');
  const [txStateFilter, setTxStateFilter] = useState<string>('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [disputeFilter, setDisputeFilter] = useState<string>('ALL');
  const [withdrawalFilter, setWithdrawalFilter] = useState<string>('ALL');

  // Expand/Collapse state per dispute.id
  const [expandedDisputes, setExpandedDisputes] = useState<Record<string, boolean>>({});

  const toggleDisputeExpand = (disputeId: string) => {
    setExpandedDisputes((prev) => {
      const current = prev[disputeId];
      if (current === undefined) {
        const d = disputes.find((item) => item.id === disputeId);
        const isDefaultExpanded = d?.status === 'OPEN' || d?.status === 'UNDER_REVIEW';
        return { ...prev, [disputeId]: !isDefaultExpanded };
      }
      return { ...prev, [disputeId]: !current };
    });
  };

  const isDisputeExpanded = (d: Dispute) => {
    if (expandedDisputes[d.id] !== undefined) {
      return expandedDisputes[d.id];
    }
    return d.status === 'OPEN' || d.status === 'UNDER_REVIEW';
  };

  const expandAllDisputes = () => {
    const next: Record<string, boolean> = {};
    disputes.forEach((d) => (next[d.id] = true));
    setExpandedDisputes(next);
  };

  const collapseAllDisputes = () => {
    const next: Record<string, boolean> = {};
    disputes.forEach((d) => (next[d.id] = false));
    setExpandedDisputes(next);
  };

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab') as AdminTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    router.push(`/admin?tab=${tab}`);
  };

  const loadData = async () => {
    try {
      const [txRes, dispRes, profRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/disputes'),
        fetch('/api/profile?all=true'),
      ]);
      const txData = await txRes.json();
      const dispData = await dispRes.json();
      const profData = await profRes.json();

      if (txData.transactions) setTransactions(txData.transactions);
      else setTransactions(mockStore.getAllTransactions());

      if (dispData.disputes) setDisputes(dispData.disputes);
      else setDisputes(mockStore.getAllDisputes());

      if (profData.profiles && profData.profiles.length > 0) {
        const map = new Map<string, Profile>();
        mockStore.getAllProfiles().forEach((p) => map.set(p.id, p));
        profData.profiles.forEach((p: Profile) => map.set(p.id, p));
        setProfiles(Array.from(map.values()));
      } else {
        setProfiles(mockStore.getAllProfiles());
      }
    } catch {
      setTransactions(mockStore.getAllTransactions());
      setDisputes(mockStore.getAllDisputes());
      setProfiles(mockStore.getAllProfiles());
    }

    setWithdrawals(mockStore.getAllWithdrawals());
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [actionError]);

  // Execute binding dispute resolution
  const handleExecuteResolution = async (
    dispute: Dispute,
    ruling: 'BUYER' | 'SELLER',
    resolution_path: 'NO_RETURN' | 'RETURN_REQUIRED' | 'PARTIAL' | 'DAMAGE_CLAIMED',
    note: string,
    partial_buyer_pct?: number,
    damage_ruling?: 'PRE_EXISTING' | 'ACCIDENTAL' | 'INTENTIONAL'
  ) => {
    setIsProcessing(true);
    setActionSuccess('');
    setActionError('');

    try {
      const res = await fetch('/api/dispute/admin-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispute_id: dispute.id,
          admin_id: user?.id || 'usr_admin_ecobank_03',
          resolution_path,
          ruling,
          resolution_note: note,
          partial_buyer_pct,
          damage_ruling,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.dispute) mockStore.saveDispute(data.dispute);
        if (data.transaction) mockStore.saveTransaction(data.transaction);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('blaze_data_updated'));
        }
        const label = ruling === 'BUYER' ? 'Buyer refunded' : 'Seller paid out';
        setActionSuccess(`Binding ruling executed for Dispute ${dispute.id}: ${label}. Vault updated.`);
        setPendingRulingModal(null);
        setResolutionNotes((prev) => ({ ...prev, [dispute.id]: '' }));
        await loadData();
      } else {
        setActionError(data.error || 'Resolution execution failed.');
      }
    } catch {
      setActionError('Network error — please try again.');
    }

    setIsProcessing(false);
  };

  // User suspension toggle
  const handleToggleUserSuspension = (targetUserId: string, name: string) => {
    const updated = mockStore.toggleUserSuspension(targetUserId);
    if (updated) {
      const statusLabel = updated.is_suspended ? 'suspended' : 'activated';
      setActionSuccess(`User ${name} has been ${statusLabel}.`);
      loadData();
    }
  };

  // Trust score adjustment
  const handleAdjustTrustScore = (targetUserId: string, name: string, delta: number) => {
    const updated = mockStore.adjustTrustScore(targetUserId, delta);
    if (updated) {
      setActionSuccess(
        `Trust score for ${name} updated to ${updated.trust_score} (${updated.trust_tier} Tier).`
      );
      loadData();
    }
  };

  // Withdrawal approvals
  const handleApproveWithdrawal = (id: string, ref: string, amount: number) => {
    const res = mockStore.approveWithdrawal(id);
    if (res) {
      setActionSuccess(`Withdrawal ${ref} (${formatNaira(amount)}) approved & marked paid.`);
      loadData();
    }
  };

  const handleRejectWithdrawal = (id: string, ref: string, amount: number) => {
    const res = mockStore.rejectWithdrawal(id);
    if (res) {
      setActionSuccess(`Withdrawal ${ref} (${formatNaira(amount)}) rejected & refunded to seller balance.`);
      loadData();
    }
  };

  // Helper: Calculate dispute age
  const getDisputeAge = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Raised less than 1 hour ago';
    if (diffHours === 1) return 'Open for 1 hour';
    if (diffHours < 24) return `Open for ${diffHours} hours`;
    const diffDays = Math.floor(diffHours / 24);
    return `Open for ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  // Guard — admin access only
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <Lock className="w-10 h-10 text-slate-400 mx-auto" />
            <h2 className="font-extrabold text-slate-900 text-lg">Sign In Required</h2>
            <p className="text-xs text-slate-500">This hub is restricted to Ecobank Compliance administrators.</p>
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
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm p-8 bg-white border border-rose-200 rounded-3xl shadow-sm">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="font-extrabold text-slate-900 text-lg">Access Denied</h2>
            <p className="text-xs text-slate-500">This compliance portal is restricted to Ecobank admin accounts only.</p>
            <Link href="/dashboard" className="inline-block px-5 py-2.5 bg-slate-100 text-slate-800 rounded-xl font-bold text-xs">Back to Dashboard</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculated Platform Metrics for Overview
  const totalVolumeKobo = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const activeEscrows = transactions.filter(
    (t) => t.state === 'CREATED' || t.state === 'PAID' || t.state === 'DISPATCHED' || t.state === 'DISPUTED'
  );
  const activeEscrowsVolume = activeEscrows.reduce((acc, curr) => acc + curr.amount, 0);
  const disputeRate = transactions.length > 0 ? ((disputes.length / transactions.length) * 100).toFixed(1) : '0';
  const newUsersTodayCount = profiles.length;

  // Filtered Transactions
  const filteredTransactions = (transactions || []).filter((t) => {
    if (!t) return false;
    const title = t.title || '';
    const code = t.code || '';
    const seller = t.seller_name || '';
    const buyer = t.buyer_name || '';
    const query = (txSearch || '').toLowerCase();

    const matchesSearch =
      title.toLowerCase().includes(query) ||
      code.toLowerCase().includes(query) ||
      seller.toLowerCase().includes(query) ||
      buyer.toLowerCase().includes(query);
    const matchesState = txStateFilter === 'ALL' || t.state === txStateFilter;
    return matchesSearch && matchesState;
  });

  // Filtered Users
  const filteredUsers = (profiles || []).filter((p) => {
    if (!p) return false;
    const fullName = p.full_name || '';
    const phone = p.phone || '';
    const query = (userSearch || '').toLowerCase();

    const matchesSearch =
      fullName.toLowerCase().includes(query) ||
      phone.includes(userSearch || '');
    const matchesRole = userRoleFilter === 'ALL' || p.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Disputes
  const filteredDisputes = disputes.filter((d) => {
    if (disputeFilter === 'ALL') return true;
    if (disputeFilter === 'OPEN') return d.status === 'OPEN' || d.status === 'UNDER_REVIEW';
    return d.status === disputeFilter;
  });

  // Filtered Withdrawals
  const filteredWithdrawals = withdrawals.filter((w) => {
    if (withdrawalFilter === 'ALL') return true;
    return w.status === withdrawalFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 text-[10px] font-extrabold uppercase font-mono tracking-wider">
                Ecobank Compliance Admin
              </span>
              <span className="text-xs text-slate-400 font-mono">Live Operating Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-600" /> Admin Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Monitor platform metrics, review evidence & trust credibility, execute binding dispute rulings, and process withdrawals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-600" /> Refresh Data
            </button>
          </div>
        </div>

        {/* Floating Toast Pop-up Notification Banner */}
        <div className="fixed top-5 right-4 left-4 sm:left-auto z-50 max-w-md w-full space-y-2 pointer-events-auto">
          {actionError && (
            <div className="p-4 rounded-2xl bg-slate-900/95 text-rose-300 border border-rose-500/40 text-xs font-extrabold flex items-center justify-between shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-200">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{actionError}</span>
              </div>
              <button onClick={() => setActionError('')} className="p-1 text-slate-400 hover:text-white shrink-0 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {actionSuccess && (
            <div className="p-4 rounded-2xl bg-[#005432]/95 text-white border border-emerald-500/50 text-xs font-extrabold flex items-center justify-between shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
              <button onClick={() => setActionSuccess('')} className="p-1 text-emerald-200 hover:text-white shrink-0 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Dedicated Admin Navigation Tab Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs flex flex-wrap items-center gap-1">
          <button
            onClick={() => handleTabChange('overview')}
            className={`flex-1 min-w-[120px] sm:min-w-0 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => handleTabChange('disputes')}
            className={`flex-1 min-w-[140px] sm:min-w-0 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'disputes'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Dispute Queue
            {disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'disputes' ? 'bg-white text-purple-700' : 'bg-rose-600 text-white'
              }`}>
                {disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('transactions')}
            className={`flex-1 min-w-[130px] sm:min-w-0 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'transactions'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
            }`}
          >
            <ArrowUpDown className="w-4 h-4" /> Transactions
          </button>
          <button
            onClick={() => handleTabChange('users')}
            className={`flex-1 min-w-[110px] sm:min-w-0 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
            }`}
          >
            <UsersIcon className="w-4 h-4" /> Users
          </button>
          <button
            onClick={() => handleTabChange('withdrawals')}
            className={`flex-1 min-w-[130px] sm:min-w-0 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'withdrawals'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
            }`}
          >
            <Landmark className="w-4 h-4" /> Withdrawals
            {withdrawals.filter((w) => w.status === 'PENDING').length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'withdrawals' ? 'bg-white text-purple-700' : 'bg-amber-500 text-white'
              }`}>
                {withdrawals.filter((w) => w.status === 'PENDING').length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Volume</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">
                  {formatNaira(totalVolumeKobo)}
                </div>
                <div className="text-[11px] text-[#006B3F] font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#006B3F]" /> Across {transactions.length} contracts
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Escrows</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006B3F] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">
                  {formatNaira(activeEscrowsVolume)}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {activeEscrows.length} active transactions locked
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dispute Rate</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">
                  {disputeRate}%
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {disputes.length} total dispute cases logged
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Users Today</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <UsersIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">
                  {newUsersTodayCount}
                </div>
                <div className="text-[11px] text-blue-600 font-bold">
                  100% Verified Phone/NIN Profiles
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Layers className="w-4 h-4 text-purple-600" /> Transaction State Distribution
                </h3>

                <div className="space-y-4">
                  {[
                    { label: 'CREATED (Unpaid)', state: 'CREATED', color: 'bg-amber-500' },
                    { label: 'PAID / DISPATCHED', state: 'DISPATCHED', color: 'bg-blue-600' },
                    { label: 'RELEASED (Settled)', state: 'RELEASED', color: 'bg-[#006B3F]' },
                    { label: 'DISPUTED (Frozen)', state: 'DISPUTED', color: 'bg-rose-600' },
                  ].map((item) => {
                    const count = transactions.filter((t) => t.state === item.state).length;
                    const pct = transactions.length > 0 ? Math.round((count / transactions.length) * 100) : 0;
                    return (
                      <div key={item.state} className="space-y-1.5 text-xs">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>{item.label}</span>
                          <span className="font-mono">{count} txs ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-purple-950 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-6">
                <div className="space-y-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold font-mono uppercase tracking-wider inline-flex items-center gap-1 border border-emerald-500/30">
                    <Shield className="w-3 h-3 text-emerald-400" /> Ecobank Vault Verified
                  </span>
                  <h3 className="font-extrabold text-lg text-white">System Security Health</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    All escrow funds are backed by Ecobank 256-bit encrypted multi-sig custody vaults with automated audit logging.
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
                  <div className="flex items-center justify-between text-slate-200">
                    <span>Audit Status:</span>
                    <strong className="text-emerald-400 font-mono">PASSED (Zero Anomaly)</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span>Active Dispute Queue:</span>
                    <strong className="text-purple-300 font-mono">
                      {disputes.filter((d) => d.status === 'OPEN').length} cases pending
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DISPUTE QUEUE */}
        {activeTab === 'disputes' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-600" /> Dispute Arbitration Hub
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect buyer/seller evidence, compare trust score standing, document rationale, and execute binding rulings.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={expandAllDisputes}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-purple-600" /> Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAllDisputes}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <ChevronUp className="w-3.5 h-3.5 text-purple-600" /> Collapse All
                </button>
                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={disputeFilter}
                  onChange={(e) => setDisputeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-600"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open & Pending Review</option>
                  <option value="RESOLVED_BUYER">Resolved (Buyer Refund)</option>
                  <option value="RESOLVED_SELLER">Resolved (Seller Paid)</option>
                </select>
              </div>
            </div>

            <div className="space-y-8">
              {filteredDisputes.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No dispute cases match the selected filter.</div>
              ) : (
                filteredDisputes.map((d) => {
                  const tx = transactions.find((item) => item.id === d.transaction_id) || mockStore.getTransactionById(d.transaction_id);

                  const buyerId = tx?.buyer_id || d.raised_by;
                  const sellerId = tx?.seller_id;

                  let buyer = (buyerId ? profiles.find((p) => p.id === buyerId) : undefined) ||
                    profiles.find((p) => tx?.buyer_name && p.full_name?.toLowerCase().trim() === tx.buyer_name.toLowerCase().trim()) ||
                    mockStore.getProfileById(buyerId || '');
                  let seller = (sellerId ? profiles.find((p) => p.id === sellerId) : undefined) ||
                    profiles.find((p) => tx?.seller_name && p.full_name?.toLowerCase().trim() === tx.seller_name.toLowerCase().trim()) ||
                    mockStore.getProfileById(sellerId || '');

                  if (!buyer) {
                    if (buyerId === MOCK_BUYER.id || tx?.buyer_name?.includes('Tunde') || d.raised_by === MOCK_BUYER.id) {
                      buyer = MOCK_BUYER;
                    } else {
                      buyer = {
                        id: buyerId || 'usr_buyer_default',
                        full_name: tx?.buyer_name || 'Buyer Party',
                        phone: buyerId && buyerId.startsWith('+') ? buyerId : 'Phone verified',
                        role: 'buyer',
                        trust_score: 65,
                        trust_tier: 'Gold',
                        completed_trades: 5,
                        disputed_trades: 1,
                        total_volume: 12700000,
                        ecobank_linked: false,
                        credit_limit: 15000000,
                        simulated_balance: 21100000,
                        created_at: new Date().toISOString(),
                      };
                    }
                  }

                  if (!seller) {
                    if (sellerId === MOCK_SELLER.id || tx?.seller_name?.includes('Amina')) {
                      seller = MOCK_SELLER;
                    } else {
                      seller = {
                        id: sellerId || 'usr_seller_default',
                        full_name: tx?.seller_name || 'Seller Party',
                        phone: sellerId && sellerId.startsWith('+') ? sellerId : 'Phone verified',
                        role: 'seller',
                        trust_score: 72,
                        trust_tier: 'Gold',
                        completed_trades: 14,
                        disputed_trades: 0,
                        total_volume: 45000000,
                        ecobank_linked: true,
                        credit_limit: 15000000,
                        simulated_balance: 18500000,
                        created_at: new Date().toISOString(),
                      };
                    }
                  }
                  const currentNote = resolutionNotes[d.id] || '';
                  const isNoteValid = currentNote.trim().length >= 10;
                  const isExpanded = isDisputeExpanded(d);

                  return (
                    <div
                      key={d.id}
                      className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 transition-all"
                    >
                      {/* Case Header & Expand/Collapse Bar */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                        <div
                          className="space-y-1 flex-1 cursor-pointer select-none"
                          onClick={() => toggleDisputeExpand(d.id)}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono text-purple-700 font-extrabold bg-purple-100 px-2.5 py-0.5 rounded-md">
                              DISPUTE #{d.id}
                            </span>
                            <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-purple-600" /> {getDisputeAge(d.created_at)}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex flex-wrap items-center gap-2">
                            <span>{tx?.title || 'Escrow Item'}</span>
                            <span className="text-xs font-semibold text-slate-500">
                              (Buyer: <strong className="text-slate-800">{buyer?.full_name}</strong> • Seller: <strong className="text-slate-800">{seller?.full_name}</strong>)
                            </span>
                          </h3>
                          <p className="text-xs text-slate-600 font-mono">
                            Contract Code: <strong className="text-[#006B3F]">{tx?.code}</strong> • Vault Escrow Amount:{' '}
                            <strong className="text-slate-900 font-bold">{tx ? formatNaira(tx.amount) : 'N/A'}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                              d.status.startsWith('RESOLVED')
                                ? 'bg-emerald-100 text-[#006B3F] border border-emerald-200'
                                : 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                            }`}
                          >
                            {d.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleDisputeExpand(d.id)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-2xs"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4 text-purple-600" /> Collapse Case
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 text-purple-600" /> Expand Case Details
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* EXPANDABLE CASE CONTENT */}
                      {isExpanded && (
                        <div className="space-y-6 pt-4 border-t border-slate-200/80 animate-in fade-in duration-200">
                          {/* State Trajectory Timeline Badges */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-slate-400 font-medium block text-[10px]">CREATED</span>
                            <strong className="text-slate-800 font-mono text-[11px]">
                              {tx ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </strong>
                          </div>
                        </div>

                        <div className="w-8 h-px bg-slate-200 hidden sm:block" />

                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 ${tx?.dispatched_at ? 'text-emerald-600' : 'text-slate-300'} shrink-0`} />
                          <div>
                            <span className="text-slate-400 font-medium block text-[10px]">DISPATCHED</span>
                            <strong className="text-slate-800 font-mono text-[11px]">
                              {tx?.dispatched_at ? new Date(tx.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                            </strong>
                          </div>
                        </div>

                        <div className="w-8 h-px bg-slate-200 hidden sm:block" />

                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <div>
                            <span className="text-slate-400 font-medium block text-[10px]">DISPUTE RAISED</span>
                            <strong className="text-rose-700 font-mono text-[11px]">
                              {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* FEATURE 3: BUYER VS SELLER TRUST SCORE SIDE-BY-SIDE CONTEXT */}
                      <div className="space-y-2">
                        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <UsersIcon className="w-4 h-4 text-purple-600" /> Parties Standing & Credibility Context
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Buyer Context Card */}
                          <div className="bg-white border border-blue-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-extrabold uppercase">
                                Buyer Party
                              </span>
                              {buyer && <TrustBadge score={buyer.trust_score} tier={buyer.trust_tier} compact />}
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center font-mono text-sm shadow-xs">
                                {(buyer?.full_name || 'B').charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm">{buyer?.full_name || 'Buyer Account'}</h4>
                                <div className="text-[11px] text-slate-500 font-mono">{buyer?.phone || 'Phone verified'}</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                              <div className="bg-slate-50 p-2 rounded-xl">
                                <span className="text-[10px] text-slate-400 block font-bold">Completed</span>
                                <strong className="text-slate-900 font-mono">{buyer?.completed_trades ?? 0}</strong>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-xl">
                                <span className="text-[10px] text-slate-400 block font-bold">Disputes</span>
                                <strong className="text-rose-600 font-mono">{buyer?.disputed_trades ?? 0}</strong>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-xl">
                                <span className="text-[10px] text-slate-400 block font-bold">Volume</span>
                                <strong className="text-slate-900 font-mono">{formatNaira(buyer?.total_volume ?? 0)}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Seller Context Card */}
                          <div className="bg-white border border-purple-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-mono font-extrabold uppercase">
                                Seller Party
                              </span>
                              {seller && <TrustBadge score={seller.trust_score} tier={seller.trust_tier} compact />}
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-extrabold flex items-center justify-center font-mono text-sm shadow-xs">
                                {(seller?.full_name || 'S').charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm">{seller?.full_name || 'Seller Account'}</h4>
                                <div className="text-[11px] text-slate-500 font-mono">{seller?.phone || 'Phone verified'}</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                              <div className="bg-slate-50 p-2 rounded-xl">
                                <span className="text-[10px] text-slate-400 block font-bold">Completed</span>
                                <strong className="text-slate-900 font-mono">{seller?.completed_trades ?? 0}</strong>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-xl">
                                <span className="text-[10px] text-slate-400 block font-bold">Disputes</span>
                                <strong className="text-rose-600 font-mono">{seller?.disputed_trades ?? 0}</strong>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-xl">
                                <span className="text-[10px] text-slate-400 block font-bold">Volume</span>
                                <strong className="text-slate-900 font-mono">{formatNaira(seller?.total_volume ?? 0)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* FEATURE 1: EVIDENCE REVIEW PANEL (BUYER VS SELLER EVIDENCE & MEDIA LIGHTBOX) */}
                      <div className="space-y-2">
                        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-purple-600" /> Evidence Review Panel
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Buyer Evidence Panel */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="font-bold text-rose-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Buyer Claim & Uploaded Evidence
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono font-bold text-[11px] inline-block">
                                Reason: {d.reason}
                              </span>
                              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                "{d.description}"
                              </p>
                            </div>

                            {/* Buyer Media Attachments */}
                            {d.evidence_urls && d.evidence_urls.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3" /> Attached Evidence Media ({d.evidence_urls.length})
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {d.evidence_urls.map((url, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => setPreviewImage(url)}
                                      className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-purple-600 transition-all shadow-2xs"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Eye className="w-4 h-4" />
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Seller Counter-Evidence Panel */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="font-bold text-purple-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" /> Seller Counter-Response ({d.seller_acceptance || 'Pending'})
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {d.seller_responded_at ? new Date(d.seller_responded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No Response'}
                              </span>
                            </div>

                            {d.seller_response ? (
                              <div className="space-y-2">
                                <p className="text-slate-700 leading-relaxed bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                                  &quot;{d.seller_response}&quot;
                                </p>

                                {d.seller_evidence_urls && d.seller_evidence_urls.length > 0 && (
                                  <div className="space-y-1.5 pt-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3" /> Seller Counter-Media ({d.seller_evidence_urls.length})
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                      {d.seller_evidence_urls.map((url: string, idx: number) => (
                                        <button
                                          key={idx}
                                          onClick={() => setPreviewImage(url)}
                                          className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-purple-600 transition-all shadow-2xs"
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={url} alt={`Seller Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                            <Eye className="w-4 h-4" />
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-4 rounded-xl bg-slate-50 text-slate-400 text-xs text-center border border-dashed border-slate-200">
                                Seller has not submitted a formal counter-statement.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AI Evidence Assessment Card */}
                      {d.ai_score && (
                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2 text-purple-900 text-xs">
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5 text-purple-800 text-xs font-extrabold">
                              <Sparkles className="w-4 h-4 text-purple-600" /> AI Evidence & Telemetry Assessment
                            </span>
                            <span className="font-mono text-xs text-purple-700 font-extrabold bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                              {d.ai_score.confidence}% Confidence
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{d.ai_score.reasoning}</p>

                          <div className="pt-2 border-t border-purple-200 text-xs font-bold flex items-center justify-between">
                            <span>Recommended Binding Ruling:</span>
                            <span className="px-3 py-1 rounded-lg bg-purple-600 text-white font-mono font-extrabold text-[11px] uppercase">
                              {d.ai_score.recommendation}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* RESOLUTION PATH SELECTOR & RULING ENGINE */}
                      {d.status === 'OPEN' || d.status === 'UNDER_REVIEW' ? (
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                          {/* Resolution Path Selection Cards */}
                          <div className="space-y-2">
                            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                              1. Select Compliance Resolution Path *
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedPaths({ ...selectedPaths, [d.id]: 'NO_RETURN' })}
                                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-1 transition-all ${
                                  (selectedPaths[d.id] || 'NO_RETURN') === 'NO_RETURN'
                                    ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-500/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <span className="font-extrabold text-xs text-slate-900">No Return Required</span>
                                <span className="text-[11px] text-slate-500">Refund buyer directly without requiring item return.</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPaths({ ...selectedPaths, [d.id]: 'RETURN_REQUIRED' });
                                  if (tx && tx.state !== 'AWAITING_RETURN') {
                                    fetch('/api/dispute/seller-respond', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        dispute_id: d.id,
                                        seller_id: tx.seller_id,
                                        acceptance: 'RETURN_REQUIRED',
                                        response_text: 'Admin initiated return requirement flow.',
                                      }),
                                    }).then(() => loadData());
                                  }
                                }}
                                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-1 transition-all ${
                                  selectedPaths[d.id] === 'RETURN_REQUIRED' || tx?.state === 'AWAITING_RETURN' || tx?.state === 'RETURN_DISPATCHED'
                                    ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <span className="font-extrabold text-xs text-slate-900">Return Required</span>
                                <span className="text-[11px] text-slate-500">Trigger return dispatch flow before refunding.</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedPaths({ ...selectedPaths, [d.id]: 'PARTIAL' })}
                                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-1 transition-all ${
                                  selectedPaths[d.id] === 'PARTIAL'
                                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <span className="font-extrabold text-xs text-slate-900">Partial Resolution</span>
                                <span className="text-[11px] text-slate-500">Split amount between buyer & seller (set %).</span>
                              </button>
                            </div>
                          </div>

                          {/* Partial Resolution Percentage Input & Live Naira Calculation */}
                          {selectedPaths[d.id] === 'PARTIAL' && (
                            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-extrabold text-blue-900">Set Partial Split Percentage</label>
                                <span className="font-mono text-xs font-extrabold text-blue-800 bg-white px-2.5 py-0.5 rounded border border-blue-200">
                                  Buyer {partialPcts[d.id] ?? 50}% · Seller {100 - (partialPcts[d.id] ?? 50)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={1}
                                max={99}
                                value={partialPcts[d.id] ?? 50}
                                onChange={(e) => setPartialPcts({ ...partialPcts, [d.id]: parseInt(e.target.value) })}
                                className="w-full accent-blue-600 cursor-pointer"
                              />
                              <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-blue-100">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold block">Buyer Refund:</span>
                                  <span className="font-mono font-extrabold text-[#006B3F] text-sm">
                                    {formatNaira(Math.floor(((tx?.amount || 0) * (partialPcts[d.id] ?? 50)) / 100))}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold block">Seller Release:</span>
                                  <span className="font-mono font-extrabold text-blue-700 text-sm">
                                    {formatNaira((tx?.amount || 0) - Math.floor(((tx?.amount || 0) * (partialPcts[d.id] ?? 50)) / 100))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* DAMAGE CLAIMED State Special Rulings Cards */}
                          {(tx?.state === 'DAMAGE_CLAIMED' || d.resolution_path === 'DAMAGE_CLAIMED') && (
                            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                              <span className="text-xs font-extrabold text-rose-900 block">
                                Damage Claim Ruling Decision (Select Assessment):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setDamageRulings({ ...damageRulings, [d.id]: 'PRE_EXISTING' })}
                                  className={`p-3 rounded-xl border text-left font-bold transition-all ${
                                    (damageRulings[d.id] || 'PRE_EXISTING') === 'PRE_EXISTING'
                                      ? 'bg-white border-rose-600 text-rose-800 ring-2 ring-rose-500/20'
                                      : 'bg-rose-100/50 border-rose-200 text-slate-700'
                                  }`}
                                >
                                  1. Pre-existing Damage
                                  <span className="block text-[10px] font-normal text-slate-600 mt-0.5">Full refund to buyer</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDamageRulings({ ...damageRulings, [d.id]: 'ACCIDENTAL' })}
                                  className={`p-3 rounded-xl border text-left font-bold transition-all ${
                                    damageRulings[d.id] === 'ACCIDENTAL'
                                      ? 'bg-white border-amber-600 text-amber-900 ring-2 ring-amber-500/20'
                                      : 'bg-rose-100/50 border-rose-200 text-slate-700'
                                  }`}
                                >
                                  2. Accidental Damage
                                  <span className="block text-[10px] font-normal text-slate-600 mt-0.5">Split loss percentage</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDamageRulings({ ...damageRulings, [d.id]: 'INTENTIONAL' })}
                                  className={`p-3 rounded-xl border text-left font-bold transition-all ${
                                    damageRulings[d.id] === 'INTENTIONAL'
                                      ? 'bg-white border-rose-700 text-rose-900 ring-2 ring-rose-600/30'
                                      : 'bg-rose-100/50 border-rose-200 text-slate-700'
                                  }`}
                                >
                                  3. Intentional Damage
                                  <span className="block text-[10px] font-normal text-slate-600 mt-0.5">Release to seller & flag buyer</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Mandatory Rationale Field with 20 min chars enforcement */}
                          <div className="space-y-1">
                            <label className="text-xs font-extrabold text-slate-900 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-purple-600" /> Mandatory Compliance Rationale (Min 20 Characters) *
                              </span>
                              <span className={`font-mono text-[11px] ${currentNote.trim().length >= 20 ? 'text-[#006B3F] font-bold' : 'text-rose-600'}`}>
                                {currentNote.trim().length} / 20 min chars
                              </span>
                            </label>
                            <textarea
                              rows={2}
                              value={currentNote}
                              onChange={(e) => setResolutionNotes({ ...resolutionNotes, [d.id]: e.target.value })}
                              placeholder="Type mandatory compliance rationale (min 20 chars)... e.g., Inspected waybill receipt photos and buyer video evidence. Verified pre-existing defect."
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 shadow-2xs font-medium"
                            />
                            {currentNote.trim().length < 20 && (
                              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Resolution note must be at least 20 characters before ruling buttons activate.
                              </p>
                            )}
                          </div>

                          {/* Binding Ruling Action Buttons showing Exact Naira Amounts */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                            <span className="text-xs text-slate-500 font-medium">Execute Financial Ruling:</span>

                            <div className="flex items-center gap-2.5 w-full sm:w-auto">
                              <button
                                onClick={() =>
                                  setPendingRulingModal({
                                    dispute: d,
                                    ruling: 'BUYER',
                                    resolution_path: selectedPaths[d.id] || 'NO_RETURN',
                                    note: currentNote,
                                    partial_buyer_pct: partialPcts[d.id] ?? 50,
                                    damage_ruling: damageRulings[d.id] || 'PRE_EXISTING',
                                    tx,
                                    buyer,
                                    seller,
                                  })
                                }
                                disabled={currentNote.trim().length < 20 || isProcessing}
                                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-all shadow-sm disabled:opacity-40 disabled:hover:bg-rose-600 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                {selectedPaths[d.id] === 'PARTIAL'
                                  ? `Split — Buyer ${formatNaira(Math.floor(((tx?.amount || 0) * (partialPcts[d.id] ?? 50)) / 100))}`
                                  : `Refund Buyer — ${formatNaira(tx?.amount || 0)}`}
                              </button>

                              <button
                                onClick={() =>
                                  setPendingRulingModal({
                                    dispute: d,
                                    ruling: 'SELLER',
                                    resolution_path: selectedPaths[d.id] || 'NO_RETURN',
                                    note: currentNote,
                                    damage_ruling: damageRulings[d.id] || 'PRE_EXISTING',
                                    tx,
                                    buyer,
                                    seller,
                                  })
                                }
                                disabled={currentNote.trim().length < 20 || isProcessing}
                                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white font-extrabold text-xs transition-all shadow-sm disabled:opacity-40 disabled:hover:bg-[#006B3F] cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                Release to Seller — {formatNaira(tx?.net_amount || 0)}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                          <div className="text-xs text-[#006B3F] font-extrabold flex items-center gap-2 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
                            <CheckCircle2 className="w-5 h-5 text-[#006B3F] shrink-0" />
                            <div>
                              <span className="block font-bold text-slate-900">Case Closed & Settled:</span>
                              <span className="text-slate-700 font-normal">{d.resolution_note || 'Resolved by Compliance Auditor'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5 text-purple-600" /> Platform Transactions Registry
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete view of all escrow agreements created across all merchants and buyers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search title, code, user..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 w-48 sm:w-64"
                  />
                </div>

                <select
                  value={txStateFilter}
                  onChange={(e) => setTxStateFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-600"
                >
                  <option value="ALL">All States</option>
                  <option value="CREATED">CREATED</option>
                  <option value="DISPATCHED">DISPATCHED</option>
                  <option value="RELEASED">RELEASED</option>
                  <option value="DISPUTED">DISPUTED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                    <th className="py-3 px-4">Contract / Title</th>
                    <th className="py-3 px-4">Seller</th>
                    <th className="py-3 px-4">Buyer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Fee</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No transactions found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div className="font-bold text-slate-900">{tx.title}</div>
                          <div className="text-[11px] font-mono text-[#006B3F]">{tx.code}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {tx.seller_name || tx.seller_id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {tx.buyer_name || (tx.buyer_id ? tx.buyer_id : <span className="text-slate-400 italic">Unassigned</span>)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {formatNaira(tx.amount)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {formatNaira(tx.fee)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase ${
                              tx.state === 'RELEASED'
                                ? 'bg-emerald-100 text-[#006B3F]'
                                : tx.state === 'DISPUTED'
                                ? 'bg-rose-100 text-rose-700'
                                : tx.state === 'DISPATCHED'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tx.state}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/pay/${tx.code.replace('#', '')}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: USERS */}
        {activeTab === 'users' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-purple-600" /> User Directory & Risk Control
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect user profiles, trust tier standing, and toggle suspension flags.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name or phone..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 w-48 sm:w-64"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-600"
                >
                  <option value="ALL">All Roles</option>
                  <option value="seller">Seller</option>
                  <option value="buyer">Buyer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                  No user profiles found matching search criteria.
                </div>
              ) : (
                filteredUsers.map((p) => (
                  <div
                    key={p.id}
                    className={`border rounded-2xl p-5 space-y-4 transition-all shadow-xs ${
                      p.is_suspended
                        ? 'bg-rose-50/60 border-rose-200'
                        : 'bg-white border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-extrabold flex items-center justify-center font-mono text-sm shadow-xs">
                          {(p.full_name || 'U').charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            {p.full_name || 'Unnamed User'}
                            {p.is_suspended && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[9px] font-bold uppercase">
                                SUSPENDED
                              </span>
                            )}
                          </h3>
                          <div className="text-[11px] text-slate-500 font-mono">{p.phone || 'N/A'}</div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase">
                        {p.role}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Trust Tier</div>
                        <TrustBadge score={p.trust_score} tier={p.trust_tier} compact />
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Wallet Balance</div>
                        <div className="font-mono font-bold text-slate-900">{formatNaira(p.simulated_balance)}</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAdjustTrustScore(p.id, p.full_name, -10)}
                          title="Reduce Trust Score (-10)"
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 text-[10px] font-mono font-bold transition-all"
                        >
                          -10 Trust
                        </button>
                        <button
                          onClick={() => handleAdjustTrustScore(p.id, p.full_name, 10)}
                          title="Increase Trust Score (+10)"
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 text-[10px] font-mono font-bold transition-all"
                        >
                          +10 Trust
                        </button>
                      </div>

                      {p.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserSuspension(p.id, p.full_name)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            p.is_suspended
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                          }`}
                        >
                          {p.is_suspended ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Activate
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" /> Suspend
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: WITHDRAWALS */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-purple-600" /> Pending Bank Withdrawals Queue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Process pending bank payout transfers requested by verified merchants.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={withdrawalFilter}
                  onChange={(e) => setWithdrawalFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-600"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">PENDING (Needs Approval)</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="FAILED">FAILED / REJECTED</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredWithdrawals.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No withdrawal payout requests found.</div>
              ) : (
                filteredWithdrawals.map((w) => {
                  const seller = mockStore.getProfileById(w.seller_id);
                  return (
                    <div
                      key={w.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-purple-700">REF: {w.reference}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              w.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-[#006B3F]'
                                : w.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {w.status}
                          </span>
                        </div>

                        <div className="font-extrabold text-slate-900 text-base">
                          {formatNaira(w.amount)}
                        </div>

                        <div className="text-xs text-slate-600">
                          Beneficiary: <strong className="text-slate-900">{w.account_name}</strong> ({w.bank_name} • {w.account_number})
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Merchant ID: {seller?.full_name || w.seller_id} • Requested {new Date(w.created_at).toLocaleString()}
                        </div>
                      </div>

                      {w.status === 'PENDING' ? (
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <button
                            onClick={() => handleRejectWithdrawal(w.id, w.reference, w.amount)}
                            className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-all"
                          >
                            Reject & Refund
                          </button>
                          <button
                            onClick={() => handleApproveWithdrawal(w.id, w.reference, w.amount)}
                            className="px-4 py-2 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" /> Approve Bank Transfer
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-slate-400 font-semibold self-start sm:self-center">
                          Processed {w.processed_at ? new Date(w.processed_at).toLocaleTimeString() : 'Done'}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* FEATURE 4: CONFIRMATION MODAL BEFORE EXECUTING BINDING RULING */}
      {pendingRulingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setPendingRulingModal(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  pendingRulingModal.ruling === 'BUYER'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-[#006B3F]'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Irreversible Binding Financial Ruling
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg">Confirm Dispute Ruling</h3>
              </div>
            </div>

            {/* Ruling Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5 text-slate-800">
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="font-bold text-slate-500">Resolution Path:</span>
                <span className="font-mono font-extrabold text-purple-700">{pendingRulingModal.resolution_path}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="font-bold text-slate-500">Contract Code:</span>
                <span className="font-mono font-extrabold text-[#006B3F]">{pendingRulingModal.tx?.code}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="font-bold text-slate-500">Ruling Outcome:</span>
                <span className="font-extrabold text-slate-900">
                  {pendingRulingModal.ruling === 'BUYER'
                    ? pendingRulingModal.resolution_path === 'PARTIAL'
                      ? `Partial Refund (Buyer ${pendingRulingModal.partial_buyer_pct}%)`
                      : 'Refund to Buyer'
                    : 'Release to Seller'}
                </span>
              </div>
              <div className="flex justify-between font-mono text-sm pt-1">
                <span className="font-bold text-slate-700">Financial Execution:</span>
                <span className="font-extrabold text-slate-900">
                  {pendingRulingModal.ruling === 'BUYER'
                    ? `₦${((pendingRulingModal.tx?.amount || 0) / 100).toLocaleString()} → Buyer`
                    : `₦${((pendingRulingModal.tx?.net_amount || 0) / 100).toLocaleString()} → Seller`}
                </span>
              </div>
            </div>

            {/* Documented Rationale Preview */}
            <div className="space-y-1 text-xs">
              <span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider block">
                Compliance Rationale:
              </span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium italic">
                &quot;{pendingRulingModal.note}&quot;
              </div>
            </div>

            {/* Trust Score Impact Breakdown */}
            <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs space-y-1.5">
              <span className="font-extrabold text-amber-900 uppercase text-[10px] tracking-wider block flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" /> Projected Trust Score Impact:
              </span>
              <div className="flex justify-between text-[11px] text-amber-900 font-mono">
                <span>Seller ({pendingRulingModal.seller?.full_name || 'Seller'}):</span>
                <span className="font-bold">{pendingRulingModal.ruling === 'BUYER' ? '−8 pts' : '0 pts'}</span>
              </div>
              <div className="flex justify-between text-[11px] text-amber-900 font-mono">
                <span>Buyer ({pendingRulingModal.buyer?.full_name || 'Buyer'}):</span>
                <span className="font-bold">
                  {pendingRulingModal.ruling === 'BUYER'
                    ? '+2 pts'
                    : pendingRulingModal.damage_ruling === 'INTENTIONAL'
                    ? '−20 pts (Account Flagged)'
                    : '−5 pts'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-rose-700 font-bold uppercase text-center">
              This action executes live wallet transfers and is irreversible.
            </p>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => setPendingRulingModal(null)}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleExecuteResolution(
                    pendingRulingModal.dispute,
                    pendingRulingModal.ruling,
                    pendingRulingModal.resolution_path,
                    pendingRulingModal.note,
                    pendingRulingModal.partial_buyer_pct,
                    pendingRulingModal.damage_ruling
                  )
                }
                disabled={isProcessing}
                className={`px-5 py-2.5 rounded-xl text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-2 ${
                  pendingRulingModal.ruling === 'BUYER'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#006B3F] hover:bg-[#005432]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Executing Ruling...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Confirm & Execute Ruling
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL FOR EVIDENCE MEDIA */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all font-bold text-xs flex items-center gap-1.5"
            >
              <X className="w-5 h-5" /> Close Lightbox
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="Evidence Full Preview" className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20" />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="flex items-center gap-3 text-purple-700 font-extrabold text-sm">
            <RefreshCw className="w-5 h-5 animate-spin" /> Loading Compliance Portal...
          </div>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
