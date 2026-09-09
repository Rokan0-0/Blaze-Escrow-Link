'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ShieldCheck, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';

export default function DemoLauncherPage() {
  const router = useRouter();
  const { switchDemoUser } = useAuth();
  const demoLink = '/pay/escrow-vintage-denim-99a2';

  const handleSwitchSeller = () => {
    switchDemoUser('seller');
    router.push('/dashboard');
  };

  const handleSwitchBuyer = () => {
    switchDemoUser('buyer');
    router.push('/orders');
  };

  const handleSwitchAdmin = () => {
    switchDemoUser('admin');
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-[#006B3F] text-xs font-extrabold border border-emerald-200 uppercase tracking-wide inline-flex items-center gap-1.5 shadow-2xs">
            InnovateX 2026 Hackathon Demo Launcher
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Blaze Escrow-Link Interactive Judging Guide
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed font-medium">
            Test the complete end-to-end P2P social commerce trust engine across 3 pre-configured demo personas.
          </p>
        </div>

        {/* 3 Persona Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-[#006B3F] border border-emerald-200 w-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Amina Bello</h3>
              <span className="text-xs text-[#006B3F] font-extrabold uppercase tracking-wider block">Seller Persona</span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                ThriftPlug Unilag merchant. Creates payment links, receives escrow lock alerts, dispatches items.
              </p>
            </div>
            <button
              onClick={handleSwitchSeller}
              className="w-full py-2.5 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white font-extrabold text-xs transition-all shadow-md"
            >
              Activate Seller (Amina)
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 w-fit">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Tunde Bakare</h3>
              <span className="text-xs text-blue-700 font-extrabold uppercase tracking-wider block">Buyer Persona</span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Campus buyer at Unilag. Pays via wallet or bank transfer, verifies delivery, or files disputes.
              </p>
            </div>
            <button
              onClick={handleSwitchBuyer}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all shadow-md"
            >
              Activate Buyer (Tunde)
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 w-fit">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Compliance Admin</h3>
              <span className="text-xs text-purple-700 font-extrabold uppercase tracking-wider block">Ecobank Auditor</span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Ecobank Compliance Officer. Arbitrates disputed escrow funds with AI evidence recommendations.
              </p>
            </div>
            <button
              onClick={handleSwitchAdmin}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition-all shadow-md"
            >
              Activate Admin (Ecobank)
            </button>
          </div>
        </div>

        {/* Guided Test Steps */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="font-extrabold text-slate-900 text-base uppercase tracking-wider">Recommended Judging Test Flow</h2>

          <div className="space-y-3 text-xs text-slate-700 font-medium">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-[#006B3F] text-white flex items-center justify-center font-mono font-bold shrink-0">
                1
              </span>
              <div>
                <strong className="text-slate-900 block font-bold text-sm">Create Link on Merchant Dashboard</strong>
                Switch to <span className="text-[#006B3F] font-bold">Amina (Seller)</span>, open{' '}
                <Link href="/dashboard" className="text-[#006B3F] underline font-bold">
                  /dashboard
                </Link>{' '}
                and generate a new Escrow Payment Link for any item.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold shrink-0">
                2
              </span>
              <div>
                <strong className="text-slate-900 block font-bold text-sm">Lock Funds as Buyer</strong>
                Switch to <span className="text-blue-700 font-bold">Tunde (Buyer)</span>, visit the generated link or open the pre-built sample contract below and pay via Wallet or Bank Transfer.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-mono font-bold shrink-0">
                3
              </span>
              <div>
                <strong className="text-slate-900 block font-bold text-sm">Dispatch & Handshake / Dispute Resolution</strong>
                Dispatch item as Amina, confirm delivery as Tunde, or test raising a dispute and resolving it on the{' '}
                <Link href="/admin" className="text-purple-700 underline font-bold">
                  /admin
                </Link>{' '}
                Compliance Hub.
              </div>
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link
              href={demoLink}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold text-sm transition-all shadow-md"
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
