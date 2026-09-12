import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { dataDir, ensureDirs } from '@/lib/paths';

let db: SqlJsDatabase | null = null;

const dbPath = path.join(dataDir, 'shortbot.db');

function saveDb() {
  if (!db) return;
  ensureDirs();
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs();
  const isNew = !fs.existsSync(dbPath);
  const database = isNew ? new SQL.Database() : new SQL.Database(fs.readFileSync(dbPath));
  db = database;

  initSchema(database);
  saveDb();

  return database;
}

function ensureColumn(database: SqlJsDatabase, table: string, column: string, ddl: string) {
  const info = database.exec(`PRAGMA table_info(${table})`);
  const columns = info.length ? info[0].values.map(row => row[1]) : [];
  if (!columns.includes(column)) {
    database.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

function initSchema(database: SqlJsDatabase) {
  database.run(`CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, name TEXT NOT NULL, path TEXT NOT NULL, type TEXT NOT NULL, size INTEGER NOT NULL, sha TEXT NOT NULL UNIQUE, url TEXT NOT NULL, downloaded_path TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  database.run(`CREATE TABLE IF NOT EXISTS hooks (id TEXT PRIMARY KEY, text TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  database.run(`CREATE TABLE IF NOT EXISTS shorts (id TEXT PRIMARY KEY, hook_id TEXT NOT NULL, hook_text TEXT NOT NULL, media_ids TEXT NOT NULL DEFAULT '[]', title TEXT NOT NULL, description TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'draft', rendered_path TEXT, duration INTEGER, youtube_video_id TEXT, youtube_url TEXT, error_message TEXT, reject_reason TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  database.run(`CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY DEFAULT 'default', github_owner TEXT NOT NULL DEFAULT '', github_repo TEXT NOT NULL DEFAULT '', github_branch TEXT NOT NULL DEFAULT 'main', github_paths TEXT NOT NULL DEFAULT '["videos", "fotos"]', github_token TEXT NOT NULL DEFAULT '', youtube_client_id TEXT NOT NULL DEFAULT '', youtube_client_secret TEXT NOT NULL DEFAULT '', youtube_refresh_token TEXT, sync_interval_minutes INTEGER NOT NULL DEFAULT 30, max_short_duration INTEGER NOT NULL DEFAULT 30, video_width INTEGER NOT NULL DEFAULT 1080, video_height INTEGER NOT NULL DEFAULT 1920, video_fps INTEGER NOT NULL DEFAULT 30, media_paths TEXT NOT NULL DEFAULT '["videos", "fotos"]', auto_shorts_per_day INTEGER NOT NULL DEFAULT 2, auto_publish INTEGER NOT NULL DEFAULT 0, auto_runs TEXT NOT NULL DEFAULT '[]', style_json TEXT NOT NULL DEFAULT '{"background":"#000000","hookTextColor":"#ffffff","hookBg":"rgba(0, 0, 0, 0.75)","hookBorder":"rgba(255, 255, 255, 0.15)","hookFontSize":52,"accent":"#3b82f6","outroText":"¡Sígueme para más!","outroSubtext":"Suscríbete y activa la campanita 🔔"}', created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  database.run(`CREATE TABLE IF NOT EXISTS youtube_tokens (id TEXT PRIMARY KEY DEFAULT 'default', access_token TEXT NOT NULL, refresh_token TEXT NOT NULL, expiry_date INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  ensureColumn(database, 'settings', 'media_paths', `TEXT NOT NULL DEFAULT '["videos", "fotos"]'`);
  ensureColumn(database, 'settings', 'auto_shorts_per_day', `INTEGER NOT NULL DEFAULT 2`);
  ensureColumn(database, 'settings', 'auto_publish', `INTEGER NOT NULL DEFAULT 0`);
  ensureColumn(database, 'settings', 'auto_runs', `TEXT NOT NULL DEFAULT '[]'`);
  ensureColumn(database, 'settings', 'style_json', `TEXT NOT NULL DEFAULT '{"background":"#000000","hookTextColor":"#ffffff","hookBg":"rgba(0, 0, 0, 0.75)","hookBorder":"rgba(255, 255, 255, 0.15)","hookFontSize":52,"accent":"#3b82f6","outroText":"¡Sígueme para más!","outroSubtext":"Suscríbete y activa la campanita 🔔"}'`);
  database.run(`CREATE INDEX IF NOT EXISTS media_sha_idx ON media(sha)`);
  database.run(`CREATE INDEX IF NOT EXISTS media_type_idx ON media(type)`);
  database.run(`CREATE INDEX IF NOT EXISTS shorts_status_idx ON shorts(status)`);
  database.run(`CREATE INDEX IF NOT EXISTS shorts_hook_idx ON shorts(hook_id)`);

  const existingSettings = database.exec("SELECT 1 FROM settings WHERE id = 'default'");
  if (existingSettings.length === 0 || existingSettings[0].values.length === 0) {
    const ghToken = process.env.GITHUB_TOKEN || '';
    database.run("INSERT INTO settings (id, github_token) VALUES ('default', ?)", [ghToken]);
  }

  const hookCount = database.exec('SELECT COUNT(*) AS c FROM hooks');
  const count = hookCount.length > 0 ? Number(hookCount[0].values[0][0]) : 0;
  if (count === 0) {
    const seedHooks = [
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
    const stmt = database.prepare('INSERT INTO hooks (id, text, is_active) VALUES (?, ?, 1)');
    seedHooks.forEach(text => stmt.run([crypto.randomUUID(), text]));
    stmt.free();
  }
}

function rowsToObjects(result: { columns: string[]; values: any[][] }): any[] {
  if (!result || !result.values || result.values.length === 0) return [];
  const columns = result.columns;
  return result.values.map((row: any[]) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
    return obj;
  });
}

async function query(sql: string, params: any[] = []): Promise<any[]> {
  const database = await getDb();
  const results = database.exec(sql, params);
  if (!results || !results.length) return [];
  return rowsToObjects(results[0]);
}

async function run(sql: string, params: any[] = []): Promise<void> {
  const database = await getDb();
  database.run(sql, params);
  saveDb();
}

async function getOne(sql: string, params: any[] = []): Promise<any> {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

export { query, run, getOne, saveDb };