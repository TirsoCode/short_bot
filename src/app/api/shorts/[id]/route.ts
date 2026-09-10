import { NextRequest, NextResponse } from 'next/server';
import { shortQueries } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const short = await shortQueries.findById(id);
    if (!short) {
      return NextResponse.json({ error: 'Short not found' }, { status: 404 });
    }
    return NextResponse.json(short);
  } catch (error) {
    console.error('Error fetching short:', error);
    return NextResponse.json({ error: 'Failed to fetch short' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, tags } = body;

    await shortQueries.update(id, { title, description, tags });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating short:', error);
    return NextResponse.json({ error: 'Failed to update short' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await shortQueries.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting short:', error);
    return NextResponse.json({ error: 'Failed to delete short' }, { status: 500 });
  }
}