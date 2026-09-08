'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Logo } from '@/components/layout/Logo';
import { ShieldCheck, Phone, ArrowRight, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || '/dashboard';
  const { loginWithPhone, switchDemoUser } = useAuth();

  const [phone, setPhone] = useState('+2348000000001');
  const [fullName, setFullName] = useState('Amina Bello');
  const [role, setRole] = useState<'seller' | 'buyer' | 'both'>('seller');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginWithPhone(phone);
      if (res.success) {
        // Redirect to OTP verify page with parameters
        const query = new URLSearchParams({
          phone,
          fullName,
          role,
          redirect: redirectUrl,
        }).toString();
        router.push(`/verify?${query}`);
      }
    } catch (err: any) {
      setError('Failed to initiate SMS OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Logo className="h-10 mb-4" />
        <h2 className="text-center text-xl font-bold tracking-tight text-white">
          Sign in to Blaze Escrow
        </h2>
        <p className="mt-1 text-center text-xs text-zinc-400">
          P2P Social Commerce Protection Engine for Nigeria
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl py-8 px-6 shadow-2xl space-y-6">
          {/* Judging Quick Switch Banner */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> Judge Instant Demo Accounts
            </div>
            <p className="text-zinc-300 text-[11px]">
              Click any profile to prepopulate phone credentials:
            </p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setPhone('+2348000000001');
                  setFullName('Amina Bello');
                  setRole('seller');
                }}
                className="p-2 rounded bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] text-left text-[11px]"
              >
                <div className="font-semibold text-white">Amina Bello</div>
                <div className="text-zinc-400">Seller (Unilag)</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhone('+2348000000002');
                  setFullName('Tunde Bakare');
                  setRole('buyer');
                }}
                className="p-2 rounded bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] text-left text-[11px]"
              >
                <div className="font-semibold text-white">Tunde Bakare</div>
                <div className="text-zinc-400">Buyer (Unilag)</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Amina Bello"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#006B3F] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Phone Number (Nigerian Format)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+2348000000001"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#006B3F] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Primary Account Profile
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#006B3F] transition-all"
              >
                <option value="seller">Social Commerce Seller</option>
                <option value="buyer">Campus / Social Buyer</option>
                <option value="both">Both (Buy & Sell)</option>
              </select>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Sending Verification SMS...' : 'Continue with Phone'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-zinc-500">
            By continuing, you agree to Ecobank Blaze Escrow Protection Terms.
          </div>
        </div>
      </div>
    </div>
  );
}
