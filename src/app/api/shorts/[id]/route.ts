import { NextRequest, NextResponse } from 'next/server';
import { shortQueries } from '@/lib/db/queries';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const short = await shortQueries.findById(id);
  if (!short) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(short);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  await shortQueries.update(id, body);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await shortQueries.delete(id);
  return NextResponse.json({ success: true });
}