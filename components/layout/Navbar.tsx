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
import {
  Bell,
  Wallet,
  LogOut,
  ShieldAlert,
  User,
  ExternalLink,
  PlusCircle,
  ShoppingBag,
  LayoutDashboard,
  CheckCircle2,
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (user) {
      const items = mockStore.getNotificationsForUser(user.id);
      setNotifications(items);
    }
  }, [user, pathname]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    if (user) {
      notifications.forEach((n) => mockStore.markNotifAsRead(n.id));
      setNotifications(mockStore.getNotificationsForUser(user.id));
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#2A2A2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <Logo />
        </Link>

        {/* Middle: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              pathname === '/dashboard'
                ? 'bg-[#1A1A1A] text-white border border-[#2A2A2A]'
                : 'text-zinc-400 hover:text-white hover:bg-[#111111]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-500" />
            Dashboard
          </Link>
          <Link
            href="/orders"
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              pathname.startsWith('/orders')
                ? 'bg-[#1A1A1A] text-white border border-[#2A2A2A]'
                : 'text-zinc-400 hover:text-white hover:bg-[#111111]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            My Orders
          </Link>

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                pathname.startsWith('/admin')
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Right Action Icons & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Wallet Balance Display */}
              <div className="hidden sm:flex items-center gap-2 bg-[#111111] border border-[#2A2A2A] px-3 py-1.5 rounded-lg text-xs">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-zinc-400 font-medium">Balance:</span>
                <span className="font-mono font-bold text-white">
                  {formatNaira(user.simulated_balance)}
                </span>
              </div>

              {/* Trust Score Pill */}
              <div className="hidden lg:block">
                <TrustBadge score={user.trust_score} tier={user.trust_tier} compact />
              </div>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifMenu(!showNotifMenu);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 rounded-lg bg-[#111111] border border-[#2A2A2A] text-zinc-300 hover:text-white hover:bg-[#1A1A1A] transition-all"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center border border-[#0A0A0A]">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111111] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 z-50 flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-2 border-b border-[#2A2A2A]">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto flex flex-col gap-1.5">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-zinc-500 text-xs">No notifications yet.</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 transition-all ${
                              n.read
                                ? 'bg-[#1A1A1A]/40 border-[#2A2A2A]/40 text-zinc-400'
                                : 'bg-[#1A1A1A] border-[#3F3F46] text-zinc-100 font-medium'
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-emerald-400">{n.title}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-zinc-300">{n.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifMenu(false);
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-[#111111] border border-[#2A2A2A] hover:bg-[#1A1A1A] transition-all text-xs font-semibold text-white"
                >
                  <div className="w-7 h-7 rounded-md bg-[#006B3F] text-white flex items-center justify-center font-extrabold font-mono text-xs">
                    {user.full_name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline font-medium text-zinc-200">{user.full_name.split(' ')[0]}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#111111] border border-[#2A2A2A] rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs">
                    <div className="p-2 border-b border-[#2A2A2A]">
                      <div className="font-semibold text-white">{user.full_name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{user.phone}</div>
                      <div className="mt-1 font-mono text-emerald-400 text-[11px]">
                        {formatNaira(user.simulated_balance)} Balance
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="p-2 rounded-lg hover:bg-[#1A1A1A] text-zinc-300 hover:text-white flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-400" /> Merchant Dashboard
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="p-2 rounded-lg hover:bg-[#1A1A1A] text-zinc-300 hover:text-white flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4 text-blue-400" /> Buyer Orders
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="p-2 rounded-lg hover:bg-[#1A1A1A] text-purple-300 flex items-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4 text-purple-400" /> Compliance Admin
                      </Link>
                    )}

                    <div className="border-t border-[#2A2A2A] my-1" />

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-[#006B3F] hover:bg-[#00874E] text-white text-xs font-semibold transition-all shadow-md"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
