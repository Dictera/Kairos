CREATE TABLE `belge` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dosya_id` integer NOT NULL,
	`dosya_no` text NOT NULL,
	`kategori` text NOT NULL,
	`dosya_adi` text NOT NULL,
	`dosya_yolu` text NOT NULL,
	`dosya_boyutu` integer NOT NULL,
	`mime_tur` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`dosya_id`) REFERENCES `dosya`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_belge_dosya` ON `belge` (`dosya_id`);--> statement-breakpoint
CREATE INDEX `idx_belge_tarih` ON `belge` (`created_at`);--> statement-breakpoint
CREATE TABLE `dilekce_odt_sablonu` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baslik` text NOT NULL,
	`kategori` text NOT NULL,
	`dosya_adi` text NOT NULL,
	`dosya_yolu` text NOT NULL,
	`degiskenler` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_odt_sablon_kategori` ON `dilekce_odt_sablonu` (`kategori`);--> statement-breakpoint
CREATE TABLE `dilekce_sablonu` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baslik` text NOT NULL,
	`icerik` text NOT NULL,
	`kategori` text NOT NULL,
	`degiskenler` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sablon_kategori` ON `dilekce_sablonu` (`kategori`);--> statement-breakpoint
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
	`surec_detay` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`muvekkil_id`) REFERENCES `muvekkil`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sigorta_turu_id`) REFERENCES `sigorta_turu`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`karsitaraf_sigorta_id`) REFERENCES `sigorta_sirketi`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_dosya_muvekkil` ON `dosya` (`muvekkil_id`);--> statement-breakpoint
CREATE INDEX `idx_dosya_durum` ON `dosya` (`durum`);--> statement-breakpoint
CREATE INDEX `idx_dosya_tur` ON `dosya` (`tur`);--> statement-breakpoint
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
CREATE INDEX `idx_durusma_dosya` ON `durusma` (`dosya_id`);--> statement-breakpoint
CREATE INDEX `idx_durusma_tarih` ON `durusma` (`tarih`);--> statement-breakpoint
CREATE TABLE `finans_kalemi` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dosya_id` integer NOT NULL,
	`tur` text NOT NULL,
	`tutar` real NOT NULL,
	`tarih` text NOT NULL,
	`aciklama` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`dosya_id`) REFERENCES `dosya`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_finans_dosya` ON `finans_kalemi` (`dosya_id`);--> statement-breakpoint
CREATE INDEX `idx_finans_tarih` ON `finans_kalemi` (`tarih`);--> statement-breakpoint
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
	`tc_vergi_no` text,
	`adres` text,
	`notlar` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
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
CREATE INDEX `idx_sure_dosya` ON `sure` (`dosya_id`);--> statement-breakpoint
CREATE INDEX `idx_sure_son_tarih` ON `sure` (`son_tarih`);--> statement-breakpoint
CREATE TABLE `taraf` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dosya_id` integer NOT NULL,
	`sigorta_sirketi_id` integer,
	`karsitaraf_ad` text,
	`karsitaraf_vekil` text,
	`police_no` text,
	`karsitaraf_plaka` text,
	`surucu_ad` text,
	`surucu_soyad` text,
	`surucu_plaka` text,
	`surucu_telefon` text,
	`surucu_police_no` text,
	FOREIGN KEY (`dosya_id`) REFERENCES `dosya`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sigorta_sirketi_id`) REFERENCES `sigorta_sirketi`(`id`) ON UPDATE no action ON DELETE no action
);
