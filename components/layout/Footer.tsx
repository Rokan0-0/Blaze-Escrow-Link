import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { Lock, Landmark } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 flex flex-col gap-3">
            <Logo />
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed mt-1">
              Blaze Escrow-Link is a micro-escrow engine built natively around the Ecobank Blaze account. Safeguarding P2P social commerce transactions across Nigeria.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1.5 text-[#006B3F] font-bold">
                <Landmark className="w-3.5 h-3.5" /> Ecobank Nigeria Native
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Lock className="w-3.5 h-3.5 text-blue-600" /> 256-Bit Vault Lock
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Product & Features</h4>
            <Link href="/how-it-works" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
              How Escrow Works
            </Link>
            <Link href="/pay/escrow-vintage-denim-99a2" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
              Live Contract Payment Link
            </Link>
            <Link href="/dashboard" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
              Merchant Generator
            </Link>
            <Link href="/admin" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
              Compliance Dispute Hub
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Legal & Trust</h4>
            <Link href="/terms" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
              Escrow Protection Terms
            </Link>
            <Link href="/faq" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
              Frequently Asked Questions
            </Link>
            <span className="text-xs text-slate-500">Hackathon Track A — Inclusive Finance</span>
            <span className="text-xs text-slate-500 font-mono">Ecobank InnovateX 2026</span>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 Ecobank Blaze Escrow-Link. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono text-slate-500">Built with Next.js 14 + Supabase + Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
