const Database = require('better-sqlite3');
const db = new Database('./data/db.sqlite');

// Create belge table
db.exec(`
CREATE TABLE IF NOT EXISTS belge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dosya_id INTEGER NOT NULL,
  dosya_no TEXT NOT NULL,
  kategori TEXT NOT NULL,
  dosya_adi TEXT NOT NULL,
  dosya_yolu TEXT NOT NULL,
  dosya_boyutu INTEGER NOT NULL,
  mime_tur TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (dosya_id) REFERENCES dosya(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_belge_dosya ON belge(dosya_id);
CREATE INDEX IF NOT EXISTS idx_belge_tarih ON belge(created_at);
`);

// Create finans_kalemi table
db.exec(`
CREATE TABLE IF NOT EXISTS finans_kalemi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dosya_id INTEGER NOT NULL,
  tur TEXT NOT NULL,
  tutar REAL NOT NULL,
  tarih TEXT NOT NULL,
  aciklama TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (dosya_id) REFERENCES dosya(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_finans_dosya ON finans_kalemi(dosya_id);
CREATE INDEX IF NOT EXISTS idx_finans_tarih ON finans_kalemi(tarih);
`);

console.log('Tables belge and finans_kalemi created successfully');
db.close();
