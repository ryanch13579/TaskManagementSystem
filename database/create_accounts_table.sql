CREATE DATABASE IF NOT EXISTS `nodelogin` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `nodelogin`;

CREATE TABLE IF NOT EXISTS `accounts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `access_roles` JSON NOT NULL,
  `job_titles` JSON NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `accounts` (`username`, `password`, `email`, `access_roles`, `job_titles`) VALUES
  ('admin1', 'admin1', 'admin1@gmail.com', JSON_ARRAY('admin'), NULL),
  ('admin2', 'admin2', 'admin2@gmail.com', JSON_ARRAY('admin', 'user'), JSON_ARRAY('Project Lead')),
  ('user1',  'user1',  'user1@gmail.com',  JSON_ARRAY('user'), JSON_ARRAY('Developer')),
  ('user2',  'user2',  'user2@gmail.com',  JSON_ARRAY('user'), JSON_ARRAY('Project Manager', 'Developer', 'Reviewer'));