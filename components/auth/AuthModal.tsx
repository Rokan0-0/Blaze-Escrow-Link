'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { X, Phone, KeyRound, ArrowRight, CheckCircle2, ShieldCheck, User, Store, ShoppingBag } from 'lucide-react';

export function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, closeAuthModal, verifyOtp } = useAuth();
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_UP');
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');

  const [phone, setPhone] = useState('+2348000000001');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'seller' | 'buyer' | 'both'>('seller');
  const [ecobankAccount, setEcobankAccount] = useState('');
  const [otp, setOtp] = useState('000000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'SIGN_UP' && !fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    setError('');
    setStep('OTP');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const nameToUse = authMode === 'SIGN_UP' ? fullName : (phone.includes('0001') ? 'Amina Bello' : 'Tunde Bakare');
      const res = await verifyOtp(phone, otp, nameToUse, role);
      if (res.success) {
        // Redirect directly to Dashboard (or Orders for buyers)
        if (role === 'buyer') {
          router.push('/orders');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(res.error || 'Verification failed');
      }
    } catch (err: any) {
      setError('Verification failed. Try code 000000.');
    } finally {
      setLoading(false);
    }
  };

  const resetModalState = () => {
    setStep('DETAILS');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 glass-modal flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Branded Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-[#006B3F] text-white flex items-center justify-center font-bold text-xl shadow-md border border-[#005432]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {step === 'OTP'
              ? 'Verify Mobile OTP'
              : authMode === 'SIGN_IN'
              ? 'Welcome Back'
              : 'Create Your Account'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {step === 'OTP'
              ? `Verification code sent to ${phone}`
              : 'Ecobank Blaze P2P Social Commerce Protection'}
          </p>
        </div>

        {/* Step 1: DETAILS */}
        {step === 'DETAILS' && (
          <div className="space-y-4">
            {/* Mode Switcher Tabs: Sign In vs Sign Up */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('SIGN_UP');
                  resetModalState();
                }}
                className={`py-2 rounded-xl transition-all ${
                  authMode === 'SIGN_UP'
                    ? 'bg-white text-[#006B3F] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Get Started (Sign Up)
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('SIGN_IN');
                  resetModalState();
                }}
                className={`py-2 rounded-xl transition-all ${
                  authMode === 'SIGN_IN'
                    ? 'bg-white text-[#006B3F] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-3.5 text-xs">
              {/* SIGN UP specific fields */}
              {authMode === 'SIGN_UP' && (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Amina Bello"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#006B3F] font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Account Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('seller')}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          role === 'seller'
                            ? 'bg-emerald-50 border-[#006B3F] text-[#006B3F] font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <Store className="w-4 h-4 text-[#006B3F]" />
                        <div>
                          <div className="text-xs">Merchant / Seller</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('buyer')}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          role === 'buyer'
                            ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="text-xs">Buyer / Customer</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Shared Phone Field */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Mobile Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+2348000000001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-[#006B3F] font-bold"
                  />
                </div>
              </div>

              {/* Optional Ecobank Account in Sign Up */}
              {authMode === 'SIGN_UP' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Ecobank Account Number <span className="text-slate-400 font-normal">(Optional for +15 Trust Points)</span>
                  </label>
                  <input
                    type="text"
                    value={ecobankAccount}
                    onChange={(e) => setEcobankAccount(e.target.value)}
                    placeholder="e.g. 3290192841"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-[#006B3F] font-medium"
                  />
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {authMode === 'SIGN_UP' ? 'Create Account & Send Code' : 'Send Verification SMS'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Step 2: OTP */}
        {step === 'OTP' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-600 text-xs text-center font-medium">
              Enter 6-digit SMS verification code sent to <span className="font-mono font-bold text-slate-900">{phone}</span>.
              <div className="mt-1 text-[11px] text-emerald-700 font-bold">
                (Demo Code: <span className="font-mono bg-emerald-100 px-1 py-0.5 rounded">000000</span>)
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-center">Enter 6-Digit OTP Code</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-center text-xl font-mono tracking-widest text-slate-900 focus:outline-none focus:border-[#006B3F] font-bold"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Verifying Session...' : 'Confirm & Complete Registration'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
