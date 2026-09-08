'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { DemoSwitcher } from '@/components/layout/DemoSwitcher';
import { Footer } from '@/components/layout/Footer';
import { HelpCircle } from 'lucide-react';

export default function FaqPage() {
  const faqs = [
    {
      q: 'What is the escrow fee rate?',
      a: 'Blaze Escrow charges a flat 0.75% micro-fee per transaction, capped at a maximum of ₦500. There are zero hidden monthly subscriptions.',
    },
    {
      q: 'What happens if a buyer receives a defective or wrong item?',
      a: 'The buyer can click "Raise Dispute" before confirming delivery. Funds remain frozen in the Ecobank vault, and Ecobank Compliance reviews uploaded photos/video evidence to issue a full refund or seller payout.',
    },
    {
      q: 'How does offline USSD handshake work?',
      a: 'For campus trades without mobile data, sellers and buyers dial *329*USSD_PIN# to execute an offline delivery handshake directly through Ecobank USSD infrastructure.',
    },
    {
      q: 'How long does a seller have to wait for funds after delivery?',
      a: 'Payout is instant upon buyer confirmation. If a buyer does not confirm or raise a dispute within 48 hours of recorded logistics delivery, funds auto-release to the seller.',
    },
    {
      q: 'How is Trust Score calculated?',
      a: 'Trust Score ranges from 0 to 100 based on completed trades (+3), phone verification (+10), Ecobank account link (+15), and dispute resolution history. Higher trust tiers unlock up to ₦350,000 in Ecobank Blaze credit lines.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <DemoSwitcher />
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            <HelpCircle className="w-7 h-7 text-emerald-400" /> Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">Everything you need to know about Ecobank Blaze Escrow protection.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((f, idx) => (
            <div key={idx} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 shadow-xl space-y-2">
              <h3 className="font-bold text-white text-sm">{f.q}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
