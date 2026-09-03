USE `nodelogin`;

ALTER TABLE `accounts` ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'user';

UPDATE `accounts` SET `role` = 'admin' WHERE `username` = 'test';

INSERT INTO `accounts` (`username`, `password`, `email`, `role`) VALUES
  ('user1', 'user1pass', 'user1@gmail.com', 'user'),
  ('user2', 'user2pass', 'user2@gmail.com', 'user'),
  ('admin2', 'admin2pass', 'admin2@gmail.com', 'admin');