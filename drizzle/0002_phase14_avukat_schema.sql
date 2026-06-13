-- Drizzle Studio: For generating phase 14 schema migration
-- Phase 14: Add 5 new columns to sigorta_sirketi, create avukat and avukat_sigorta_sirketi tables, update taraf with avukat_id

-- Step 1: Add new columns to sigorta_sirketi
ALTER TABLE `sigorta_sirketi` ADD `mersis_no` text;
--> statement-breakpoint
ALTER TABLE `sigorta_sirketi` ADD `vergi_no` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `sigorta_sirketi` ADD `bagli_oldugu_vergi_dairesi` text;
--> statement-breakpoint
ALTER TABLE `sigorta_sirketi` ADD `ihtar_mail` text;
--> statement-breakpoint
ALTER TABLE `sigorta_sirketi` ADD `kep_mail` text;
--> statement-breakpoint

-- Step 2: Create avukat table
CREATE TABLE `avukat` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `ad` text NOT NULL,
  `tbb_sicil_no` text NOT NULL,
  `iban` text,
  `eposta` text,
  `telefon` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint

-- Step 3: Create join table
CREATE TABLE `avukat_sigorta_sirketi` (
  `avukat_id` integer NOT NULL REFERENCES `avukat`(`id`) ON DELETE CASCADE,
  `sigorta_sirketi_id` integer NOT NULL REFERENCES `sigorta_sirketi`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE INDEX `idx_avukat_sirketi_avukat` ON `avukat_sigorta_sirketi` (`avukat_id`);
--> statement-breakpoint
CREATE INDEX `idx_avukat_sirketi_sirketi` ON `avukat_sigorta_sirketi` (`sigorta_sirketi_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_avukat_sirketi` ON `avukat_sigorta_sirketi` (`avukat_id`, `sigorta_sirketi_id`);
--> statement-breakpoint

-- Step 4: Add avukat_id to taraf, drop karsitaraf_vekil
ALTER TABLE `taraf` ADD `avukat_id` integer REFERENCES `avukat`(`id`) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE `taraf` DROP COLUMN `karsitaraf_vekil`;
