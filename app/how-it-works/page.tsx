'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { DemoSwitcher } from '@/components/layout/DemoSwitcher';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, Lock, ShieldCheck, Truck, Landmark, Smartphone } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <DemoSwitcher />
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">How Blaze Escrow-Link Works</h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            A step-by-step breakdown of how Ecobank Blaze protects both buyer and seller in social commerce transactions.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#006B3F] text-white flex items-center justify-center font-extrabold font-mono text-base shrink-0">
              1
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">Seller Generates Payment Link</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The merchant inputs the item title, price in Naira, category, and preferred logistics option on their Blaze Merchant Dashboard. A unique escrow link (e.g. #escrow-vintage-denim-99a2) is generated instantly.
              </p>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold font-mono text-base shrink-0">
              2
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">Buyer Pays into Ecobank Escrow Vault</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The buyer opens the link on WhatsApp or Instagram and pays via Blaze Wallet, Virtual Bank Transfer, or Debit Card. Funds are locked securely in Ecobank’s 256-bit vault. The seller receives notification that funds are held.
              </p>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-extrabold font-mono text-base shrink-0">
              3
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">Item Dispatch & Handshake PIN</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The seller dispatches the item via GIG, Kwik, Sendbox, or Campus Direct. For campus handshakes, an offline USSD PIN (*329*PIN#) is issued to verify physical delivery on campus without internet.
              </p>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-extrabold font-mono text-base shrink-0">
              4
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">Delivery Confirmation & Fund Payout</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The buyer verifies the item condition and clicks "Confirm Delivery". Funds are instantly released to the seller's wallet and credited to their linked Ecobank Blaze bank account.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold text-xs transition-all shadow-lg"
          >
            Create Your First Escrow Link <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
