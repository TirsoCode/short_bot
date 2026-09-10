import { NextRequest, NextResponse } from 'next/server';
import { shortQueries } from '@/lib/db/queries';
import { renderQueue } from '@/lib/render-queue';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const short = await shortQueries.findById(id);
    
    if (!short) {
      return NextResponse.json({ error: 'Short not found' }, { status: 404 });
    }

    if (short.status !== 'rendered' && short.status !== 'draft') {
      return NextResponse.json({ error: 'Short cannot be accepted in current state' }, { status: 400 });
    }

    if (short.status === 'draft' || short.status === 'rendering') {
      await shortQueries.updateStatus(id, 'rendering');
      renderQueue.add(id).catch(async (error) => {
        await shortQueries.updateStatus(id, 'failed', { errorMessage: error.message });
      });
      return NextResponse.json({ success: true, status: 'rendering' });
    }

    await shortQueries.updateStatus(id, 'accepted');
    return NextResponse.json({ success: true, status: 'accepted' });
  } catch (error) {
    console.error('Error accepting short:', error);
    return NextResponse.json({ error: 'Failed to accept short' }, { status: 500 });
  }
}