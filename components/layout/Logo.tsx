import React from 'react';

export function Logo({ className = 'h-8' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Ecobank Shield Vector Icon */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-[#006B3F] text-white font-bold text-sm shadow-sm border border-[#005432] shrink-0">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold tracking-tight text-slate-900 text-base">BLAZE</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-[#006B3F] font-extrabold border border-emerald-200 uppercase tracking-wide">
            ESCROW
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-0.5">
          BY ECOBANK
        </span>
      </div>
    </div>
  );
}
