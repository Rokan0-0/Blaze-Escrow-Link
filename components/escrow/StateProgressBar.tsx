import React from 'react';
import { Check, ShieldAlert, Clock } from 'lucide-react';

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
  if (state === 'DISPUTED') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-rose-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Dispute Active</h4>
            <p className="text-xs text-rose-700">Funds frozen in Escrow vault pending Ecobank review.</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-mono text-xs font-bold border border-rose-200 uppercase">
          FROZEN
        </span>
      </div>
    );
  }

  if (state === 'REFUNDED' || state === 'CANCELLED' || state === 'EXPIRED') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Order {state}</h4>
            <p className="text-xs text-slate-500">Transaction closed. No funds held in escrow vault.</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200 uppercase">
          {state}
        </span>
      </div>
    );
  }

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
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Escrow Status Flow</span>
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-200">
          {state}
        </span>
      </div>

      <div className="relative flex items-center justify-between w-full px-2">
        {/* Line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-100 -z-0 rounded-full" />
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-[#006B3F] transition-all duration-500 -z-0 rounded-full"
          style={{ width: `${(activeIdx / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all shadow-xs ${
                  isDone
                    ? 'bg-[#006B3F] text-white border-2 border-[#006B3F]'
                    : isCurrent
                    ? 'bg-[#006B3F] text-white ring-4 ring-[#006B3F]/20 border-2 border-[#005432]'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`text-xs ${isCurrent ? 'text-slate-900 font-extrabold' : isDone ? 'text-slate-700 font-medium' : 'text-slate-400 font-medium'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
