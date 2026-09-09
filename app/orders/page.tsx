'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { mockStore } from '@/lib/mock/store';
import { EscrowTransaction } from '@/lib/mock/types';
import { formatNaira, formatDate } from '@/lib/formatters';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ShoppingBag, ArrowRight, ExternalLink, Clock, CheckCircle2, AlertTriangle, Truck } from 'lucide-react';

const STATE_COLORS: Record<string, string> = {
  CREATED: 'bg-slate-100 text-slate-700 border-slate-200',
  PAID: 'bg-amber-50 text-amber-800 border-amber-200',
  DISPATCHED: 'bg-blue-50 text-blue-700 border-blue-200',
  CONFIRMED: 'bg-emerald-50 text-[#006B3F] border-emerald-200',
  RELEASED: 'bg-emerald-50 text-[#006B3F] border-emerald-200',
  DISPUTED: 'bg-rose-50 text-rose-700 border-rose-200',
  REFUNDED: 'bg-orange-50 text-orange-700 border-orange-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
};

const STATE_ICONS: Record<string, React.ReactNode> = {
  CREATED: <Clock className="w-3.5 h-3.5" />,
  PAID: <CheckCircle2 className="w-3.5 h-3.5" />,
  DISPATCHED: <Truck className="w-3.5 h-3.5" />,
  RELEASED: <CheckCircle2 className="w-3.5 h-3.5" />,
  DISPUTED: <AlertTriangle className="w-3.5 h-3.5" />,
};

export default function BuyerOrdersPage() {
  const { user, openAuthModal, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<EscrowTransaction[]>([]);

  const loadOrders = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/transactions?buyer_id=${user.id}`);
      const data = await res.json();
      if (data.transactions) {
        setOrders(data.transactions);
        return;
      }
    } catch (e) {}
    const all = mockStore.getAllTransactions();
    setOrders(all.filter((t) => t.buyer_id === user.id));
  };

  useEffect(() => {
    if (user) {
      loadOrders();
      refreshProfile();
      const interval = setInterval(() => {
        loadOrders();
        refreshProfile();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 text-center space-y-4 shadow-2xs max-w-md w-full">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
            <h2 className="text-slate-900 font-extrabold text-base">Sign In to View Your Orders</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Track and confirm your social commerce purchases protected by Ecobank Blaze Escrow.
            </p>
            <button
              onClick={openAuthModal}
              className="px-6 py-3 rounded-2xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold text-xs shadow-md transition-all"
            >
              Sign In as Buyer
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" /> My Buyer Orders
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Escrow-protected purchases for <span className="text-slate-900 font-bold">{user.full_name}</span>
            </p>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 font-mono">
            {orders.length} active order{orders.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 text-center space-y-4 shadow-2xs">
              <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-slate-300" />
              <h3 className="text-slate-900 font-extrabold text-sm">No Active Buyer Orders</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                When you pay through a Blaze Escrow link on WhatsApp or Instagram, your contract status will appear here.
              </p>
              <Link
                href="/pay/%23escrow-vintage-denim-99a2"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold text-xs transition-all shadow-md"
              >
                Try Live Payment Link Demo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:shadow-xs transition-shadow"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[#006B3F] font-bold text-[11px] sm:text-xs">{o.code}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase border flex items-center gap-1 ${STATE_COLORS[o.state] || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                    >
                      {STATE_ICONS[o.state]} {o.state}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{o.title}</h3>
                  <div className="text-[11px] text-slate-500 font-mono flex flex-wrap gap-2.5 sm:gap-3">
                    <span>Amount: <strong className="text-slate-900">{formatNaira(o.amount)}</strong></span>
                    <span>Seller: <strong className="text-slate-700">{o.seller_name || 'Amina Bello'}</strong></span>
                    <span>Date: <strong className="text-slate-700">{formatDate(o.created_at)}</strong></span>
                  </div>
                  {o.state === 'DISPATCHED' && o.tracking_id && (
                    <div className="text-[11px] font-mono text-purple-700 font-bold">
                      Tracking: {o.tracking_id}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <Link
                    href={`/pay/${encodeURIComponent(o.code)}`}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    {o.state === 'DISPATCHED' ? 'Confirm Delivery' : 'Manage Order'} <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
