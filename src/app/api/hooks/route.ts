import { NextRequest, NextResponse } from 'next/server';
import { hookQueries } from '@/lib/db/queries';

export async function GET() {
  try {
    const hooks = await hookQueries.findAll();
    return NextResponse.json(hooks);
  } catch (error) {
    console.error('Error fetching hooks:', error);
    return NextResponse.json({ error: 'Failed to fetch hooks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Hook text required' }, { status: 400 });
    }

    const hook = await hookQueries.create(text.trim());
    return NextResponse.json(hook, { status: 201 });
  } catch (error) {
    console.error('Error creating hook:', error);
    return NextResponse.json({ error: 'Failed to create hook' }, { status: 500 });
  }
}