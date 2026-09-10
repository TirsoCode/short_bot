import { NextRequest, NextResponse } from 'next/server';
import { shortQueries } from '@/lib/db/queries';
import { renderQueue } from '@/lib/render-queue';

export async function POST(request: NextRequest) {
  const { shortId } = await request.json();
  if (!shortId) return NextResponse.json({ error: 'shortId required' }, { status: 400 });
  const short = await shortQueries.findById(shortId);
  if (!short) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  shortQueries.updateStatus(shortId, 'rendering');
  renderQueue.add(shortId).catch((e: any) => shortQueries.updateStatus(shortId, 'failed', { error_message: e.message }));
  return NextResponse.json({ success: true, status: 'rendering' });
}

export async function GET() {
  return NextResponse.json({ currentJob: renderQueue.getCurrentJob(), queueLength: renderQueue.getQueueLength() });
}