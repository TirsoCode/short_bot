import { NextRequest, NextResponse } from 'next/server';
import { hookQueries } from '@/lib/db/queries';

export async function GET() {
  return NextResponse.json(await hookQueries.findAll());
}

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 });
  return NextResponse.json(await hookQueries.create(text.trim()), { status: 201 });
}