import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { Profile } from '@/lib/mock/types';

// GET /api/profile?user_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }
    const profile = await ServerDb.getProfileById(userId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/profile — persist profile to Supabase Postgres without overwriting live balance/stats
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile }: { profile: Profile } = body;
    if (!profile?.id || !profile?.phone) {
      return NextResponse.json({ error: 'profile.id and profile.phone required' }, { status: 400 });
    }

    const existing = await ServerDb.getProfileById(profile.id);
    if (existing) {
      // Preserve live balance, trades, volume, and trust metrics from DB
      const merged: Profile = {
        ...profile,
        simulated_balance: existing.simulated_balance,
        completed_trades: existing.completed_trades,
        disputed_trades: existing.disputed_trades,
        total_volume: existing.total_volume,
        trust_score: existing.trust_score,
        trust_tier: existing.trust_tier,
        credit_limit: existing.credit_limit,
      };
      const saved = await ServerDb.saveProfile(merged);
      return NextResponse.json({ success: true, profile: saved });
    }

    const saved = await ServerDb.saveProfile(profile);
    return NextResponse.json({ success: true, profile: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
