import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

let db: SqlJsDatabase | null = null;

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'shortbot.db');

function saveDb() {
  if (!db) return;
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    initSchema(db);
    saveDb();
  }

  return db;
}

function initSchema(database: SqlJsDatabase) {
  database.run(`CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, name TEXT NOT NULL, path TEXT NOT NULL, type TEXT NOT NULL, size INTEGER NOT NULL, sha TEXT NOT NULL UNIQUE, url TEXT NOT NULL, downloaded_path TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  database.run(`CREATE TABLE IF NOT EXISTS hooks (id TEXT PRIMARY KEY, text TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  database.run(`CREATE TABLE IF NOT EXISTS shorts (id TEXT PRIMARY KEY, hook_id TEXT NOT NULL, hook_text TEXT NOT NULL, media_ids TEXT NOT NULL DEFAULT '[]', title TEXT NOT NULL, description TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'draft', rendered_path TEXT, duration INTEGER, youtube_video_id TEXT, youtube_url TEXT, error_message TEXT, reject_reason TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  database.run(`CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY DEFAULT 'default', github_owner TEXT NOT NULL DEFAULT '', github_repo TEXT NOT NULL DEFAULT '', github_branch TEXT NOT NULL DEFAULT 'main', github_paths TEXT NOT NULL DEFAULT '["videos", "screenshots"]', github_token TEXT NOT NULL DEFAULT '', youtube_client_id TEXT NOT NULL DEFAULT '', youtube_client_secret TEXT NOT NULL DEFAULT '', youtube_refresh_token TEXT, sync_interval_minutes INTEGER NOT NULL DEFAULT 30, max_short_duration INTEGER NOT NULL DEFAULT 30, video_width INTEGER NOT NULL DEFAULT 1080, video_height INTEGER NOT NULL DEFAULT 1920, video_fps INTEGER NOT NULL DEFAULT 30, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  database.run(`CREATE TABLE IF NOT EXISTS youtube_tokens (id TEXT PRIMARY KEY DEFAULT 'default', access_token TEXT NOT NULL, refresh_token TEXT NOT NULL, expiry_date INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  database.run(`CREATE INDEX IF NOT EXISTS media_sha_idx ON media(sha)`);
  database.run(`CREATE INDEX IF NOT EXISTS media_type_idx ON media(type)`);
  database.run(`CREATE INDEX IF NOT EXISTS shorts_status_idx ON shorts(status)`);
  database.run(`CREATE INDEX IF NOT EXISTS shorts_hook_idx ON shorts(hook_id)`);
}

function rowsToObjects(result: any): Record<string, any>[] {
  if (!result || !result.values || result.values.length === 0) return [];
  const columns = result.columns;
  return result.values.map((row: any[]) => {
    const obj: Record<string, any> = {};
    columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
    return obj;
  });
}

function query(sql: string, params: any[] = []): Record<string, any>[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const result = stmt.getAsObject();
  stmt.free();
  if (typeof result === 'object' && 'values' in result) {
    return rowsToObjects(result);
  }
  return [];
}

function run(sql: string, params: any[] = []): void {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  saveDb();
}

function getOne(sql: string, params: any[] = []): Record<string, any> | null {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const result = stmt.getAsObject();
  stmt.free();
  if (typeof result === 'object' && 'values' in result && result.values.length > 0) {
    const columns = result.columns;
    const row = result.values[0];
    const obj: Record<string, any> = {};
    columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
    return obj;
  }
  return null;
}

export { query, run, getOne, saveDb };