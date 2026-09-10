import { NextRequest, NextResponse } from 'next/server';
import { settingsQueries } from '@/lib/db/queries';
import { hookQueries } from '@/lib/db/queries';

export async function GET() {
  try {
    const settings = await settingsQueries.find();
    const hooks = await hookQueries.findAll();
    return NextResponse.json({ settings, hooks });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubOwner, githubRepo, githubBranch, githubPaths, githubToken, youtubeClientId, youtubeClientSecret, syncIntervalMinutes, maxShortDuration, videoWidth, videoHeight, videoFps } = body;

    await settingsQueries.update({
      githubOwner,
      githubRepo,
      githubBranch,
      githubPaths,
      githubToken,
      youtubeClientId,
      youtubeClientSecret,
      syncIntervalMinutes,
      maxShortDuration,
      videoWidth,
      videoHeight,
      videoFps,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}