import { NextRequest, NextResponse } from 'next/server';
import { syncGitHubMedia } from '@/lib/github';

export async function POST() {
  try {
    const result = await syncGitHubMedia();
    return NextResponse.json(result);
  } catch (error) {
    console.error('GitHub sync error:', error);
    return NextResponse.json(
      { success: false, newMediaCount: 0, errors: [error instanceof Error ? error.message : 'Sync failed'] },
      { status: 500 }
    );
  }
}