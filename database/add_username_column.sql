USE `nodelogin`;

ALTER TABLE `accounts` ADD COLUMN `username` VARCHAR(100) NOT NULL DEFAULT '' AFTER `id`;

UPDATE `accounts` SET `username` = SUBSTRING_INDEX(`email`, '@', 1) WHERE `username` = '';
