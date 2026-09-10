import { NextRequest, NextResponse } from 'next/server';
import { shortQueries } from '@/lib/db/queries';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  shortQueries.updateStatus(id, 'rejected', { reject_reason: body.reason || '' });
  return NextResponse.json({ success: true });
}