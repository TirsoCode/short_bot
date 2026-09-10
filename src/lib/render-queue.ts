import { shortQueries } from '@/lib/db/queries';
import { renderShort } from './remotion-render';
import type { RenderJob } from '@/types';

interface QueueItem {
  shortId: string;
  resolve: (value: { outputPath: string; duration: number }) => void;
  reject: (error: Error) => void;
}

class RenderQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private currentJob: RenderJob | null = null;

  getCurrentJob(): RenderJob | null {
    return this.currentJob;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  async add(shortId: string): Promise<{ outputPath: string; duration: number }> {
    return new Promise((resolve, reject) => {
      this.queue.push({ shortId, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      this.currentJob = {
        id: job.shortId,
        shortId: job.shortId,
        status: 'processing',
        progress: 0,
        startedAt: new Date().toISOString(),
      };

      await shortQueries.updateStatus(job.shortId, 'rendering');

      try {
        const result = await renderShort(job.shortId, (progress) => {
          this.currentJob = {
            ...this.currentJob!,
            progress,
          };
        });

        this.currentJob = {
          ...this.currentJob!,
          status: 'completed',
          progress: 100,
          outputPath: result.outputPath,
          completedAt: new Date().toISOString(),
        };

        await shortQueries.updateStatus(job.shortId, 'rendered', {
          renderedPath: result.outputPath,
          duration: result.duration,
        });

        job.resolve(result);
      } catch (error) {
        this.currentJob = {
          ...this.currentJob!,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date().toISOString(),
        };

        await shortQueries.updateStatus(job.shortId, 'failed', {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });

        job.reject(error instanceof Error ? error : new Error('Unknown error'));
      }
    }

    this.currentJob = null;
    this.isProcessing = false;
  }
}

export const renderQueue = new RenderQueue();