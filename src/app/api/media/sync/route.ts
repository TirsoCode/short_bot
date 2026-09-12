import { NextResponse } from 'next/server';
import { syncLocalMedia } from '@/lib/local-media';

export async function POST() {
  try {
    const result = await syncLocalMedia();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Media sync error:', error);
    return NextResponse.json(
      { success: false, newMediaCount: 0, errors: [error instanceof Error ? error.message : 'Sync failed'] },
      { status: 500 }
    );
  }
}