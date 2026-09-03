-- ============================================
-- Task Management System — Full Database Setup
-- Run this once on a fresh MySQL instance
-- ============================================
CREATE DATABASE IF NOT EXISTS `nodelogin` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `nodelogin`;

-- Accounts table, roles stored as a JSON array e.g. ["admin","user"]
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `roles` JSON NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed accounts
INSERT INTO `accounts` (`username`, `password`, `email`, `roles`) VALUES
  ('admin1', 'admin1', 'admin1@gmail.com', JSON_ARRAY('admin')),
  ('admin2', 'admin2', 'admin2@gmail.com', JSON_ARRAY('admin', 'user')),
  ('user1',  'user1',  'user1@gmail.com',  JSON_ARRAY('user')),
  ('user2',  'user2',  'user2@gmail.com',  JSON_ARRAY('user'));