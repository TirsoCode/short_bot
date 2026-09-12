import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { mediaQueries, settingsQueries } from '@/lib/db/queries';
import { generateId, getMediaType } from '@/lib/utils';
import { mediaDir, ensureDirs } from '@/lib/paths';

export const DEFAULT_MEDIA_PATHS = ['videos', 'fotos'];

function sha1File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function walk(directory: string, onFile: (filePath: string) => Promise<void>, errors: string[]) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, onFile, errors);
    } else if (entry.isFile()) {
      try {
        await onFile(fullPath);
      } catch (error: any) {
        errors.push(`Failed to import ${fullPath}: ${error.message}`);
      }
    }
  }
}

async function importFile(filePath: string): Promise<boolean> {
  const name = path.basename(filePath);
  const type = getMediaType(name);
  if (type === 'unknown') return false;

  const sha = await sha1File(filePath);
  const exists = await mediaQueries.findBySha(sha);
  if (exists) return false;

  ensureDirs();
  const filename = `${generateId()}${path.extname(name)}`;
  fs.copyFileSync(filePath, path.join(mediaDir, filename));
  const stat = fs.statSync(filePath);
  const sourcePath = path.relative(process.cwd(), filePath);

  await mediaQueries.create({
    id: generateId(),
    name,
    path: sourcePath,
    type,
    size: stat.size,
    sha,
    url: sourcePath,
    downloadedPath: `/api/media/stream/${filename}`,
  });
  return true;
}

export async function syncLocalMedia() {
  const settings = await settingsQueries.find();
  const folders = settings?.mediaPaths?.length ? settings.mediaPaths : DEFAULT_MEDIA_PATHS;
  const errors: string[] = [];
  let newMediaCount = 0;

  for (const folder of folders) {
    const absolutePath = path.isAbsolute(folder) ? folder : path.join(process.cwd(), folder);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
      errors.push(`Folder not found: ${folder}`);
      continue;
    }
    try {
      await walk(absolutePath, async filePath => {
        if (await importFile(filePath)) newMediaCount++;
      }, errors);
    } catch (error: any) {
      errors.push(`Failed to scan ${folder}: ${error.message}`);
    }
  }

  return { success: errors.length === 0, newMediaCount, errors };
}