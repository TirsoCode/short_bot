import { shortQueries, mediaQueries, hookQueries, settingsQueries } from '@/lib/db/queries';
import { normalizeStyle, DEFAULT_STYLE } from '@/lib/short-style';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { rendersDir, mediaDir, ensureDirs } from '@/lib/paths';

export async function renderShort(shortId: string, onProgress?: (progress: number) => void) {
  const short = await shortQueries.findById(shortId);
  if (!short) throw new Error('Short not found');
  const hook = await hookQueries.findById(short.hook_id);
  if (!hook) throw new Error('Hook not found');

  const mediaItems = await mediaQueries.findByIds(short.mediaIds);
  const settings = await settingsQueries.find();

  const width = settings?.video_width ?? 1080;
  const height = settings?.video_height ?? 1920;
  const fps = settings?.video_fps ?? 30;
  const maxDuration = settings?.max_short_duration ?? 30;

  const mediaForRemotion = mediaItems.map((m: any) => {
    const remotePath = m.downloaded_path;
    const localPath = remotePath?.startsWith('/api/media/stream/')
      ? path.join(mediaDir, remotePath.split('/').pop())
      : remotePath ?? m.url;
    return {
      id: m.id, type: m.type, path: localPath,
      duration: Math.min(4, (maxDuration - 4) / mediaItems.length),
    };
  });

  const totalFrames = Math.ceil(maxDuration * fps);
  const outputDir = rendersDir;
  ensureDirs();
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${shortId}.mp4`);

  const inputProps = { hookText: short.hook_text, media: mediaForRemotion, width, height, fps, durationInFrames: totalFrames, style: normalizeStyle(settings?.styleJson, DEFAULT_STYLE) };
  const propsPath = path.join(outputDir, `${shortId}-props.json`);
  fs.writeFileSync(propsPath, JSON.stringify(inputProps));

  onProgress?.(10);
  try {
    execSync(`npx remotion render src/index.ts ShortComposition "${outputPath}" --props="${propsPath}" --concurrency=1`, {
      cwd: path.join(process.cwd(), 'remotion'),
      stdio: 'pipe',
    });
    onProgress?.(100);
    return { outputPath, publicUrl: `/api/media/stream/${shortId}.mp4`, duration: maxDuration };
  } catch (error: any) {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    throw error;
  }
}