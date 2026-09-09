'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#006B3F]" /> Escrow Protection Terms & Conditions
          </h1>
          <p className="text-xs text-slate-500 font-medium">Version 1.0 • Ecobank Nigeria InnovateX 2026</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs text-slate-600 leading-relaxed font-medium">
          <h3 className="font-extrabold text-slate-900 text-sm">1. Scope of Escrow Vault</h3>
          <p>
            Blaze Escrow-Link provides micro-escrow holding services for P2P transactions initiated on Instagram, WhatsApp, and campus commerce channels. Funds held in the escrow vault are licensed under Ecobank Nigeria financial regulations.
          </p>

          <h3 className="font-extrabold text-slate-900 text-sm">2. Escrow Fee Schedule</h3>
          <p>
            A fee of 0.75% of the transaction amount (capped at NGN 500 max) is automatically deducted upon successful completion or release of escrow funds.
          </p>

          <h3 className="font-extrabold text-slate-900 text-sm">3. Dispute Arbitration & Auto-Release</h3>
          <p>
            Buyers have 48 hours post-delivery dispatch to inspect items and confirm satisfaction or raise a dispute. If no action or dispute is registered within 48 hours, funds automatically release to the seller.
          </p>

          <h3 className="font-extrabold text-slate-900 text-sm">4. Prohibited Items</h3>
          <p>
            Transactions involving illegal substances, counterfeit currency, weapons, or unauthorized financial instruments are strictly prohibited and subject to immediate account freeze and law enforcement referral.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
