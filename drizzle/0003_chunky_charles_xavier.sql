-- Custom SQL migration file
CREATE TABLE `sure` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dosya_id` integer NOT NULL,
	`ad` text NOT NULL,
	`son_tarih` text NOT NULL,
	`tur` text NOT NULL,
	`notlar` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`dosya_id`) REFERENCES `dosya`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sure_dosya` ON `sure` (`dosya_id`);
--> statement-breakpoint
CREATE INDEX `idx_sure_son_tarih` ON `sure` (`son_tarih`);
