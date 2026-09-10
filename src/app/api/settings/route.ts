import { NextRequest, NextResponse } from 'next/server';
import { settingsQueries, hookQueries } from '@/lib/db/queries';

export async function GET() {
  return NextResponse.json({ settings: await settingsQueries.find(), hooks: await hookQueries.findAll() });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  await settingsQueries.update(body);
  return NextResponse.json({ success: true });
}