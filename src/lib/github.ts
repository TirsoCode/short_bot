import { Octokit } from '@octokit/rest';
import { mediaQueries, settingsQueries } from '@/lib/db/queries';
import { getMediaType, generateId } from '@/lib/utils';
import fs from 'fs';
import path from 'path';

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

  async syncMedia() {
    const errors: string[] = [];
    let newMediaCount = 0;
    for (const p of this.paths) {
      const r = await this.syncPath(p);
      newMediaCount += r.newMediaCount;
      errors.push(...r.errors);
    }
    return { success: errors.length === 0, newMediaCount, errors };
  }

  private async syncPath(dirPath: string): Promise<{ success: boolean; newMediaCount: number; errors: string[] }> {
    const errors: string[] = [];
    let newMediaCount = 0;
    try {
      const contents = await this.octokit.repos.getContent({ owner: this.owner, repo: this.repo, path: dirPath, ref: this.branch });
      const items = Array.isArray(contents.data) ? contents.data : [contents.data];
      for (const item of items) {
        if (item.type === 'file' && 'name' in item && 'sha' in item && 'size' in item && 'download_url' in item && 'html_url' in item) {
          const mediaType = getMediaType(item.name);
          if (mediaType !== 'unknown') {
            const exists = await mediaQueries.findBySha(item.sha);
            if (!exists && item.download_url) {
              const response = await fetch(item.download_url);
              if (response.ok) {
                const buf = Buffer.from(await response.arrayBuffer());
                const publicDir = path.join(process.cwd(), 'public', 'media');
                if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
                const ext = path.extname(item.name);
                const filename = `${generateId()}${ext}`;
                fs.writeFileSync(path.join(publicDir, filename), buf);
                await mediaQueries.create({ id: generateId(), name: item.name, path: item.path, type: mediaType, size: item.size, sha: item.sha, url: item.html_url, downloadedPath: `/media/${filename}` });
                newMediaCount++;
              }
            }
          }
        } else if (item.type === 'dir' && 'path' in item) {
          const sub = await this.syncPath(item.path);
          newMediaCount += sub.newMediaCount;
          errors.push(...sub.errors);
        }
      }
    } catch (error: any) {
      errors.push(`Failed to sync ${dirPath}: ${error.message}`);
    }
    return { success: errors.length === 0, newMediaCount, errors };
  }

  static async createFromSettings() {
    const s = await settingsQueries.find();
    if (!s || !s.github_token || !s.github_owner || !s.github_repo) return null;
    return new GitHubClient(s.github_token, s.github_owner, s.github_repo, s.github_branch, s.github_paths);
  }
}

export async function syncGitHubMedia() {
  const client = await GitHubClient.createFromSettings();
  if (!client) return { success: false, newMediaCount: 0, errors: ['GitHub not configured'] };
  return client.syncMedia();
}