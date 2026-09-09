'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, Lock, ShieldCheck, Truck, Landmark, Smartphone, CheckCircle2 } from 'lucide-react';

export default function HowItWorksPage() {
  const { openAuthModal } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-[#006B3F] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">How Blaze Escrow Works</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed font-medium">
            A step-by-step breakdown of how Ecobank Blaze safeguards social commerce sellers and buyers in Nigeria.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl p-6 shadow-sm transition-all flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#006B3F] text-white flex items-center justify-center font-extrabold font-mono text-base shrink-0 shadow-sm">
              1
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                Seller Generates Escrow Link
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Dashboard
                </span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                The merchant enters sale item details, sale amount, and preferred courier service on their Blaze Merchant Dashboard. A unique escrow link (e.g. <span className="font-mono text-[#006B3F] font-bold">#escrow-vintage-denim-99a2</span>) is generated instantly with embedded 0.75% fee logic.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl p-6 shadow-sm transition-all flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold font-mono text-base shrink-0 shadow-sm">
              2
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                Buyer Pays into Ecobank Escrow Vault
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Vault Lock
                </span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                The buyer opens the link from Instagram or WhatsApp and pays via Blaze Wallet, Virtual Bank Transfer, or Debit Card. Funds lock securely in Ecobank’s 256-bit vault. Both parties receive instant notification.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl p-6 shadow-sm transition-all flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-extrabold font-mono text-base shrink-0 shadow-sm">
              3
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                Item Dispatch & Offline USSD Handshake
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Logistics & *329#
                </span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                The seller dispatches the package via GIG, Kwik, Sendbox, or Campus Direct. For campus handshakes without mobile data, an offline USSD PIN (*329*PIN#) is issued for instant physical verification.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl p-6 shadow-sm transition-all flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-extrabold font-mono text-base shrink-0 shadow-sm">
              4
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                Delivery Confirmation & Fund Payout
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  Instant Payout
                </span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                The buyer verifies the item condition and clicks "Confirm Delivery". Funds release instantly to the seller's wallet and can be paid out directly to their linked Ecobank Blaze bank account.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2 text-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#006B3F] flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Ecobank Vault Safety</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">Funds held under CBN regulation until inspection.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2 text-center">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
              <Smartphone className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">*329# USSD Handshake</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">Works offline for campus & face-to-face meetups.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2 text-center">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <Landmark className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Trust Score Building</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">Earn up to ₦350,000 credit line as trust grows.</p>
          </div>
        </div>

        <div className="text-center pt-4">
          <button
            onClick={openAuthModal}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#006B3F] hover:bg-[#005432] text-white font-extrabold text-xs transition-all shadow-lg"
          >
            Create Your First Escrow Link <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
