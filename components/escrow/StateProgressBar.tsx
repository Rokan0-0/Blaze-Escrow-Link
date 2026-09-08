import React from 'react';
import { Check, ShieldAlert, Clock, ArrowRight } from 'lucide-react';
import { getStateBadgeStyle } from '@/lib/formatters';

interface StateProgressBarProps {
  state: 'CREATED' | 'PAID' | 'DISPATCHED' | 'CONFIRMED' | 'DISPUTED' | 'RELEASED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED';
}

const STEPS = [
  { key: 'CREATED', label: 'Link Created' },
  { key: 'PAID', label: 'Payment Locked' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'RELEASED', label: 'Funds Released' },
];

export function StateProgressBar({ state }: StateProgressBarProps) {
  const badgeStyle = getStateBadgeStyle(state);

  if (state === 'DISPUTED') {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between text-rose-300">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-white">Dispute Active</h4>
            <p className="text-xs text-rose-300/80">Funds frozen in Escrow vault pending Ecobank review.</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 font-mono text-xs font-semibold border border-rose-500/30 uppercase">
          FROZEN
        </span>
      </div>
    );
  }

  if (state === 'REFUNDED' || state === 'CANCELLED' || state === 'EXPIRED') {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-between text-zinc-300">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-white">Order {state}</h4>
            <p className="text-xs text-zinc-400">Transaction closed. No funds held in escrow vault.</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded font-mono text-xs font-semibold uppercase border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
          {state}
        </span>
      </div>
    );
  }

  // Get index of active step
  const getActiveIndex = () => {
    switch (state) {
      case 'CREATED':
        return 0;
      case 'PAID':
        return 1;
      case 'DISPATCHED':
        return 2;
      case 'CONFIRMED':
      case 'RELEASED':
        return 3;
      default:
        return 0;
    }
  };

  const activeIdx = getActiveIndex();

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Escrow Status Flow</span>
        <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wide border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
          {state}
        </span>
      </div>

      <div className="relative flex items-center justify-between w-full">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-[#2A2A2A] -z-0" />
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 bg-[#006B3F] transition-all duration-500 -z-0"
          style={{ width: `${(activeIdx / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  isDone
                    ? 'bg-[#006B3F] text-white border border-[#00874E]'
                    : isCurrent
                    ? 'bg-[#006B3F] text-white ring-4 ring-[#006B3F]/30 border border-[#00874E]'
                    : 'bg-[#1A1A1A] text-zinc-500 border border-[#2A2A2A]'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span className={`text-[11px] font-medium text-center ${isCurrent ? 'text-white font-semibold' : isDone ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
