import { NextRequest, NextResponse } from 'next/server';
import { shortQueries } from '@/lib/db/queries';
import { renderQueue } from '@/lib/render-queue';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const short = await shortQueries.findById(id);
  if (!short) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (short.status === 'draft' || short.status === 'failed') {
    shortQueries.updateStatus(id, 'rendering');
    renderQueue.add(id).catch((e: any) => shortQueries.updateStatus(id, 'failed', { error_message: e.message }));
    return NextResponse.json({ success: true, status: 'rendering' });
  }
  if (short.status === 'rendered') {
    shortQueries.updateStatus(id, 'accepted');
    return NextResponse.json({ success: true, status: 'accepted' });
  }
  return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
}