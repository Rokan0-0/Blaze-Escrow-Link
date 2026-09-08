'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { DemoSwitcher } from '@/components/layout/DemoSwitcher';
import { Footer } from '@/components/layout/Footer';
import { TrustBadge } from '@/components/trust/TrustBadge';
import { formatNaira } from '@/lib/formatters';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  Landmark,
  Zap,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col selection:bg-[#006B3F] selection:text-white">
      <DemoSwitcher />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#006B3F]/10 border border-[#006B3F]/30 text-[#00874E] text-xs font-semibold uppercase tracking-wider">
            <Landmark className="w-4 h-4" /> Ecobank Blaze Micro-Escrow Engine
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            Social Commerce Trade, <br />
            <span className="bg-gradient-to-r from-[#00874E] via-emerald-400 to-teal-200 bg-clip-text text-transparent">
              Protected by 256-Bit Escrow Vault.
            </span>
          </h1>

          <p className="text-xs sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate P2P social commerce fraud across WhatsApp, Instagram, and campus forums in Nigeria.
            Funds are safely locked in Ecobank vault until delivery is verified.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold text-sm transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Create Escrow Link Now
            </Link>

            <Link
              href="/demo"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] text-zinc-200 border border-[#2A2A2A] font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" /> Interactive Judge Demo Launcher
            </Link>
          </div>

          {/* Key Metrics Banner */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-left border-t border-[#2A2A2A]/60 max-w-4xl mx-auto">
            <div className="space-y-0.5">
              <div className="text-xl font-extrabold font-mono text-white">₦0 Fraud</div>
              <div className="text-xs text-zinc-400">Escrow Vault Guarantee</div>
            </div>

            <div className="space-y-0.5">
              <div className="text-xl font-extrabold font-mono text-[#00874E]">0.75%</div>
              <div className="text-xs text-zinc-400">Capped at ₦500 max fee</div>
            </div>

            <div className="space-y-0.5">
              <div className="text-xl font-extrabold font-mono text-purple-400">48-Hour</div>
              <div className="text-xs text-zinc-400">Auto-release timer</div>
            </div>

            <div className="space-y-0.5">
              <div className="text-xl font-extrabold font-mono text-amber-400">*329#</div>
              <div className="text-xs text-zinc-400">Offline USSD PIN Handshake</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-16 bg-[#111111]/50 border-y border-[#2A2A2A] px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Engineered for Nigerian Social Commerce
            </h2>
            <p className="text-xs text-zinc-400">
              Built natively into Ecobank Blaze for campus sellers, thrift vendors, and Instagram shops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-3">
              <div className="p-3 rounded-xl bg-[#006B3F]/10 text-[#00874E] border border-[#006B3F]/20 w-fit">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Instant Social Links</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sellers generate shareable links with embedded escrow rules directly for WhatsApp chats, Instagram DMs, and Twitter posts.
              </p>
            </div>

            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">256-Bit Escrow Vault</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Buyer funds are locked securely in an Ecobank escrow vault. Neither party can tamper with funds until delivery is confirmed.
              </p>
            </div>

            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-3">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">AI Dispute Resolution</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ecobank Compliance Team utilizes AI evidence scoring to resolve disputed trades with high precision and automated payouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Sample Escrow Contract CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#111111] to-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 uppercase tracking-wide inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Ready for Testing
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Test a Live Escrow Contract Right Now
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Experience how a buyer locks ₦18,500 for a Vintage Denim Jacket contract, seller dispatches, and funds auto-release.
          </p>

          <div className="pt-2">
            <Link
              href="/pay/escrow-vintage-denim-99a2"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold text-sm transition-all shadow-2xl"
            >
              Open Live Escrow Contract <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
