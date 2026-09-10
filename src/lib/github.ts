import { Octokit } from '@octokit/rest';
import { mediaQueries } from '@/lib/db/queries';
import { settingsQueries } from '@/lib/db/queries';
import type { MediaItem, SyncResult } from '@/types';
import { getMediaType, generateId } from '@/lib/utils';

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private branch: string;
  private paths: string[];

  constructor(token: string, owner: string, repo: string, branch: string, paths: string[]) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.paths = paths;
  }

  async syncMedia(): Promise<SyncResult> {
    const errors: string[] = [];
    let newMediaCount = 0;

    try {
      for (const path of this.paths) {
        const result = await this.syncPath(path);
        newMediaCount += result.newMediaCount;
        errors.push(...result.errors);
      }
    } catch (error) {
      errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { success: errors.length === 0, newMediaCount, errors };
  }

  private async syncPath(dirPath: string): Promise<SyncResult> {
    const errors: string[] = [];
    let newMediaCount = 0;

    try {
      const contents = await this.getDirectoryContents(dirPath);

      for (const item of contents) {
        if (item.type === 'file') {
          const mediaType = getMediaType(item.name);
          if (mediaType !== 'unknown') {
            const exists = await mediaQueries.findBySha(item.sha);
            if (!exists) {
              await this.downloadAndStoreMedia(item, mediaType);
              newMediaCount++;
            }
          }
        } else if (item.type === 'dir') {
          const subResult = await this.syncPath(item.path);
          newMediaCount += subResult.newMediaCount;
          errors.push(...subResult.errors);
        }
      }
    } catch (error) {
      errors.push(`Failed to sync ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { success: errors.length === 0, newMediaCount, errors };
  }

  private async getDirectoryContents(path: string) {
    const response = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path,
      ref: this.branch,
    });

    return Array.isArray(response.data) ? response.data : [response.data];
  }

  private async downloadAndStoreMedia(
    item: { name: string; path: string; sha: string; size: number; download_url: string | null; html_url: string },
    type: 'video' | 'image'
  ) {
    if (!item.download_url) return;

    const response = await fetch(item.download_url);
    if (!response.ok) throw new Error(`Failed to download ${item.name}`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const publicDir = `${process.cwd()}/public/media`;
    const fs = await import('fs');
    const path = await import('path');

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const ext = path.extname(item.name);
    const filename = `${generateId()}${ext}`;
    const filePath = path.join(publicDir, filename);

    fs.writeFileSync(filePath, buffer);

    await mediaQueries.create({
      id: generateId(),
      name: item.name,
      path: item.path,
      type,
      size: item.size,
      sha: item.sha,
      url: item.html_url,
      downloadedPath: `/media/${filename}`,
    });
  }

  static async createFromSettings(): Promise<GitHubClient | null> {
    const settings = await settingsQueries.find();
    if (!settings || !settings.githubToken || !settings.githubOwner || !settings.githubRepo) {
      return null;
    }

    return new GitHubClient(
      settings.githubToken,
      settings.githubOwner,
      settings.githubRepo,
      settings.githubBranch,
      settings.githubPaths
    );
  }
}

export async function syncGitHubMedia(): Promise<SyncResult> {
  const client = await GitHubClient.createFromSettings();
  if (!client) {
    return { success: false, newMediaCount: 0, errors: ['GitHub not configured'] };
  }
  return client.syncMedia();
}