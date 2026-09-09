'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '../mock/types';
import { MOCK_SELLER, MOCK_BUYER, MOCK_ADMIN, mockStore } from '../mock/store';
import { formatPhone } from '../formatters';

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithPhone: (phone: string) => Promise<{ success: boolean; requiresOtp: boolean }>;
  verifyOtp: (phone: string, otp: string, fullName?: string, role?: Profile['role']) => Promise<{ success: boolean; user?: Profile; error?: string }>;
  switchDemoUser: (role: 'seller' | 'buyer' | 'admin') => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function initUser() {
      if (typeof window !== 'undefined') {
        const savedId = localStorage.getItem('blaze_active_user_id');
        if (savedId) {
          try {
            const res = await fetch(`/api/profile?user_id=${encodeURIComponent(savedId)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.profile) {
                setUser(data.profile);
                mockStore.saveProfile(data.profile);
                setIsLoading(false);
                return;
              }
            }
          } catch {}

          const profile = mockStore.getProfileById(savedId);
          if (profile) {
            setUser(profile);
          } else {
            localStorage.removeItem('blaze_active_user_id');
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    }
    initUser();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/profile?user_id=${encodeURIComponent(user.id)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.profile) {
        const serverProfile = data.profile;
        setUser((prev) => {
          if (!prev) return prev;
          mockStore.saveProfile(serverProfile);
          return { ...prev, ...serverProfile };
        });
      }
    } catch {
      const updated = mockStore.getProfileById(user.id);
      if (updated) {
        setUser((prev) => (prev ? { ...updated } : prev));
      }
    }
  };

  const loginWithPhone = async (phone: string) => {
    return { success: true, requiresOtp: true };
  };

  const verifyOtp = async (
    phone: string,
    otp: string,
    fullName?: string,
    role: Profile['role'] = 'both'
  ) => {
    const formatted = formatPhone(phone);

    if (otp !== '000000') {
      return { success: false, error: 'Invalid OTP. Use 000000 for instant demo access.' };
    }

    let targetUser: Profile | null = null;

    if (formatted === MOCK_SELLER.phone) targetUser = MOCK_SELLER;
    else if (formatted === MOCK_BUYER.phone) targetUser = MOCK_BUYER;
    else if (formatted === MOCK_ADMIN.phone) targetUser = MOCK_ADMIN;

    if (!targetUser) {
      targetUser = mockStore.getProfileByPhone(formatted) || null;
    }

    if (!targetUser) {
      targetUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        phone: formatted,
        full_name: fullName || 'Blaze User',
        role: role,
        trust_score: 50,
        trust_tier: 'Silver',
        completed_trades: 0,
        disputed_trades: 0,
        total_volume: 0,
        ecobank_linked: false,
        credit_limit: 5000000,
        simulated_balance: 5000000,
        created_at: new Date().toISOString(),
      };
    }

    // Persist profile to Supabase Postgres (will preserve live fields if user exists)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: targetUser }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) targetUser = data.profile;
      }
    } catch {}

    mockStore.saveProfile(targetUser);
    setUser(targetUser);

    if (typeof window !== 'undefined') {
      localStorage.setItem('blaze_active_user_id', targetUser.id);
    }

    closeAuthModal();
    return { success: true, user: targetUser };
  };

  const switchDemoUser = async (role: 'seller' | 'buyer' | 'admin') => {
    let target = MOCK_SELLER;
    if (role === 'buyer') target = MOCK_BUYER;
    if (role === 'admin') target = MOCK_ADMIN;

    if (typeof window !== 'undefined') {
      localStorage.setItem('blaze_active_user_id', target.id);
    }

    try {
      const res = await fetch(`/api/profile?user_id=${encodeURIComponent(target.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setUser(data.profile);
          mockStore.saveProfile(data.profile);
          return;
        }
      }
    } catch {}

    setUser(target);
    mockStore.saveProfile(target);
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: target }),
    }).catch(() => {});
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('blaze_active_user_id');
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        loginWithPhone,
        verifyOtp,
        switchDemoUser,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
