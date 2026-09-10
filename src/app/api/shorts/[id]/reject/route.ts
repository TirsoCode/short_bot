import { NextRequest, NextResponse } from 'next/server';
import { shortQueries } from '@/lib/db/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    const short = await shortQueries.findById(id);
    if (!short) {
      return NextResponse.json({ error: 'Short not found' }, { status: 404 });
    }

    await shortQueries.updateStatus(id, 'rejected', { rejectReason: reason ?? '' });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting short:', error);
    return NextResponse.json({ error: 'Failed to reject short' }, { status: 500 });
  }
}