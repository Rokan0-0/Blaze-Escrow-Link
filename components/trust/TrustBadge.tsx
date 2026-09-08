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
        return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
      case 'Gold':
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
      case 'Silver':
        return { text: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
      default:
        return { text: 'text-amber-600', bg: 'bg-amber-800/10', border: 'border-amber-700/20' };
    }
  };

  const style = getTierColor();

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>{tier} Trust</span>
        <span className="font-mono text-[11px] opacity-80">({score})</span>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${style.bg} ${style.text} border ${style.border}`}>
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white text-sm">{tier} Trust Tier</h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}>
                Verified
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Ecobank Blaze Escrow Engine</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-extrabold text-white font-mono">{score}<span className="text-xs font-normal text-zinc-500">/100</span></div>
          <span className="text-[11px] text-emerald-400 flex items-center justify-end gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> High Integrity
          </span>
        </div>
      </div>

      {/* Trust Meter Progress Bar */}
      <div className="w-full bg-[#1A1A1A] rounded-full h-2 overflow-hidden border border-[#2A2A2A]">
        <div
          className="bg-gradient-to-r from-emerald-600 via-amber-500 to-purple-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      {creditLimitKobo !== undefined && (
        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1A1A1A]">
          <span className="text-zinc-400">Blaze Credit Line:</span>
          <span className="font-mono font-semibold text-emerald-400">
            {formatNaira(creditLimitKobo)}
          </span>
        </div>
      )}
    </div>
  );
}
