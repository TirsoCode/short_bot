import { NextRequest, NextResponse } from 'next/server';
import { shortQueries, hookQueries } from '@/lib/db/queries';

export async function GET() {
  const shorts = await shortQueries.findAll();
  return NextResponse.json(shorts);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hookId, mediaIds, title, description, tags } = body;
    if (!hookId || !mediaIds?.length) return NextResponse.json({ error: 'Hook and media required' }, { status: 400 });
    const hook = await hookQueries.findById(hookId);
    if (!hook) return NextResponse.json({ error: 'Hook not found' }, { status: 404 });
    const short = await shortQueries.create({ id: crypto.randomUUID(), hookId, hookText: hook.text, mediaIds, title: title || 'Short', description: description || '', tags: tags || [], status: 'draft' });
    return NextResponse.json(short, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}