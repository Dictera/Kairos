import Database from 'better-sqlite3'

const db = new Database('./data/db.sqlite')
db.pragma('foreign_keys = ON')

const existing = db.prepare('SELECT COUNT(*) as cnt FROM sigorta_turu').get() as { cnt: number }
if (existing.cnt === 0) {
  const insert = db.prepare('INSERT INTO sigorta_turu (ad) VALUES (?)')
  for (const ad of ['Kasko', 'Trafik / ZMSS', 'Sağlık', 'Hayat']) {
    insert.run(ad)
  }
  console.log('Seeded sigorta_turu: Kasko, Trafik / ZMSS, Sağlık, Hayat')
} else {
  console.log('sigorta_turu already seeded, skipping.')
}
db.close()
