'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HelpCircle, ChevronDown, ShieldCheck, PhoneCall, Landmark } from 'lucide-react';
import Link from 'next/link';

export default function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is the escrow fee rate?',
      a: 'Blaze Escrow charges a flat 0.75% micro-fee per transaction, capped at a maximum of ₦500. There are zero hidden monthly subscriptions or maintenance charges.',
    },
    {
      q: 'What happens if a buyer receives a defective or wrong item?',
      a: 'The buyer can click "Raise Dispute" before confirming delivery. Funds remain frozen in the Ecobank vault, and Ecobank Compliance reviews uploaded photos/video evidence to issue a full refund or seller payout within 24 hours.',
    },
    {
      q: 'How does offline USSD handshake work?',
      a: 'For campus trades without mobile internet, sellers and buyers dial *329*USSD_PIN# on any phone to execute an offline delivery handshake directly through Ecobank USSD infrastructure.',
    },
    {
      q: 'How long does a seller have to wait for funds after delivery?',
      a: 'Payout is instant upon buyer confirmation. If a buyer does not confirm or raise a dispute within 48 hours of recorded logistics delivery, funds auto-release to the seller.',
    },
    {
      q: 'How is Trust Score calculated?',
      a: 'Trust Score ranges from 0 to 100 based on completed trades (+3), phone verification (+10), Ecobank account link (+15), and dispute resolution history. Higher trust tiers unlock up to ₦350,000 in Ecobank Blaze working capital credit lines.',
    },
    {
      q: 'Can non-Ecobank account holders use Blaze Escrow-Link?',
      a: 'Yes! Anyone with a Nigerian bank account or mobile wallet can pay into the escrow link via virtual bank transfer, USSD, or debit card. Ecobank customers enjoy instant fee-free withdrawals.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-[#006B3F] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-[#006B3F] text-xs font-extrabold uppercase tracking-wider shadow-2xs">
            <HelpCircle className="w-4 h-4" /> Got Questions? We've Got Answers
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto font-medium leading-relaxed">
            Everything you need to know about Ecobank Blaze Escrow protection for Nigerian social commerce.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`bg-white border rounded-2xl transition-all overflow-hidden ${
                  isOpen
                    ? 'border-emerald-300 shadow-md ring-1 ring-emerald-400/20'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base focus:outline-none"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-extrabold shrink-0 ${
                        isOpen ? 'bg-[#006B3F] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      ?
                    </span>
                    {f.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#006B3F]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 font-medium bg-slate-50/50">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact/Support Card */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center justify-center sm:justify-start gap-2">
              <Landmark className="w-4 h-4 text-[#006B3F]" /> Still have questions?
            </h3>
            <p className="text-xs text-slate-600 font-medium">Our Ecobank Blaze compliance team is available 24/7.</p>
          </div>
          <Link
            href="/pay/%23escrow-vintage-denim-99a2"
            className="px-5 py-2.5 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white font-extrabold text-xs transition-all shadow-md shrink-0"
          >
            Test Demo Contract
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
