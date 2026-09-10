import { NextRequest, NextResponse } from 'next/server';
import { shortQueries } from '@/lib/db/queries';
import { renderQueue } from '@/lib/render-queue';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shortId } = body;

    if (!shortId) {
      return NextResponse.json({ error: 'Short ID required' }, { status: 400 });
    }

    const short = await shortQueries.findById(shortId);
    if (!short) {
      return NextResponse.json({ error: 'Short not found' }, { status: 404 });
    }

    if (short.status === 'rendering' || short.status === 'rendered') {
      return NextResponse.json({ error: 'Short already rendered or rendering' }, { status: 400 });
    }

    await shortQueries.updateStatus(shortId, 'rendering');

    renderQueue.add(shortId).catch(async (error) => {
      await shortQueries.updateStatus(shortId, 'failed', { errorMessage: error.message });
    });

    return NextResponse.json({ success: true, status: 'rendering' });
  } catch (error) {
    console.error('Error starting render:', error);
    return NextResponse.json({ error: 'Failed to start render' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { currentJob, queueLength } = await import('@/lib/render-queue').then(m => m.renderQueue.getRenderQueueStatus());
    return NextResponse.json({ currentJob, queueLength });
  } catch (error) {
    console.error('Error getting render status:', error);
    return NextResponse.json({ error: 'Failed to get render status' }, { status: 500 });
  }
}