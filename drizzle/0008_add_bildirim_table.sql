-- Add bildirim table for notifications
CREATE TABLE IF NOT EXISTS "bildirim" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"tip" TEXT NOT NULL,
	"baslik" TEXT NOT NULL,
	"mesaj" TEXT NOT NULL,
	"dosya_id" INTEGER,
	"dosya_no" TEXT,
	"tarih" TEXT NOT NULL,
	"created_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS "idx_bildirim_dosya" ON "bildirim" ("dosya_id");
CREATE INDEX IF NOT EXISTS "idx_bildirim_tarih" ON "bildirim" ("tarih");
CREATE INDEX IF NOT EXISTS "idx_bildirim_tip_tarih" ON "bildirim" ("tip", "tarih");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_bildirim_tip_dosya_tarih" ON "bildirim" ("tip", "dosya_id", "tarih");