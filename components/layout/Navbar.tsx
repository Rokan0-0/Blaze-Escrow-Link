'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Logo } from './Logo';
import { TrustBadge } from '../trust/TrustBadge';
import { formatNaira } from '@/lib/formatters';
import { mockStore } from '@/lib/mock/store';
import { NotificationItem } from '@/lib/mock/types';
import { playPaymentPingSound } from '@/lib/audio/soundEffects';
import {
  Bell,
  Wallet,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  LayoutDashboard,
  CheckCircle2,
  Menu,
  X,
  Users,
  ArrowUpDown,
  BarChart3,
  Landmark,
} from 'lucide-react';

export function Navbar() {
  const { user, openAuthModal, logout } = useAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prevUnreadRef = React.useRef<number>(0);

  const fetchNotifications = async (userId: string) => {
    try {
      const res = await fetch(`/api/notifications?user_id=${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.notifications) {
        setNotifications((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(data.notifications)) {
            return data.notifications;
          }
          return prev;
        });
      }
    } catch {
      const items = mockStore.getNotificationsForUser(userId);
      setNotifications((prev) =>
        JSON.stringify(prev) !== JSON.stringify(items) ? items : prev
      );
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      prevUnreadRef.current = 0;
      return;
    }
    fetchNotifications(user.id);
    const interval = setInterval(() => fetchNotifications(user.id), 3000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Sound chime ping on new incoming notification/payment
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      playPaymentPingSound();
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      notifications.forEach((n) => mockStore.markNotifAsRead(n.id));
      setNotifications(mockStore.getNotificationsForUser(user.id));
    }
  };

  const isAppPage = !!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/active-contracts') || pathname.startsWith('/orders') || pathname.startsWith('/admin') || pathname.startsWith('/pay'));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <Link
          href="/"
          className="hover:opacity-90 transition-opacity text-left focus:outline-none"
          title="Ecobank Blaze Escrow Home"
        >
          <Logo />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {user?.role === 'admin' ? (
            <>
              <Link
                href="/admin?tab=overview"
                className={`text-xs font-extrabold flex items-center gap-1.5 transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'text-purple-700'
                    : 'text-slate-600 hover:text-purple-700'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-purple-600" />
                Overview
              </Link>
              <Link
                href="/admin?tab=disputes"
                className="text-xs font-extrabold flex items-center gap-1.5 text-slate-600 hover:text-purple-700 transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                Dispute Queue
              </Link>
              <Link
                href="/admin?tab=transactions"
                className="text-xs font-extrabold flex items-center gap-1.5 text-slate-600 hover:text-purple-700 transition-colors"
              >
                <ArrowUpDown className="w-4 h-4 text-purple-600" />
                Transactions
              </Link>
              <Link
                href="/admin?tab=users"
                className="text-xs font-extrabold flex items-center gap-1.5 text-slate-600 hover:text-purple-700 transition-colors"
              >
                <Users className="w-4 h-4 text-purple-600" />
                Users
              </Link>
              <Link
                href="/admin?tab=withdrawals"
                className="text-xs font-extrabold flex items-center gap-1.5 text-slate-600 hover:text-purple-700 transition-colors"
              >
                <Landmark className="w-4 h-4 text-purple-600" />
                Withdrawals
              </Link>
            </>
          ) : isAppPage ? (
            <>
              <Link
                href="/dashboard"
                className={`text-xs font-extrabold flex items-center gap-1.5 transition-colors ${
                  pathname === '/dashboard'
                    ? 'text-[#006B3F]'
                    : 'text-slate-600 hover:text-[#006B3F]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#006B3F]" />
                Dashboard
              </Link>
              <Link
                href="/active-contracts"
                className={`text-xs font-extrabold flex items-center gap-1.5 transition-colors ${
                  pathname.startsWith('/active-contracts')
                    ? 'text-[#006B3F]'
                    : 'text-slate-600 hover:text-[#006B3F]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#006B3F]" />
                Active Contracts
              </Link>
              <Link
                href="/orders"
                className={`text-xs font-extrabold flex items-center gap-1.5 transition-colors ${
                  pathname.startsWith('/orders')
                    ? 'text-[#006B3F]'
                    : 'text-slate-600 hover:text-[#006B3F]'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-[#006B3F]" />
                My Orders
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/how-it-works"
                className={`text-xs font-extrabold transition-colors ${
                  pathname === '/how-it-works'
                    ? 'text-[#006B3F]'
                    : 'text-slate-600 hover:text-[#006B3F]'
                }`}
              >
                How It Works
              </Link>
              <Link
                href="/pay/escrow-vintage-denim-99a2"
                className={`text-xs font-extrabold transition-colors ${
                  pathname.startsWith('/pay')
                    ? 'text-[#006B3F]'
                    : 'text-slate-600 hover:text-[#006B3F]'
                }`}
              >
                Live Demo Contract
              </Link>
              <Link
                href="/faq"
                className={`text-xs font-extrabold transition-colors ${
                  pathname === '/faq'
                    ? 'text-[#006B3F]'
                    : 'text-slate-600 hover:text-[#006B3F]'
                }`}
              >
                FAQ
              </Link>
              <Link
                href="/demo"
                className={`text-xs font-extrabold transition-colors ${
                  pathname === '/demo'
                    ? 'text-purple-700'
                    : 'text-purple-600 hover:text-purple-800'
                }`}
              >
                Demo Sandbox
              </Link>
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Show Balance & Trust Badge only on internal App Pages */}
              {isAppPage && (
                <>
                  <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                    <Wallet className="w-3.5 h-3.5 text-[#006B3F]" />
                    <span className="text-slate-500 font-medium">Balance:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatNaira(user.simulated_balance)}
                    </span>
                  </div>

                  <div className="hidden lg:block">
                    <TrustBadge score={user.trust_score} tier={user.trust_tier} compact />
                  </div>
                </>
              )}

              {/* On Public Landing Page, show shortcut to Dashboard */}
              {!isAppPage && (
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white font-extrabold text-xs transition-all shadow-md"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Go to Dashboard
                </Link>
              )}

              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifMenu(!showNotifMenu);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-all"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold flex items-center justify-center border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-[#006B3F] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto flex flex-col gap-2">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-xs">No notifications yet.</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-xl border text-xs flex flex-col gap-1 transition-all ${
                              n.read
                                ? 'bg-slate-50/50 border-slate-100 text-slate-500'
                                : 'bg-slate-50 border-slate-200 text-slate-900 font-medium shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-[#006B3F]">{n.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-600">{n.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative hidden sm:block">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifMenu(false);
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all text-xs font-bold text-slate-900"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#006B3F] text-white flex items-center justify-center font-extrabold font-mono text-xs shadow-xs">
                    {user.full_name.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-800">{user.full_name.split(' ')[0]}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50 rounded-xl mb-1">
                      <div className="font-bold text-slate-900">{user.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{user.phone}</div>
                      <div className="mt-1 font-mono text-[#006B3F] font-bold text-[11px]">
                        {formatNaira(user.simulated_balance)} Balance
                      </div>
                    </div>

                    {user.role === 'admin' ? (
                      <>
                        <Link
                          href="/admin?tab=overview"
                          onClick={() => setShowUserMenu(false)}
                          className="p-2.5 rounded-xl hover:bg-purple-50 text-purple-700 font-semibold flex items-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4 text-purple-600" /> Platform Overview
                        </Link>
                        <Link
                          href="/admin?tab=disputes"
                          onClick={() => setShowUserMenu(false)}
                          className="p-2.5 rounded-xl hover:bg-purple-50 text-purple-700 font-semibold flex items-center gap-2"
                        >
                          <ShieldAlert className="w-4 h-4 text-purple-600" /> Dispute Queue
                        </Link>
                        <Link
                          href="/admin?tab=transactions"
                          onClick={() => setShowUserMenu(false)}
                          className="p-2.5 rounded-xl hover:bg-purple-50 text-purple-700 font-semibold flex items-center gap-2"
                        >
                          <ArrowUpDown className="w-4 h-4 text-purple-600" /> All Transactions
                        </Link>
                        <Link
                          href="/admin?tab=users"
                          onClick={() => setShowUserMenu(false)}
                          className="p-2.5 rounded-xl hover:bg-purple-50 text-purple-700 font-semibold flex items-center gap-2"
                        >
                          <Users className="w-4 h-4 text-purple-600" /> User Directory
                        </Link>
                        <Link
                          href="/admin?tab=withdrawals"
                          onClick={() => setShowUserMenu(false)}
                          className="p-2.5 rounded-xl hover:bg-purple-50 text-purple-700 font-semibold flex items-center gap-2"
                        >
                          <Landmark className="w-4 h-4 text-purple-600" /> Withdrawals
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-2"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#006B3F]" /> Merchant Dashboard
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setShowUserMenu(false)}
                          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-2"
                        >
                          <ShoppingBag className="w-4 h-4 text-blue-600" /> Buyer Orders
                        </Link>
                      </>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="p-2.5 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={openAuthModal}
                className="hidden sm:inline-block px-3.5 py-2 rounded-xl text-slate-700 hover:text-[#006B3F] hover:bg-slate-100 text-xs font-extrabold transition-all"
              >
                Sign In
              </button>
              <button
                onClick={openAuthModal}
                className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white text-xs font-extrabold transition-all shadow-md"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Hamburger / Close Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-all flex items-center justify-center"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#006B3F]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-lg px-4 py-5 shadow-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
          {user && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#006B3F] text-white flex items-center justify-center font-extrabold font-mono text-sm shadow-xs">
                  {user.full_name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">{user.full_name}</div>
                  <div className="text-[11px] text-[#006B3F] font-mono font-bold">
                    {formatNaira(user.simulated_balance)} Balance
                  </div>
                </div>
              </div>
              <TrustBadge score={user.trust_score} tier={user.trust_tier} compact />
            </div>
          )}

          <div className="flex flex-col gap-1 text-sm font-extrabold">
            {user?.role === 'admin' ? (
              <>
                <Link
                  href="/admin?tab=overview"
                  className="p-3 rounded-xl flex items-center gap-2.5 transition-all text-purple-700 bg-purple-50"
                >
                  <BarChart3 className="w-4 h-4 text-purple-600" /> Platform Overview
                </Link>
                <Link
                  href="/admin?tab=disputes"
                  className="p-3 rounded-xl flex items-center gap-2.5 transition-all text-slate-700 hover:bg-slate-50"
                >
                  <ShieldAlert className="w-4 h-4 text-purple-600" /> Dispute Queue
                </Link>
                <Link
                  href="/admin?tab=transactions"
                  className="p-3 rounded-xl flex items-center gap-2.5 transition-all text-slate-700 hover:bg-slate-50"
                >
                  <ArrowUpDown className="w-4 h-4 text-purple-600" /> All Transactions
                </Link>
                <Link
                  href="/admin?tab=users"
                  className="p-3 rounded-xl flex items-center gap-2.5 transition-all text-slate-700 hover:bg-slate-50"
                >
                  <Users className="w-4 h-4 text-purple-600" /> User Directory
                </Link>
                <Link
                  href="/admin?tab=withdrawals"
                  className="p-3 rounded-xl flex items-center gap-2.5 transition-all text-slate-700 hover:bg-slate-50"
                >
                  <Landmark className="w-4 h-4 text-purple-600" /> Withdrawals
                </Link>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={logout}
                  className="p-3 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 text-left text-xs"
                >
                  <LogOut className="w-4 h-4" /> Sign Out Admin
                </button>
              </>
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`p-3 rounded-xl flex items-center gap-2.5 transition-all ${
                    pathname === '/dashboard'
                      ? 'bg-emerald-50 text-[#006B3F]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#006B3F]" /> Merchant Dashboard
                </Link>
                <Link
                  href="/active-contracts"
                  className={`p-3 rounded-xl flex items-center gap-2.5 transition-all ${
                    pathname.startsWith('/active-contracts')
                      ? 'bg-emerald-50 text-[#006B3F]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#006B3F]" /> Active Contracts
                </Link>
                <Link
                  href="/orders"
                  className={`p-3 rounded-xl flex items-center gap-2.5 transition-all ${
                    pathname.startsWith('/orders')
                      ? 'bg-emerald-50 text-[#006B3F]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-[#006B3F]" /> Buyer Orders
                </Link>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={logout}
                  className="p-3 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 text-left text-xs"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/how-it-works"
                  className={`p-3 rounded-xl transition-all ${
                    pathname === '/how-it-works'
                      ? 'bg-emerald-50 text-[#006B3F]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  How It Works
                </Link>
                <Link
                  href="/pay/escrow-vintage-denim-99a2"
                  className={`p-3 rounded-xl transition-all ${
                    pathname.startsWith('/pay')
                      ? 'bg-emerald-50 text-[#006B3F]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Live Demo Contract
                </Link>
                <Link
                  href="/faq"
                  className={`p-3 rounded-xl transition-all ${
                    pathname === '/faq'
                      ? 'bg-emerald-50 text-[#006B3F]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  FAQ
                </Link>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    onClick={openAuthModal}
                    className="w-full py-3 rounded-xl bg-[#006B3F] hover:bg-[#005432] text-white text-xs font-extrabold text-center shadow-md"
                  >
                    Get Started
                  </button>
                  <button
                    onClick={openAuthModal}
                    className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-extrabold text-center"
                  >
                    Sign In
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
