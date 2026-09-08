import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center text-center px-4">
      <div className="space-y-4 max-w-md">
        <Logo className="h-10 mx-auto justify-center" />
        <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Escrow Contract Not Found</h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The requested payment link code may have expired, been cancelled by the merchant, or contains a typo.
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold text-xs transition-all shadow-lg flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
