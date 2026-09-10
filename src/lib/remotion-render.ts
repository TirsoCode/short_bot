import { execa } from 'execa';
import { shortQueries, mediaQueries, hookQueries } from '@/lib/db/queries';
import { settingsQueries } from '@/lib/db/queries';
import type { Short, Media } from '@/lib/db/schema';
import path from 'path';
import fs from 'fs';

export async function renderShort(
  shortId: string,
  onProgress?: (progress: number) => void
): Promise<{ outputPath: string; duration: number }> {
  const short = await shortQueries.findById(shortId);
  if (!short) throw new Error('Short not found');

  const hook = await hookQueries.findById(short.hookId);
  if (!hook) throw new Error('Hook not found');

  const mediaItems = await mediaQueries.findByIds(short.mediaIds);
  const settings = await settingsQueries.find();

  const width = settings?.videoWidth ?? 1080;
  const height = settings?.videoHeight ?? 1920;
  const fps = settings?.videoFps ?? 30;
  const maxDuration = settings?.maxShortDuration ?? 30;

  const hookDuration = 3;
  const outroDuration = 1;
  const availableMediaDuration = maxDuration - hookDuration - outroDuration;

  const mediaForRemotion = mediaItems.map((m) => ({
    id: m.id,
    type: m.type,
    path: m.downloadedPath ?? m.url,
    duration: Math.min(4, availableMediaDuration / mediaItems.length),
  }));

  const totalFrames = Math.ceil(maxDuration * fps);

  const outputDir = path.join(process.cwd(), 'public', 'renders');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${shortId}.mp4`);

  const inputProps = {
    hookText: short.hookText,
    media: mediaForRemotion,
    width,
    height,
    fps,
    durationInFrames: totalFrames,
  };

  const propsPath = path.join(outputDir, `${shortId}-props.json`);
  fs.writeFileSync(propsPath, JSON.stringify(inputProps));

  const remotionDir = path.join(process.cwd(), 'remotion');
  const compositionId = 'ShortComposition';

  onProgress?.(10);

  try {
    await execa(
      'npx',
      [
        'remotion',
        'render',
        'src/index.ts',
        compositionId,
        outputPath,
        `--props=${propsPath}`,
        `--concurrency=1`,
        `--log-level=warn`,
      ],
      {
        cwd: remotionDir,
        stdout: 'pipe',
        stderr: 'pipe',
      }
    );

    onProgress?.(90);

    if (!fs.existsSync(outputPath)) {
      throw new Error('Render completed but output file not found');
    }

    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      throw new Error('Rendered file is empty');
    }

    onProgress?.(100);

    return { outputPath, duration: maxDuration };
  } catch (error) {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    throw error;
  }
}

export async function getVideoDuration(filePath: string): Promise<number> {
  try {
    const { execa } = await import('execa');
    const { stdout } = await execa('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    return Math.ceil(parseFloat(stdout));
  } catch {
    return 0;
  }
}