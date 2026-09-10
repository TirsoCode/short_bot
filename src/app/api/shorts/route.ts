import { NextRequest, NextResponse } from 'next/server';
import { shortQueries, mediaQueries, hookQueries } from '@/lib/db/queries';
import { renderQueue } from '@/lib/render-queue';
import type { Short, Media } from '@/lib/db/schema';

export async function GET() {
  try {
    const shorts = await shortQueries.findAll();
    return NextResponse.json(shorts);
  } catch (error) {
    console.error('Error fetching shorts:', error);
    return NextResponse.json({ error: 'Failed to fetch shorts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hookId, mediaIds, title, description, tags } = body;

    if (!hookId || !mediaIds?.length) {
      return NextResponse.json({ error: 'Hook and media are required' }, { status: 400 });
    }

    const hook = await hookQueries.findById(hookId);
    if (!hook) {
      return NextResponse.json({ error: 'Hook not found' }, { status: 404 });
    }

    const short = await shortQueries.create({
      id: crypto.randomUUID(),
      hookId,
      hookText: hook.text,
      mediaIds,
      title: title ?? 'Short',
      description: description ?? '',
      tags: tags ?? [],
      status: 'draft',
    });

    return NextResponse.json(short, { status: 201 });
  } catch (error) {
    console.error('Error creating short:', error);
    return NextResponse.json({ error: 'Failed to create short' }, { status: 500 });
  }
}