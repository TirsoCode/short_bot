import { shortQueries } from '@/lib/db/queries';
import { renderShort } from './remotion-render';

interface QueueItem { shortId: string; resolve: (v: any) => void; reject: (e: Error) => void; }

class RenderQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private currentJob: any = null;

  getCurrentJob() { return this.currentJob; }
  getQueueLength() { return this.queue.length; }

  async add(shortId: string) {
    return new Promise<{ outputPath: string; duration: number }>((resolve, reject) => {
      this.queue.push({ shortId, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.isProcessing || !this.queue.length) return;
    this.isProcessing = true;
    while (this.queue.length) {
      const job = this.queue.shift()!;
      this.currentJob = { shortId: job.shortId, status: 'processing', progress: 0 };
      try {
        shortQueries.updateStatus(job.shortId, 'rendering');
        const result = await renderShort(job.shortId, (p: number) => { this.currentJob.progress = p; });
        this.currentJob = { ...this.currentJob, status: 'completed', progress: 100 };
        shortQueries.updateStatus(job.shortId, 'rendered', { rendered_path: result.outputPath, duration: result.duration });
        job.resolve(result);
      } catch (error: any) {
        this.currentJob = { ...this.currentJob, status: 'failed', error: error.message };
        shortQueries.updateStatus(job.shortId, 'failed', { error_message: error.message });
        job.reject(error);
      }
    }
    this.currentJob = null;
    this.isProcessing = false;
  }
}

export const renderQueue = new RenderQueue();