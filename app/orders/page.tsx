'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { mockStore } from '@/lib/mock/store';
import { EscrowTransaction } from '@/lib/mock/types';
import { formatNaira, formatDate, getStateBadgeStyle } from '@/lib/formatters';
import { Navbar } from '@/components/layout/Navbar';
import { DemoSwitcher } from '@/components/layout/DemoSwitcher';
import { Footer } from '@/components/layout/Footer';
import { ShoppingBag, ArrowRight, ShieldCheck, Clock, ExternalLink } from 'lucide-react';

export default function BuyerOrdersPage() {
  const { user, switchDemoUser } = useAuth();
  const [orders, setOrders] = useState<EscrowTransaction[]>([]);

  useEffect(() => {
    if (user) {
      const all = mockStore.getAllTransactions();
      const buyerOrders = all.filter((t) => t.buyer_id === user.id || user.role === 'buyer');
      setOrders(buyerOrders);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <DemoSwitcher />
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-400" /> My Buyer Escrow Orders
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Track and confirm your social commerce orders protected by Ecobank Blaze Escrow.
            </p>
          </div>

          {user?.role !== 'buyer' && (
            <button
              onClick={() => switchDemoUser('buyer')}
              className="px-3.5 py-2 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600/30 transition-all"
            >
              Switch to Buyer (Tunde Bakare)
            </button>
          )}
        </div>

        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-10 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 mx-auto text-zinc-600" />
              <h3 className="text-white font-bold text-sm">No Active Buyer Orders</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                When you pay through a Blaze Escrow payment link on WhatsApp or Instagram, your order status will appear here.
              </p>
              <Link
                href="/pay/escrow-vintage-denim-99a2"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold text-xs transition-all shadow-lg"
              >
                Try Live Payment Link Demo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            orders.map((o) => {
              const badge = getStateBadgeStyle(o.state);
              return (
                <div
                  key={o.id}
                  className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400 font-bold text-xs">{o.code}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {o.state}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-sm">{o.title}</h3>
                    <div className="text-xs text-zinc-400 font-mono">
                      Price: <strong className="text-white">{formatNaira(o.amount)}</strong> • Seller:{' '}
                      <strong className="text-zinc-300">{o.seller_name || 'Amina Bello'}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                      href={`/pay/${encodeURIComponent(o.code)}`}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      Manage Contract <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
