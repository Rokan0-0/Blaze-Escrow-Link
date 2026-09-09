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

// POST /api/profile — persist user profile to Supabase Postgres
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile }: { profile: Profile } = body;
    if (!profile?.id || !profile?.phone) {
      return NextResponse.json({ error: 'profile.id and profile.phone required' }, { status: 400 });
    }
    const saved = await ServerDb.saveProfile(profile);
    return NextResponse.json({ success: true, profile: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
