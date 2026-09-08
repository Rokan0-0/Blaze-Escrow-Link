'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { ShieldCheck, UserCheck, ShieldAlert, ArrowRightLeft } from 'lucide-react';

export function DemoSwitcher() {
  const { user, switchDemoUser } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-[#111111] border-b border-[#2A2A2A] px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 text-[11px] tracking-wide uppercase flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3" /> Judge Mode
          </span>
          <span className="text-zinc-400">Active Persona:</span>
          <span className="font-semibold text-white flex items-center gap-1.5">
            {user.role === 'admin' ? (
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            ) : user.role === 'seller' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            )}
            {user.full_name} ({user.role.toUpperCase()})
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-zinc-500 text-[11px] hidden md:inline">Switch Role:</span>
          <button
            onClick={() => switchDemoUser('seller')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              user.id === 'usr_seller_amina_01'
                ? 'bg-[#006B3F] text-white font-semibold shadow-sm'
                : 'bg-[#1A1A1A] text-zinc-300 hover:bg-[#252525] border border-[#2A2A2A]'
            }`}
          >
            Seller (Amina)
          </button>
          <button
            onClick={() => switchDemoUser('buyer')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              user.id === 'usr_buyer_tunde_02'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-[#1A1A1A] text-zinc-300 hover:bg-[#252525] border border-[#2A2A2A]'
            }`}
          >
            Buyer (Tunde)
          </button>
          <button
            onClick={() => switchDemoUser('admin')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              user.role === 'admin'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'bg-[#1A1A1A] text-zinc-300 hover:bg-[#252525] border border-[#2A2A2A]'
            }`}
          >
            Admin (Ecobank)
          </button>
        </div>
      </div>
    </div>
  );
}
