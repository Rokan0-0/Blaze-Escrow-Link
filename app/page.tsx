'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatNaira, calculateEscrowFee } from '@/lib/formatters';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Landmark,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  ShieldAlert,
  Smartphone,
  Calculator,
  Award,
  Zap,
  Users,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

export default function HomePage() {
  const { openAuthModal } = useAuth();

  // Interactive Fee Calculator State
  const [calcAmount, setCalcAmount] = useState<string>('25000');
  const numAmount = (parseFloat(calcAmount) || 0) * 100;
  const feeKobo = calculateEscrowFee(numAmount);
  const netKobo = Math.max(0, numAmount - feeKobo);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#006B3F] selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-[#F8FAFC]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-[#006B3F] text-xs font-bold uppercase tracking-wider shadow-2xs">
              <Landmark className="w-4 h-4" /> Built Natively Around Ecobank Blaze
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Trade Safely on Social Media. <br />
              <span className="bg-gradient-to-r from-[#006B3F] via-emerald-600 to-teal-700 bg-clip-text text-transparent">
                Zero Payment Fraud.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              Blaze Escrow-Link protects Instagram sellers, WhatsApp merchants, and campus traders across Nigeria. Funds remain safely locked in an Ecobank 256-bit vault until delivery is verified.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={openAuthModal}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold text-sm transition-all shadow-xl shadow-[#006B3F]/20 flex items-center justify-center gap-2"
              >
                Start Selling with Escrow
              </button>

              <Link
                href="/pay/escrow-vintage-denim-99a2"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
              >
                Test Live Contract Demo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="pt-6 flex items-center gap-6 text-xs font-semibold text-slate-500 border-t border-slate-200/80">
              <span className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-[#006B3F]" /> CBN Compliant
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-[#006B3F]" /> Instant Wallet Payout
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-[#006B3F]" /> *329# USSD PIN
              </span>
            </div>
          </div>

          {/* Hero Right: Interactive Calculator Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
                <Calculator className="w-5 h-5 text-[#006B3F]" /> Live Escrow Calculator
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                0.75% Fee (Max ₦500)
              </span>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Enter Item Sale Price (NGN ₦)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400 font-mono font-bold">₦</span>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-4 py-3 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-[#006B3F]"
                  placeholder="25000"
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Total Buyer Deposit:</span>
                <span className="text-slate-900 font-bold">{formatNaira(numAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Escrow Vault Fee (0.75%):</span>
                <span className="text-slate-700">{formatNaira(feeKobo)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-[#006B3F] font-extrabold text-sm">
                <span>Net Seller Payout:</span>
                <span>{formatNaira(netKobo)}</span>
              </div>
            </div>

            <button
              onClick={openAuthModal}
              className="w-full py-3.5 rounded-2xl bg-[#006B3F] hover:bg-[#005432] text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Generate This Escrow Link Now <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Problem vs Solution Comparison */}
      <section className="py-16 bg-white border-y border-slate-200 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Why Social Commerce Needs Escrow
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Nigeria loses billions annually to social commerce scams on Instagram and WhatsApp. Here is how Blaze Escrow fixes it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Direct Bank Transfer Risks */}
            <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" /> Traditional Direct Bank Transfer (High Risk)
              </div>

              <ul className="space-y-3 text-xs text-rose-900/80 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">✕</span> Buyer pays upfront before receiving or inspecting the product.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">✕</span> Dishonest sellers block buyers post-payment without shipping.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">✕</span> Honest sellers face trust issues and lost sales from skeptical buyers.
                </li>
              </ul>
            </div>

            {/* Blaze Escrow Protection */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 font-bold text-[#006B3F] text-sm">
                <ShieldCheck className="w-5 h-5 text-[#006B3F]" /> Ecobank Blaze Escrow Protection (100% Safe)
              </div>

              <ul className="space-y-3 text-xs text-emerald-900/90 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-[#006B3F] font-bold">✓</span> Buyer funds locked in Ecobank 256-bit vault during transit.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#006B3F] font-bold">✓</span> Delivery confirmed via courier tracking code or offline *329# USSD PIN.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#006B3F] font-bold">✓</span> Automatic instant payout to seller's wallet upon delivery.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Visual Step Section */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#006B3F] uppercase tracking-wider">Simple 4-Step Process</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How Blaze Escrow Protects Your Deals
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3 relative">
              <div className="w-10 h-10 rounded-2xl bg-[#006B3F] text-white flex items-center justify-center font-mono font-extrabold text-base shadow-xs">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Generate Link</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seller inputs sale item title, amount, and logistics choice on the Blaze Merchant dashboard.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3 relative">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-mono font-extrabold text-base shadow-xs">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Lock Payment</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Buyer pays via wallet, virtual bank transfer, or card. Funds lock in Ecobank vault.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3 relative">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-mono font-extrabold text-base shadow-xs">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Ship & Handshake</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seller dispatches package. USSD PIN (*329*PIN#) or courier tracking is issued.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3 relative">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-mono font-extrabold text-base shadow-xs">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base">Release Payout</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Buyer confirms delivery. Funds instantly release to seller's Ecobank Blaze account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Score & Credit Line Tier Section */}
      <section className="py-16 bg-white border-y border-slate-200 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#006B3F] uppercase tracking-wider">Reputation & Financial Inclusion</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Earn Higher Credit Limits with Every Successful Trade
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              Every completed escrow deal increases your Trust Score, unlocking up to ₦350,000 in Ecobank Blaze working capital credit lines.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="p-4 rounded-tl-2xl">Trust Tier</th>
                  <th className="p-4">Trust Score Range</th>
                  <th className="p-4">Ecobank Credit Line</th>
                  <th className="p-4 rounded-tr-2xl">Required Milestones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="p-4 font-bold text-slate-900">Bronze</td>
                  <td className="p-4 font-mono">0 – 39 Points</td>
                  <td className="p-4 font-mono font-bold text-slate-500">₦0</td>
                  <td className="p-4 text-slate-600">Unverified account</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">Silver</td>
                  <td className="p-4 font-mono">40 – 59 Points</td>
                  <td className="p-4 font-mono font-bold text-[#006B3F]">₦50,000</td>
                  <td className="p-4 text-slate-600">Phone verified + initial trade</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-amber-700">Gold</td>
                  <td className="p-4 font-mono">60 – 79 Points</td>
                  <td className="p-4 font-mono font-bold text-[#006B3F]">₦150,000</td>
                  <td className="p-4 text-slate-600">Linked Ecobank account + 5 completed deals</td>
                </tr>
                <tr className="bg-purple-50/40">
                  <td className="p-4 font-bold text-purple-700">Platinum</td>
                  <td className="p-4 font-mono">80 – 100 Points</td>
                  <td className="p-4 font-mono font-bold text-[#006B3F]">₦350,000</td>
                  <td className="p-4 text-slate-600">15+ dispute-free escrow trades</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#006B3F] to-[#005432] rounded-3xl p-10 shadow-2xl text-center space-y-6 text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Protect Your Social Commerce Deals?
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Join thousands of Nigerian campus sellers and social media buyers using Ecobank Blaze Escrow-Link.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={openAuthModal}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-[#006B3F] font-extrabold text-sm transition-all shadow-xl"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
