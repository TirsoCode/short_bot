import { NextRequest, NextResponse } from 'next/server';
import { mediaDir, rendersDir } from '@/lib/paths';
import path from 'path';
import fs from 'fs';

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!name || name.includes('/') || name.includes('..')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const file = [path.join(mediaDir, name), path.join(rendersDir, name)].find(p => fs.existsSync(p));
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = fs.readFileSync(file);
  const ext = path.extname(name).toLowerCase();
  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}