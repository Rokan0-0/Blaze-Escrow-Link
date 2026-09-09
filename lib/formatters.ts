/**
 * Utility functions for currency, formatting, and trust score metrics.
 */

// Formats kobo (integer) to NGN string formatted with commas e.g. 1500000 -> ₦15,000.00
// BUG-014: Guard against null/undefined/NaN to prevent '₦NaN' renders
export function formatNaira(kobo: number | null | undefined, includeDecimals = false): string {
  const safeKobo = typeof kobo === 'number' && !isNaN(kobo) ? kobo : 0;
  const naira = safeKobo / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(naira);
}

// Formats phone numbers to standard Nigerian format +23480...
export function formatPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('234')) {
    cleaned = '234' + cleaned;
  }
  return '+' + cleaned;
}

// BUG-015: Guard against invalid/null date strings to prevent 'Invalid Date' renders
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

// Formats distance in time e.g. 48 hours remaining
export function formatTimeRemaining(expiresAt: string | Date): { hours: number; mins: number; expired: boolean } {
  const expiry = new Date(expiresAt).getTime();
  const now = new Date().getTime();
  const diff = expiry - now;

  if (diff <= 0) {
    return { hours: 0, mins: 0, expired: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, mins, expired: false };
}

// Calculates Escrow Fee: 0.75% max NGN 500 (50000 kobo)
export function calculateEscrowFee(amountKobo: number): number {
  const calculated = Math.round(amountKobo * 0.0075);
  const maxFeeKobo = 50000; // 500 NGN
  return Math.min(calculated, maxFeeKobo);
}

// Generates code slug e.g. #escrow-vintage-jacket-8x2a
export function generateEscrowCode(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 18);
  const randomHex = Math.random().toString(36).substring(2, 6);
  return `#escrow-${slug || 'item'}-${randomHex}`;
}

// Color badges according to strict spec matrix
export function getStateBadgeStyle(state: string): { bg: string; text: string; border: string } {
  switch (state) {
    case 'CREATED':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
    case 'PAID':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
    case 'DISPATCHED':
      return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' };
    case 'CONFIRMED':
    case 'RELEASED':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    case 'DISPUTED':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' };
    case 'REFUNDED':
    case 'CANCELLED':
    case 'EXPIRED':
      return { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' };
    default:
      return { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' };
  }
}
