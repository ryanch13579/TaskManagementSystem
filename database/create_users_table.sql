-- Recreates the database from scratch. Pair with remove_users.sql (DROP DATABASE)
-- for a guaranteed clean start regardless of what state the schema was left in.
CREATE DATABASE IF NOT EXISTS `nodelogin` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `nodelogin`;

DROP TABLE IF EXISTS `users`;

-- Column names/types follow the Users ERD: user_id (PK), name (UNIQUE),
-- email (UNIQUE), password_hash, role (JSON), is_active, created_at,
-- updated_at.
--
-- `role` is also the sole source of truth for group/role membership - there
-- is no separate groups/user_groups table. checkGroup(userId, groupName)
-- (server/controllers/groupController.js) checks membership by reading this
-- JSON array directly, so a role name only has to exist here to be
-- meaningful - nothing else needs to be kept in sync with it.
CREATE TABLE `users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` JSON NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Doubles as the optimistic-concurrency check in updateUser(): the UPDATE
  -- runs WHERE updated_at <=> ?, tying the write to the row state the caller
  -- actually read. Microsecond precision (vs plain DATETIME's 1-second
  -- resolution) is what keeps two updates issued within the same second from
  -- being indistinguishable and silently passing that check.
  `updated_at` DATETIME(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Passwords below are bcrypt hashes of the plaintext values shown in each comment.
INSERT INTO `users` (`name`, `email`, `password_hash`, `role`) VALUES
  ('admin1', 'admin1@gmail.com', '$2b$10$hv5bmPMn/DS4areGK4jjJOzUxpQbsysCroAMjYNK3ejsLK6/61Tfq', JSON_ARRAY('admin')),               -- admin1
  ('admin2', 'admin2@gmail.com', '$2b$10$ttoWY1J8YLRGFclq.1h1AOK8HBThY1Sb5lP3tDwY2EAfJP84N/P3y', JSON_ARRAY('admin', 'Project Lead')), -- admin2
  ('user1',  'user1@gmail.com',  '$2b$10$PXopUV.w9Qo9/.neHo5LSub2UBStbV5CyKPON96BxjvrDM0D5h/gi', JSON_ARRAY('Developer')),            -- user1
  ('user2',  'user2@gmail.com',  '$2b$10$fAzspnLS3DCwOpciV7Q7vO8LXBxN54OssT/M0fUkkHwxpm1Fn2S/2', JSON_ARRAY('Project Manager', 'Developer')); -- user2
