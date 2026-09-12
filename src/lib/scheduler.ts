import cron, { ScheduledTask } from 'node-cron';
import { syncLocalMedia } from '@/lib/local-media';
import { maybeRunAutoShorts } from '@/lib/auto-shorts';
import { renderQueue } from './render-queue';
import { shortQueries, youtubeTokenQueries } from '@/lib/db/queries';
import { YouTubeClient } from '@/lib/youtube';
import { publicToFsPath, rendersDir } from '@/lib/paths';
import fs from 'fs';
import path from 'path';

let jobs: ScheduledTask[] = [];

export function startScheduler() {
  stopScheduler();
  jobs.push(cron.schedule('*/30 * * * *', async () => {
    console.log('[Scheduler] Syncing local folders...');
    const r = await syncLocalMedia();
    console.log(`[Scheduler] Sync: ${r.newMediaCount} new, ${r.errors.length} errors`);
  }));
  jobs.push(cron.schedule('0 * * * *', async () => {
    const ran = await maybeRunAutoShorts();
    if (ran) console.log(`[Scheduler] Auto-generated ${ran} short(s)`);
  }));
  jobs.push(cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler] Cleanup...');
    const dir = rendersDir;
    if (!fs.existsSync(dir)) return;
    const now = Date.now();
    fs.readdirSync(dir).forEach(f => {
      const fp = path.join(dir, f);
      if (now - fs.statSync(fp).mtimeMs > 7 * 24 * 60 * 60 * 1000) fs.unlinkSync(fp);
    });
  }));
  jobs.push(cron.schedule('* * * * *', async () => {
    const shorts = await shortQueries.findByStatus('accepted');
    for (const s of shorts) {
      if (!s.rendered_path) continue;
      const tokens = await youtubeTokenQueries.find();
      if (!tokens) continue;
      try {
        shortQueries.updateStatus(s.id, 'uploading');
        const yt = await YouTubeClient.create(tokens);
        const url = await yt.uploadShort(s, publicToFsPath(s.rendered_path));
        shortQueries.updateStatus(s.id, 'published', { youtube_url: url, youtube_video_id: url.split('v=')[1]?.split('&')[0] });
      } catch (e: any) {
        shortQueries.updateStatus(s.id, 'failed', { error_message: e.message });
      }
    }
  }));
  console.log('[Scheduler] Started');
}

export function stopScheduler() { jobs.forEach(j => j.stop()); jobs = []; }