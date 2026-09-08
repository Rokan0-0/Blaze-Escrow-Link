'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '../mock/types';
import { MOCK_SELLER, MOCK_BUYER, MOCK_ADMIN, mockStore } from '../mock/store';
import { formatPhone } from '../formatters';

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  loginWithPhone: (phone: string) => Promise<{ success: boolean; requiresOtp: boolean }>;
  verifyOtp: (phone: string, otp: string, fullName?: string, role?: Profile['role']) => Promise<{ success: boolean; user?: Profile; error?: string }>;
  switchDemoUser: (role: 'seller' | 'buyer' | 'admin') => void;
  logout: () => void;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check initial logged-in user from localStorage or default to Seller (Amina)
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('blaze_active_user_id') : null;
    if (savedUserId) {
      const p = mockStore.getProfileById(savedUserId);
      if (p) {
        setUser(p);
      } else {
        setUser(MOCK_SELLER);
      }
    } else {
      // Default to Seller Amina for demo convenience
      setUser(MOCK_SELLER);
      if (typeof window !== 'undefined') {
        localStorage.setItem('blaze_active_user_id', MOCK_SELLER.id);
      }
    }
    setIsLoading(false);
  }, []);

  const refreshProfile = () => {
    if (user) {
      const updated = mockStore.getProfileById(user.id);
      if (updated) {
        setUser({ ...updated });
      }
    }
  };

  const loginWithPhone = async (phone: string) => {
    const formatted = formatPhone(phone);
    // Instant trigger OTP
    return { success: true, requiresOtp: true };
  };

  const verifyOtp = async (
    phone: string,
    otp: string,
    fullName?: string,
    role: Profile['role'] = 'both'
  ) => {
    const formatted = formatPhone(phone);

    // Verify OTP: Must be 000000 or 6 digits
    if (otp !== '000000' && otp.length !== 6) {
      return { success: false, error: 'Invalid OTP code. Use 000000 for instant bypass.' };
    }

    let existing = mockStore.getProfileByPhone(formatted);

    if (!existing) {
      // Auto register new user
      existing = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        phone: formatted,
        full_name: fullName || 'Blaze Merchant',
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
      mockStore.saveProfile(existing);
    }

    setUser(existing);
    if (typeof window !== 'undefined') {
      localStorage.setItem('blaze_active_user_id', existing.id);
    }

    return { success: true, user: existing };
  };

  const switchDemoUser = (role: 'seller' | 'buyer' | 'admin') => {
    let target = MOCK_SELLER;
    if (role === 'buyer') target = MOCK_BUYER;
    if (role === 'admin') target = MOCK_ADMIN;

    const fresh = mockStore.getProfileById(target.id) || target;
    setUser(fresh);
    if (typeof window !== 'undefined') {
      localStorage.setItem('blaze_active_user_id', fresh.id);
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('blaze_active_user_id');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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
