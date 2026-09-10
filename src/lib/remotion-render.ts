import { shortQueries, mediaQueries, hookQueries, settingsQueries } from '@/lib/db/queries';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function renderShort(shortId: string, onProgress?: (progress: number) => void) {
  const short = await shortQueries.findById(shortId);
  if (!short) throw new Error('Short not found');
  const hook = await hookQueries.findById(short.hook_id);
  if (!hook) throw new Error('Hook not found');

  const mediaItems = await mediaQueries.findByIds(short.media_ids);
  const settings = await settingsQueries.find();

  const width = settings?.video_width ?? 1080;
  const height = settings?.video_height ?? 1920;
  const fps = settings?.video_fps ?? 30;
  const maxDuration = settings?.max_short_duration ?? 30;

  const mediaForRemotion = mediaItems.map((m: any) => ({
    id: m.id, type: m.type, path: m.downloaded_path ?? m.url,
    duration: Math.min(4, (maxDuration - 4) / mediaItems.length),
  }));

  const totalFrames = Math.ceil(maxDuration * fps);
  const outputDir = path.join(process.cwd(), 'public', 'renders');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${shortId}.mp4`);

  const inputProps = { hookText: short.hook_text, media: mediaForRemotion, width, height, fps, durationInFrames: totalFrames };
  const propsPath = path.join(outputDir, `${shortId}-props.json`);
  fs.writeFileSync(propsPath, JSON.stringify(inputProps));

  onProgress?.(10);
  try {
    execSync(`npx remotion render src/index.ts ShortComposition "${outputPath}" --props="${propsPath}" --concurrency=1`, {
      cwd: path.join(process.cwd(), 'remotion'),
      stdio: 'pipe',
    });
    onProgress?.(100);
    return { outputPath, duration: maxDuration };
  } catch (error: any) {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    throw error;
  }
}