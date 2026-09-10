import { NextRequest, NextResponse } from 'next/server';
import { hookQueries } from '@/lib/db/queries';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  await hookQueries.update(id, body);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await hookQueries.delete(id);
  return NextResponse.json({ success: true });
}