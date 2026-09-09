'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Logo } from '@/components/layout/Logo';
import { KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams?.get('phone') || '+2348000000001';
  const fullName = searchParams?.get('fullName') || 'Amina Bello';
  const role = (searchParams?.get('role') as any) || 'seller';
  const redirectUrl = searchParams?.get('redirect') || '/dashboard';

  const { verifyOtp } = useAuth();
  const [otp, setOtp] = useState('000000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await verifyOtp(phone, otp, fullName, role);
      if (res.success) {
        router.push(redirectUrl);
      } else {
        setError(res.error || 'Invalid OTP');
      }
    } catch (err: any) {
      setError('Verification failed. Try code 000000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl py-8 px-6 shadow-2xl space-y-6">
      {/* OTP Bypass Info Box */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs flex items-start gap-2 text-emerald-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white uppercase tracking-wider block">Demo Instant Bypass Active</span>
          Use OTP code <span className="font-mono font-bold text-white bg-emerald-500/30 px-1.5 py-0.5 rounded">000000</span> for instant judging login access.
        </div>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 text-center">
            6-Digit Security Code
          </label>
          <div className="relative">
            <KeyRound className="w-5 h-5 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-12 pr-4 py-3 text-center text-xl font-mono tracking-widest text-white placeholder-zinc-600 focus:outline-none focus:border-[#006B3F] transition-all font-bold"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#006B3F] hover:bg-[#00874E] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify & Enter Dashboard'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setOtp('000000')}
          className="text-xs text-zinc-400 hover:text-white underline transition-colors"
        >
          Autofill demo OTP (000000)
        </button>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Logo className="h-10 mb-4" />
        <h2 className="text-center text-xl font-bold tracking-tight text-white">
          Enter SMS Verification Code
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="text-zinc-500 text-xs text-center p-4">Loading verification form...</div>}>
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  );
}
