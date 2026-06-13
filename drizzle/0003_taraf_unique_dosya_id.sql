-- Migration: recreate taraf with UNIQUE(dosya_id) to fix upsert conflict resolution
-- SQLite cannot add UNIQUE constraints via ALTER TABLE, so the table must be recreated.

-- Step 1: Create new taraf table with UNIQUE constraint on dosya_id
CREATE TABLE `taraf_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `dosya_id` integer NOT NULL UNIQUE,
  `sigorta_sirketi_id` integer REFERENCES `sigorta_sirketi`(`id`) ON DELETE NO ACTION,
  `avukat_id` integer REFERENCES `avukat`(`id`) ON DELETE SET NULL,
  `karsitaraf_ad` text,
  `police_no` text,
  `karsitaraf_plaka` text,
  `surucu_ad` text,
  `surucu_soyad` text,
  `surucu_plaka` text,
  `surucu_telefon` text,
  `surucu_police_no` text,
  FOREIGN KEY (`dosya_id`) REFERENCES `dosya`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint

-- Step 2: Copy data, keeping only the first row per dosya_id to resolve any existing duplicates
INSERT INTO `taraf_new`
SELECT id, dosya_id, sigorta_sirketi_id, avukat_id,
       karsitaraf_ad, police_no, karsitaraf_plaka,
       surucu_ad, surucu_soyad, surucu_plaka, surucu_telefon, surucu_police_no
FROM `taraf`
WHERE id IN (
  SELECT MIN(id) FROM `taraf` GROUP BY dosya_id
);
--> statement-breakpoint

-- Step 3: Drop old table and rename new one
DROP TABLE `taraf`;
--> statement-breakpoint
ALTER TABLE `taraf_new` RENAME TO `taraf`;
