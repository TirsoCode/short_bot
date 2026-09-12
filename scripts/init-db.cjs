const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'shortbot.db');

async function initDb() {
  const SQL = await initSqlJs();

  let db;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  const run = (sql) => db.run(sql);

  run(`CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, name TEXT NOT NULL, path TEXT NOT NULL, type TEXT NOT NULL, size INTEGER NOT NULL, sha TEXT NOT NULL UNIQUE, url TEXT NOT NULL, downloaded_path TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  run(`CREATE TABLE IF NOT EXISTS hooks (id TEXT PRIMARY KEY, text TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  run(`CREATE TABLE IF NOT EXISTS shorts (id TEXT PRIMARY KEY, hook_id TEXT NOT NULL, hook_text TEXT NOT NULL, media_ids TEXT NOT NULL DEFAULT '[]', title TEXT NOT NULL, description TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'draft', rendered_path TEXT, duration INTEGER, youtube_video_id TEXT, youtube_url TEXT, error_message TEXT, reject_reason TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  run(`CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY DEFAULT 'default', github_owner TEXT NOT NULL DEFAULT '', github_repo TEXT NOT NULL DEFAULT '', github_branch TEXT NOT NULL DEFAULT 'main', github_paths TEXT NOT NULL DEFAULT '["videos", "fotos"]', github_token TEXT NOT NULL DEFAULT '', youtube_client_id TEXT NOT NULL DEFAULT '', youtube_client_secret TEXT NOT NULL DEFAULT '', youtube_refresh_token TEXT, sync_interval_minutes INTEGER NOT NULL DEFAULT 30, max_short_duration INTEGER NOT NULL DEFAULT 30, video_width INTEGER NOT NULL DEFAULT 1080, video_height INTEGER NOT NULL DEFAULT 1920, video_fps INTEGER NOT NULL DEFAULT 30, media_paths TEXT NOT NULL DEFAULT '["videos", "fotos"]', created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  run(`CREATE TABLE IF NOT EXISTS youtube_tokens (id TEXT PRIMARY KEY DEFAULT 'default', access_token TEXT NOT NULL, refresh_token TEXT NOT NULL, expiry_date INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)`);

  const settingsColumns = db.exec(`PRAGMA table_info(settings)`)[0].values.map(row => row[1]);
  if (!settingsColumns.includes('media_paths')) {
    run(`ALTER TABLE settings ADD COLUMN media_paths TEXT NOT NULL DEFAULT '["videos", "fotos"]'`);
  }

  run(`CREATE INDEX IF NOT EXISTS media_sha_idx ON media(sha)`);
  run(`CREATE INDEX IF NOT EXISTS media_type_idx ON media(type)`);
  run(`CREATE INDEX IF NOT EXISTS shorts_status_idx ON shorts(status)`);
  run(`CREATE INDEX IF NOT EXISTS shorts_hook_idx ON shorts(hook_id)`);

  const hooks = [
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

  const hookStmt = db.prepare('INSERT OR IGNORE INTO hooks (id, text, is_active) VALUES (?, ?, 1)');
  hooks.forEach(text => {
    hookStmt.run([crypto.randomUUID(), text]);
  });
  hookStmt.free();

  const existing = db.exec('SELECT 1 FROM settings WHERE id = \'default\'');
  if (existing.length === 0 || existing[0].values.length === 0) {
    run(`INSERT INTO settings (id, github_owner, github_repo, github_branch, github_paths, github_token, youtube_client_id, youtube_client_secret, sync_interval_minutes, max_short_duration, video_width, video_height, video_fps) VALUES ('default', '', '', 'main', '["videos", "fotos"]', '', '', '', 30, 30, 1080, 1920, 30)`);
  }

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  db.close();

  console.log('✅ Database initialized at ' + dbPath);
}

initDb().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});