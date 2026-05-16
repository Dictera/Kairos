const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(':memory:');
db.pragma('foreign_keys = ON');

const migs = fs.readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort();
for (const f of migs) {
  const sql = fs.readFileSync(path.join('drizzle', f), 'utf-8');
  const stmts = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
  for (const s of stmts) {
    try {
      db.exec(s);
    } catch(e) {
      console.log('FAIL in', f, ':', e.message.substring(0, 120));
    }
  }
}

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
console.log('Tables:', tables.join(', '));

const cols = db.pragma('table_info(belge)').map(r => r.name);
console.log('Belge cols:', cols.join(', '));
