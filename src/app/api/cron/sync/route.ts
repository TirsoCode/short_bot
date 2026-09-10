import { NextResponse } from 'next/server';
import { syncGitHubMedia } from '@/lib/github';

export async function GET() {
  try {
    const result = await syncGitHubMedia();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}