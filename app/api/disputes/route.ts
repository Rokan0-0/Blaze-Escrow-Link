import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';

// GET /api/disputes — returns all disputes from Supabase Postgres for admin
export async function GET(request: NextRequest) {
  try {
    const disputes = await ServerDb.getDisputes();
    return NextResponse.json({ disputes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
