'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { DemoSwitcher } from '@/components/layout/DemoSwitcher';
import { Footer } from '@/components/layout/Footer';
import { ShieldCheck, Play, ArrowRight, UserCheck, ShieldAlert, Sparkles, Copy, Check } from 'lucide-react';

export default function DemoLauncherPage() {
  const { switchDemoUser } = useAuth();
  const [copiedCode, setCopiedCode] = React.useState(false);

  const demoLink = '/pay/escrow-vintage-denim-99a2';

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <DemoSwitcher />
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full bg-[#006B3F]/20 text-[#00874E] text-xs font-bold border border-[#006B3F]/30 uppercase tracking-wide inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> InnovateX 2026 Hackathon Demo Launcher
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Blaze Escrow-Link Interactive Judging Guide
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Test the complete end-to-end P2P social commerce trust engine across 3 pre-configured demo personas.
          </p>
        </div>

        {/* 3 Persona Quick Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Amina Bello</h3>
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block">Seller Persona</span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                ThriftPlug Unilag merchant. Creates payment links, receives escrow lock alerts, dispatches items.
              </p>
            </div>
            <button
              onClick={() => switchDemoUser('seller')}
              className="w-full py-2.5 rounded-xl bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold text-xs transition-all shadow-md"
            >
              Activate Seller (Amina)
            </button>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Tunde Bakare</h3>
              <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider block">Buyer Persona</span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Campus buyer at Unilag. Pays via wallet or bank transfer, verifies delivery, or files disputes.
              </p>
            </div>
            <button
              onClick={() => switchDemoUser('buyer')}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md"
            >
              Activate Buyer (Tunde)
            </button>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Compliance Admin</h3>
              <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider block">Ecobank Auditor</span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ecobank Compliance Officer. Arbitrates disputed escrow funds with AI evidence recommendations.
              </p>
            </div>
            <button
              onClick={() => switchDemoUser('admin')}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all shadow-md"
            >
              Activate Admin (Ecobank)
            </button>
          </div>
        </div>

        {/* Guided Test Steps */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="font-bold text-white text-base uppercase tracking-wider">Recommended Judging Test Flow</h2>

          <div className="space-y-3 text-xs text-zinc-300">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <span className="w-6 h-6 rounded-full bg-[#006B3F] text-white flex items-center justify-center font-mono font-bold shrink-0">
                1
              </span>
              <div>
                <strong className="text-white block font-semibold text-sm">Create Link on Merchant Dashboard</strong>
                Switch to <span className="text-emerald-400 font-semibold">Amina (Seller)</span>, open{' '}
                <Link href="/dashboard" className="text-emerald-400 underline font-semibold">
                  /dashboard
                </Link>{' '}
                and generate a new Escrow Payment Link for any item.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold shrink-0">
                2
              </span>
              <div>
                <strong className="text-white block font-semibold text-sm">Lock Funds as Buyer</strong>
                Switch to <span className="text-blue-400 font-semibold">Tunde (Buyer)</span>, visit the generated link or open the pre-built sample contract below and pay via Wallet or Bank Transfer.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-mono font-bold shrink-0">
                3
              </span>
              <div>
                <strong className="text-white block font-semibold text-sm">Dispatch & Handshake / Dispute Resolution</strong>
                Dispatch item as Amina, confirm delivery as Tunde, or test raising a dispute and resolving it on the{' '}
                <Link href="/admin" className="text-purple-400 underline font-semibold">
                  /admin
                </Link>{' '}
                Compliance Hub.
              </div>
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link
              href={demoLink}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold text-sm transition-all shadow-xl"
            >
              Launch Live Sample Escrow Contract <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
