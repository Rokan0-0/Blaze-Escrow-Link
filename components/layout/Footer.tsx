import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { ShieldCheck, Lock, Landmark } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#2A2A2A] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 flex flex-col gap-3">
            <Logo />
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mt-1">
              Blaze Escrow-Link is a micro-escrow engine built natively around the Ecobank Blaze account. Safeguarding P2P social commerce transactions across Nigeria.
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-500 mt-2">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Landmark className="w-3.5 h-3.5" /> Ecobank Nigeria Native
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Lock className="w-3.5 h-3.5 text-blue-400" /> 256-Bit Vault Lock
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Product & Flow</h4>
            <Link href="/how-it-works" className="text-xs text-zinc-400 hover:text-white transition-colors">
              How Escrow Works
            </Link>
            <Link href="/pay/escrow-vintage-denim-99a2" className="text-xs text-zinc-400 hover:text-white transition-colors">
              Live Escrow Link Demo
            </Link>
            <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-white transition-colors">
              Merchant Generator
            </Link>
            <Link href="/admin" className="text-xs text-zinc-400 hover:text-white transition-colors">
              Compliance Dispute Hub
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Legal & Trust</h4>
            <Link href="/terms" className="text-xs text-zinc-400 hover:text-white transition-colors">
              Escrow Protection Terms
            </Link>
            <Link href="/faq" className="text-xs text-zinc-400 hover:text-white transition-colors">
              Frequently Asked Questions
            </Link>
            <span className="text-xs text-zinc-500">Hackathon Track A — Inclusive Finance</span>
            <span className="text-xs text-zinc-500 font-mono">Ecobank InnovateX 2026</span>
          </div>
        </div>

        <div className="pt-6 border-t border-[#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <p>© 2026 Ecobank Blaze Escrow-Link. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono text-zinc-600">Built with Next.js 14 + Supabase + Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
