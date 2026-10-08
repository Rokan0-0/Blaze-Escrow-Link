import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { mockStore } from '@/lib/mock/store';

// GET /api/disputes — returns all disputes from Supabase Postgres / mockStore for admin
export async function GET(request: NextRequest) {
  try {
    let disputes = await ServerDb.getDisputes();
    if (!disputes || disputes.length === 0) {
      disputes = mockStore.getAllDisputes();
    }
    return NextResponse.json({ disputes });
  } catch (error: any) {
    return NextResponse.json({ disputes: mockStore.getAllDisputes() });
  }
}

