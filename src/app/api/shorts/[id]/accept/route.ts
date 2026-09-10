import { NextRequest, NextResponse } from 'next/server';
import { shortQueries, youtubeTokenQueries } from '@/lib/db/queries';
import { renderQueue } from '@/lib/render-queue';
import { YouTubeClient } from '@/lib/youtube';
import { publicToFsPath } from '@/lib/paths';

async function uploadShort(id: string) {
  try {
    const short = await shortQueries.findById(id);
    if (!short || !short.rendered_path) return;
    const tokens = await youtubeTokenQueries.find();
    if (!tokens) return;

    shortQueries.updateStatus(id, 'uploading');
    const youtube = await YouTubeClient.create(tokens);
    const url = await youtube.uploadShort(short, publicToFsPath(short.rendered_path));
    shortQueries.updateStatus(id, 'published', {
      youtubeUrl: url,
      youtubeVideoId: url.split('v=')[1]?.split('&')[0],
    });
  } catch (error: any) {
    shortQueries.updateStatus(id, 'failed', { errorMessage: error.message });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const short = await shortQueries.findById(id);
  if (!short) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (short.status === 'draft' || (short.status === 'failed' && !short.rendered_path)) {
    await shortQueries.updateStatus(id, 'rendering');
    renderQueue.add(id).catch((e: any) => shortQueries.updateStatus(id, 'failed', { errorMessage: e.message }));
    return NextResponse.json({ success: true, status: 'rendering' });
  }

  if (short.status === 'rendered' || short.status === 'rejected' || short.status === 'failed') {
    await shortQueries.updateStatus(id, 'accepted');
    void uploadShort(id);
    return NextResponse.json({ success: true, status: 'accepted' });
  }

  if (short.status === 'accepted' || short.status === 'uploading') {
    return NextResponse.json({ success: true, status: short.status });
  }

  return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
}