-- Migration: 0004_add_dilekce_sablonu.sql
-- Phase 07-02: Petition template system - dilekce_sablonu table

CREATE TABLE `dilekce_sablonu` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baslik` text NOT NULL,
	`icerik` text NOT NULL,
	`kategori` text NOT NULL,
	`degiskenler` text DEFAULT ('[]') NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sablon_kategori` ON `dilekce_sablonu` (`kategori`);