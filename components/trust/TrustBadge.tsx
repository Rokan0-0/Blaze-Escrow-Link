import React from 'react';
import { ShieldCheck, Award, TrendingUp } from 'lucide-react';
import { formatNaira } from '@/lib/formatters';

interface TrustBadgeProps {
  score: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  creditLimitKobo?: number;
  compact?: boolean;
}

export function TrustBadge({ score, tier, creditLimitKobo, compact = false }: TrustBadgeProps) {
  const getTierColor = () => {
    switch (tier) {
      case 'Platinum':
        return { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' };
      case 'Gold':
        return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'Silver':
        return { text: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' };
      default:
        return { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
    }
  };

  const style = getTierColor();

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text} border ${style.border} shadow-2xs`}>
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>{tier} Trust</span>
        <span className="font-mono text-[11px] opacity-80">({score})</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${style.bg} ${style.text} border ${style.border}`}>
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm">{tier} Trust Tier</h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}>
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Ecobank Blaze Escrow Engine</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{score}<span className="text-xs font-normal text-slate-400">/100</span></div>
          <span className="text-[11px] text-emerald-700 flex items-center justify-end gap-1 font-bold">
            <TrendingUp className="w-3 h-3" />
            {/* BUG-032: Dynamic label per tier */}
            {tier === 'Platinum' ? 'Elite Merchant' : tier === 'Gold' ? 'High Integrity' : tier === 'Silver' ? 'Trusted Seller' : 'Building Trust'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
        <div
          className="bg-gradient-to-r from-emerald-600 via-amber-500 to-purple-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      {creditLimitKobo !== undefined && (
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          <span className="text-slate-500 font-medium">Blaze Credit Line:</span>
          <span className="font-mono font-bold text-[#006B3F]">
            {formatNaira(creditLimitKobo)}
          </span>
        </div>
      )}
    </div>
  );
}
