-- Migration: 0005_add_taraf_driver_fields.sql
-- Phase 10-01: Add driver information columns to taraf table

ALTER TABLE `taraf` ADD COLUMN `surucu_ad` text;
ALTER TABLE `taraf` ADD COLUMN `surucu_soyad` text;
ALTER TABLE `taraf` ADD COLUMN `surucu_plaka` text;
ALTER TABLE `taraf` ADD COLUMN `surucu_telefon` text;
ALTER TABLE `taraf` ADD COLUMN `surucu_police_no` text;
