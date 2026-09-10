import { NextRequest, NextResponse } from 'next/server';
import { shortQueries } from '@/lib/db/queries';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  await shortQueries.updateStatus(id, 'rejected', { rejectReason: body.rejectReason || body.reason || '' });
  return NextResponse.json({ success: true });
}