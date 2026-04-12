ALTER TABLE `dosya` ADD COLUMN `surec_detay` text;
--> statement-breakpoint
CREATE TABLE `durusma` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dosya_id` integer NOT NULL,
	`tarih` text NOT NULL,
	`saat` text,
	`mahkeme_kurum` text,
	`tur` text,
	`notlar` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`dosya_id`) REFERENCES `dosya`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_durusma_dosya` ON `durusma` (`dosya_id`);
--> statement-breakpoint
CREATE INDEX `idx_durusma_tarih` ON `durusma` (`tarih`);
