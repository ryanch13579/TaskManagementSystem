USE `nodelogin`;
DROP TABLE IF EXISTS `accounts`;

CREATE TABLE IF NOT EXISTS `accounts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `roles` JSON NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `accounts` (`username`, `password`, `email`, `roles`) VALUES
  ('admin1', 'admin1', 'admin1@gmail.com', JSON_ARRAY('admin')),
  ('admin2', 'admin2', 'admin2@gmail.com', JSON_ARRAY('admin', 'Project Lead')),
  ('user1',  'user1',  'user1@gmail.com',  JSON_ARRAY('Developer')),
  ('user2',  'user2',  'user2@gmail.com',  JSON_ARRAY('Project Manager', 'Developer'));