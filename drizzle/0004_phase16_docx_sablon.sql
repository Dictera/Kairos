-- Phase 16: Add docx_sablon table and belge.sablon_id FK
-- Creates docx_sablon table for .docx template storage
-- Adds nullable sablon_id FK to belge (ON DELETE SET NULL)

CREATE TABLE `docx_sablon` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `ad` text NOT NULL,
  `kategori` text NOT NULL,
  `dosya_yolu` text NOT NULL,
  `degiskenler` text DEFAULT (json_array()) NOT NULL,
  `default_aksiyon` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL,
  CONSTRAINT `kategori_check` CHECK (`kategori` IN ('STK', 'Mahkeme', 'Genel'))
);
--> statement-breakpoint
CREATE INDEX `idx_docx_sablon_kategori` ON `docx_sablon` (`kategori`);
--> statement-breakpoint
ALTER TABLE `belge` ADD `sablon_id` integer REFERENCES `docx_sablon`(`id`) ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX `idx_belge_sablon` ON `belge` (`sablon_id`);
