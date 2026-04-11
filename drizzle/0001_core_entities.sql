CREATE TABLE `sigorta_sirketi` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ad` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sigorta_turu` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ad` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mahkeme` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ad` text NOT NULL,
	`sehir` text
);
--> statement-breakpoint
CREATE TABLE `muvekkil` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ad` text NOT NULL,
	`soyad` text NOT NULL,
	`telefon` text,
	`email` text,
	`tc_vergi_no` text,
	`adres` text,
	`notlar` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `dosya` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`muvekkil_id` integer NOT NULL,
	`dosya_no` text NOT NULL,
	`tur` text NOT NULL,
	`sigorta_turu_id` integer,
	`karsitaraf_sigorta_id` integer,
	`talep_tutari` real,
	`muvekkil_plaka` text,
	`durum` text DEFAULT 'aktif' NOT NULL,
	`aciklama` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`muvekkil_id`) REFERENCES `muvekkil`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sigorta_turu_id`) REFERENCES `sigorta_turu`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`karsitaraf_sigorta_id`) REFERENCES `sigorta_sirketi`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_dosya_muvekkil` ON `dosya` (`muvekkil_id`);
--> statement-breakpoint
CREATE INDEX `idx_dosya_durum` ON `dosya` (`durum`);
--> statement-breakpoint
CREATE INDEX `idx_dosya_tur` ON `dosya` (`tur`);
--> statement-breakpoint
CREATE TABLE `taraf` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dosya_id` integer NOT NULL,
	`sigorta_sirketi_id` integer,
	`karsitaraf_ad` text,
	`karsitaraf_vekil` text,
	`police_no` text,
	`karsitaraf_plaka` text,
	FOREIGN KEY (`dosya_id`) REFERENCES `dosya`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sigorta_sirketi_id`) REFERENCES `sigorta_sirketi`(`id`) ON UPDATE no action ON DELETE no action
);
