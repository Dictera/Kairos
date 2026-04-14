CREATE TABLE `dosya_not` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dosya_id` integer NOT NULL,
	`icerik` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`dosya_id`) REFERENCES `dosya`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_dosya_not_dosya` ON `dosya_not` (`dosya_id`);--> statement-breakpoint
CREATE TABLE `olay_gunlugu` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dosya_id` integer NOT NULL,
	`olay_turu` text NOT NULL,
	`aciklama` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`dosya_id`) REFERENCES `dosya`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_olay_dosya` ON `olay_gunlugu` (`dosya_id`);--> statement-breakpoint
CREATE INDEX `idx_olay_tarih` ON `olay_gunlugu` (`created_at`);--> statement-breakpoint
ALTER TABLE `dosya` ADD `hasar_dosya_no` text;--> statement-breakpoint
ALTER TABLE `dosya` ADD `kaza_tarihi` text;--> statement-breakpoint
ALTER TABLE `dosya` ADD `muvekkil_sigorta_id` integer REFERENCES sigorta_sirketi(id);--> statement-breakpoint
ALTER TABLE `dosya` ADD `kusur_orani_karsi` integer;--> statement-breakpoint
ALTER TABLE `muvekkil` ADD `iban` text;