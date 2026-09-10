import cron from 'node-cron';
import { syncGitHubMedia } from '@/lib/github';
import { settingsQueries } from '@/lib/db/queries';
import { renderQueue } from './render-queue';
import { shortQueries } from '@/lib/db/queries';
import { YouTubeClient } from '@/lib/youtube';
import { youtubeTokenQueries } from '@/lib/db/queries';
import fs from 'fs';
import path from 'path';

let syncJob: cron.ScheduledTask | null = null;
let cleanupJob: cron.ScheduledTask | null = null;
let uploadJob: cron.ScheduledTask | null = null;

export function startScheduler() {
  stopScheduler();

  syncJob = cron.schedule('*/30 * * * *', async () => {
    console.log('[Scheduler] Running GitHub sync...');
    try {
      const result = await syncGitHubMedia();
      console.log(`[Scheduler] Sync completed: ${result.newMediaCount} new media, errors: ${result.errors.length}`);
    } catch (error) {
      console.error('[Scheduler] Sync failed:', error);
    }
  });

  cleanupJob = cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler] Running cleanup...');
    try {
      await cleanupOldRenders();
    } catch (error) {
      console.error('[Scheduler] Cleanup failed:', error);
    }
  });

  uploadJob = cron.schedule('* * * * *', async () => {
    await processPendingUploads();
  });

  console.log('[Scheduler] Started (sync: 30min, cleanup: 3am, upload: 1min)');
}

export function stopScheduler() {
  if (syncJob) {
    syncJob.stop();
    syncJob = null;
  }
  if (cleanupJob) {
    cleanupJob.stop();
    cleanupJob = null;
  }
  if (uploadJob) {
    uploadJob.stop();
    uploadJob = null;
  }
  console.log('[Scheduler] Stopped');
}

async function cleanupOldRenders() {
  const rendersDir = path.join(process.cwd(), 'public', 'renders');
  if (!fs.existsSync(rendersDir)) return;

  const files = fs.readdirSync(rendersDir);
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  let deleted = 0;

  for (const file of files) {
    const filePath = path.join(rendersDir, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > sevenDays) {
      fs.unlinkSync(filePath);
      deleted++;
    }
  }

  console.log(`[Scheduler] Cleaned up ${deleted} old render files`);
}

async function processPendingUploads() {
  const acceptedShorts = await shortQueries.findByStatus('accepted');

  for (const short of acceptedShorts) {
    if (!short.renderedPath) continue;

    const tokens = await youtubeTokenQueries.find();
    if (!tokens) continue;

    try {
      await shortQueries.updateStatus(short.id, 'uploading');

      const youtube = new YouTubeClient(tokens);
      const url = await youtube.uploadShort(short, short.renderedPath);

      await shortQueries.updateStatus(short.id, 'published', {
        youtubeUrl: url,
        youtubeVideoId: url.split('v=')[1]?.split('&')[0],
      });

      console.log(`[Scheduler] Uploaded short ${short.id} to ${url}`);
    } catch (error) {
      console.error(`[Scheduler] Failed to upload short ${short.id}:`, error);
      await shortQueries.updateStatus(short.id, 'failed', {
        errorMessage: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  }
}

export async function triggerSyncNow(): Promise<{ success: boolean; newMediaCount: number; errors: string[] }> {
  return syncGitHubMedia();
}

export async function triggerRender(shortId: string): Promise<{ outputPath: string; duration: number }> {
  return renderQueue.add(shortId);
}

export function getRenderQueueStatus() {
  return {
    currentJob: renderQueue.getCurrentJob(),
    queueLength: renderQueue.getQueueLength(),
  };
}