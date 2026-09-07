CREATE DATABASE IF NOT EXISTS `nodelogin` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `nodelogin`;

-- Drop in dependency order: user_groups references both accounts and groups,
-- so it must go first, then groups, then accounts.
DROP TABLE IF EXISTS `user_groups`;
DROP TABLE IF EXISTS `groups`;
DROP TABLE IF EXISTS `accounts`;

CREATE TABLE `accounts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `roles` JSON NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Passwords below are bcrypt hashes of the plaintext values shown in each comment.
INSERT INTO `accounts` (`username`, `email`, `password`, `roles`) VALUES
  ('admin1', 'admin1@gmail.com', '$2b$10$hv5bmPMn/DS4areGK4jjJOzUxpQbsysCroAMjYNK3ejsLK6/61Tfq', JSON_ARRAY('admin')),               -- admin1
  ('admin2', 'admin2@gmail.com', '$2b$10$ttoWY1J8YLRGFclq.1h1AOK8HBThY1Sb5lP3tDwY2EAfJP84N/P3y', JSON_ARRAY('admin', 'Project Lead')), -- admin2
  ('user1',  'user1@gmail.com',  '$2b$10$PXopUV.w9Qo9/.neHo5LSub2UBStbV5CyKPON96BxjvrDM0D5h/gi', JSON_ARRAY('Developer')),            -- user1
  ('user2',  'user2@gmail.com',  '$2b$10$fAzspnLS3DCwOpciV7Q7vO8LXBxN54OssT/M0fUkkHwxpm1Fn2S/2', JSON_ARRAY('Project Manager', 'Developer')); -- user2

CREATE TABLE `groups` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `user_groups` (
  `user_id` INT(11) NOT NULL,
  `group_id` INT(11) NOT NULL,
  PRIMARY KEY (`user_id`, `group_id`),
  FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed groups matching your current role names
INSERT INTO `groups` (`name`) VALUES
  ('admin'), ('Project Lead'), ('Project Manager'), ('Developer');

-- Migrate existing roles data into the new junction table
INSERT INTO user_groups (user_id, group_id)
SELECT a.id, g.id
FROM accounts a
JOIN `groups` g ON JSON_CONTAINS(a.roles, JSON_QUOTE(g.name));