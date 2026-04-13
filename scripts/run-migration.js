const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const db = new Database('./data/db.sqlite')

const migration = fs.readFileSync('./drizzle/0004_add_dilekce_sablonu.sql', 'utf8')

// Split by --> statement-breakpoint and run each
const statements = migration.split(/-->\s*statement-breakpoint\s*/).filter(s => s.trim())

for (const stmt of statements) {
  if (stmt.trim()) {
    console.log('Running:', stmt.substring(0, 50) + '...')
    db.exec(stmt)
  }
}

console.log('Migration 0004 applied successfully')

// Verify table exists
const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='dilekce_sablonu'").get()
console.log('Table dilekce_sablonu exists:', !!result)

db.close()