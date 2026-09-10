import { NextRequest, NextResponse } from 'next/server';
import { hookQueries } from '@/lib/db/queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { text, isActive } = body;

    await hookQueries.update(id, { text, isActive });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating hook:', error);
    return NextResponse.json({ error: 'Failed to update hook' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await hookQueries.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hook:', error);
    return NextResponse.json({ error: 'Failed to delete hook' }, { status: 500 });
  }
}