import { NextRequest, NextResponse } from 'next/server';
import { shortQueries, youtubeTokenQueries } from '@/lib/db/queries';
import { YouTubeClient } from '@/lib/youtube';
import { publicToFsPath } from '@/lib/paths';

export async function POST(request: NextRequest) {
  let shortId = '';
  try {
    const body = await request.json();
    shortId = body.shortId || '';

    if (!shortId) {
      return NextResponse.json({ error: 'Short ID required' }, { status: 400 });
    }

    const short = await shortQueries.findById(shortId);
    if (!short) {
      return NextResponse.json({ error: 'Short not found' }, { status: 404 });
    }

    const rendered_path = short.rendered_path;
    if (!rendered_path) {
      return NextResponse.json({ error: 'Short not rendered yet' }, { status: 400 });
    }
    const renderedPath = publicToFsPath(rendered_path);

    const tokens = await youtubeTokenQueries.find();
    if (!tokens) {
      return NextResponse.json({ error: 'YouTube not connected' }, { status: 400 });
    }

    await shortQueries.updateStatus(shortId, 'uploading');

    const youtube = await YouTubeClient.create(tokens);
    const url = await youtube.uploadShort(short, renderedPath);

    await shortQueries.updateStatus(shortId, 'published', {
      youtubeUrl: url,
      youtubeVideoId: url.split('v=')[1]?.split('&')[0],
    });

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Upload error:', error);
    if (shortId) {
      await shortQueries.updateStatus(
        shortId,
        'failed',
        { errorMessage: error instanceof Error ? error.message : 'Upload failed' }
      );
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tokens = await youtubeTokenQueries.find();
    return NextResponse.json({ connected: !!tokens });
  } catch (error) {
    return NextResponse.json({ connected: false });
  }
}