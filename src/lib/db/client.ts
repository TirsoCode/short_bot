import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'shortbot.db');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

export function getDb() {
  return db;
}

export async function initDb() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('video', 'image')),
      size INTEGER NOT NULL,
      sha TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      downloaded_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS hooks (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS shorts (
      id TEXT PRIMARY KEY,
      hook_id TEXT NOT NULL,
      hook_text TEXT NOT NULL,
      media_ids TEXT NOT NULL DEFAULT '[]',
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'rendering', 'rendered', 'accepted', 'rejected', 'uploading', 'published', 'failed')),
      rendered_path TEXT,
      duration INTEGER,
      youtube_video_id TEXT,
      youtube_url TEXT,
      error_message TEXT,
      reject_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      github_owner TEXT NOT NULL DEFAULT '',
      github_repo TEXT NOT NULL DEFAULT '',
      github_branch TEXT NOT NULL DEFAULT 'main',
      github_paths TEXT NOT NULL DEFAULT '["videos", "screenshots"]',
      github_token TEXT NOT NULL DEFAULT '',
      youtube_client_id TEXT NOT NULL DEFAULT '',
      youtube_client_secret TEXT NOT NULL DEFAULT '',
      youtube_refresh_token TEXT,
      sync_interval_minutes INTEGER NOT NULL DEFAULT 30,
      max_short_duration INTEGER NOT NULL DEFAULT 30,
      video_width INTEGER NOT NULL DEFAULT 1080,
      video_height INTEGER NOT NULL DEFAULT 1920,
      video_fps INTEGER NOT NULL DEFAULT 30,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS youtube_tokens (
      id TEXT PRIMARY KEY DEFAULT 'default',
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expiry_date INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
  ];

  for (const table of tables) {
    sqlite.exec(table);
  }

  const indexes = [
    `CREATE INDEX IF NOT EXISTS media_sha_idx ON media(sha)`,
    `CREATE INDEX IF NOT EXISTS media_type_idx ON media(type)`,
    `CREATE INDEX IF NOT EXISTS shorts_status_idx ON shorts(status)`,
    `CREATE INDEX IF NOT EXISTS shorts_hook_idx ON shorts(hook_id)`,
  ];

  for (const idx of indexes) {
    sqlite.exec(idx);
  }

  const defaultHooks = [
    '¿Necesitas crear un CV rápido?',
    '¿Buscas la mejor forma de hacer X?',
    'Este truco te va a ahorrar horas...',
    'No creerás lo fácil que es...',
    'El secreto que nadie te cuenta...',
    '¿Por qué nadie te enseñó esto antes?',
    'Deja de perder tiempo con...',
    'La forma PRO de hacer X...',
    'Esto cambió mi forma de trabajar...',
    'El error que todos cometen...',
  ];

  for (const hookText of defaultHooks) {
    const exists = sqlite.prepare('SELECT 1 FROM hooks WHERE text = ?').get(hookText);
    if (!exists) {
      sqlite.prepare('INSERT INTO hooks (id, text, is_active) VALUES (?, ?, 1)').run(crypto.randomUUID(), hookText);
    }
  }

  const settingsExist = sqlite.prepare('SELECT 1 FROM settings WHERE id = ?').get('default');
  if (!settingsExist) {
    sqlite.prepare(`
      INSERT INTO settings (id, github_owner, github_repo, github_branch, github_paths, github_token, youtube_client_id, youtube_client_secret, sync_interval_minutes, max_short_duration, video_width, video_height, video_fps)
      VALUES ('default', '', '', 'main', '["videos", "screenshots"]', '', '', '', 30, 30, 1080, 1920, 30)
    `).run();
  }

  console.log('Database initialized successfully');
}

export function closeDb() {
  sqlite.close();
}