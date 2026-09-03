-- ============================================
-- Task Management System — Full Database Setup
-- Run this once on a fresh MySQL instance
-- ============================================

CREATE DATABASE IF NOT EXISTS `nodelogin` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `nodelogin`;

-- Accounts table, with role built in from the start
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Seed accounts
INSERT INTO `accounts` (`username`, `password`, `email`, `role`) VALUES
  ('test',   'test',        'test@test.com',    'admin'),
  ('admin2', 'admin2pass',  'admin2@gmail.com',  'admin'),
  ('user1',  'user1pass',   'user1@gmail.com',   'user'),
  ('user2',  'user2pass',   'user2@gmail.com',   'user');