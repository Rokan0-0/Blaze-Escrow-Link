import React from 'react';

export function Logo({ className = 'h-8' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Ecobank Shield Vector Icon */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#006B3F] text-white font-bold text-sm shadow-md border border-[#00874E]/30">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold tracking-tight text-white text-base">BLAZE</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-[#006B3F]/20 text-[#00874E] font-semibold border border-[#006B3F]/30 uppercase tracking-wide">
            ESCROW
          </span>
        </div>
        <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase mt-0.5">
          by Ecobank
        </span>
      </div>
    </div>
  );
}
