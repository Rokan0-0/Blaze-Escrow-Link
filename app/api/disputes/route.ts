import { NextResponse, type NextRequest } from 'next/server';
import { ServerDb } from '@/lib/db/serverDb';
import { mockStore } from '@/lib/mock/store';
import { Dispute } from '@/lib/mock/types';

// GET /api/disputes — returns all disputes from Supabase Postgres / mockStore for admin
export async function GET(request: NextRequest) {
  try {
    let disputes = await ServerDb.getDisputes();
    if (!disputes || disputes.length === 0) {
      disputes = mockStore.getAllDisputes();
    } else {
      const map = new Map<string, Dispute>();
      mockStore.getAllDisputes().forEach((d) => map.set(d.id, d));
      disputes.forEach((d) => map.set(d.id, d));
      disputes = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return NextResponse.json({ disputes });
  } catch (error: any) {
    return NextResponse.json({ disputes: mockStore.getAllDisputes() });
  }
}
