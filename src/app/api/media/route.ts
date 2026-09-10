import { NextRequest, NextResponse } from 'next/server';
import { mediaQueries } from '@/lib/db/queries';

export async function GET() {
  return NextResponse.json(await mediaQueries.findAll());
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await mediaQueries.delete(id);
  return NextResponse.json({ success: true });
}