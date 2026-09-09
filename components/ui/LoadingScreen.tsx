'use client';

import React from 'react';
import { ShieldCheck, Lock, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  subtext?: string;
}

export function LoadingScreen({
  message = 'Loading Escrow Contract...',
  subtext = 'Connecting securely to Blaze Escrow Vault',
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950/20 backdrop-blur-xl transition-all duration-300">
      {/* Background glowing ambient light blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="w-[320px] h-[320px] bg-[#006B3F]/20 rounded-full blur-[100px] animate-pulse" />
        <div className="w-[240px] h-[240px] bg-[#D4AF37]/15 rounded-full blur-[80px] animate-pulse delay-500" />
      </div>

      {/* Glassmorphic card */}
      <div className="relative z-10 mx-4 max-w-sm w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-slate-800/80 rounded-3xl p-8 text-center shadow-2xl shadow-emerald-950/10 space-y-5 animate-in fade-in zoom-in-95 duration-300">
        {/* Animated Icon Ring */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#006B3F] border-r-[#006B3F]/40 animate-spin" />
          
          {/* Middle counter-rotating ring */}
          <div className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-[#D4AF37] border-l-[#D4AF37]/40 animate-[spin_2s_linear_infinite_reverse]" />

          {/* Center glowing icon pill */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#006B3F] to-[#008f54] text-white flex items-center justify-center shadow-lg shadow-emerald-700/30 animate-pulse">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {message}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {subtext}
          </p>
        </div>

        {/* Status Indicator Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 text-[10px] font-semibold text-[#006B3F] dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#006B3F] animate-ping" />
          <span>256-Bit Encrypted Link</span>
        </div>
      </div>
    </div>
  );
}
