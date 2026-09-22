-- Adds Application/Plan/Task on top of the users/groups/user_groups schema.
-- Run create_users_table.sql first - tasks.task_creator/task_owner reference
-- users(user_id), so that table must already exist.
USE `nodelogin`;

-- Drop in dependency order: task_history references tasks, tasks references
-- plans and applications, plans references applications.
DROP TABLE IF EXISTS `task_history`;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `plans`;
DROP TABLE IF EXISTS `applications`;

-- Column names follow the Application ERD (App_Acronym, App_Description,
-- App_Rnumber, App_startDate/endDate, App_permit_*), with deviations agreed
-- on directly:
--   - app_id (UUID) is the real primary key instead of app_acronym itself,
--     so renaming/reassigning an acronym never has to cascade through every
--     plan/task that references the app. app_acronym stays a required,
--     unique business key.
--   - updated_at follows the same optimistic-concurrency pattern already
--     used on `users` (see create_users_table.sql) - not in the original
--     ERD, but needed for the same reason: safe concurrent edits.
--   - app_name is not in the ERD at all (it only has an acronym), but the
--     frontend already has an "Application Name" field and displays it
--     everywhere (card titles, page headers) as something distinct from the
--     acronym - added so that UI has something real to read.
CREATE TABLE `applications` (
  `app_id` CHAR(36) NOT NULL,
  `app_name` VARCHAR(100) NOT NULL,
  `app_acronym` VARCHAR(10) NOT NULL,
  `app_description` TEXT NULL,
  `app_rnumber` INT NULL,
  `app_start_date` DATETIME NOT NULL,
  `app_end_date` DATETIME NOT NULL,
  -- Permission-related columns from the ERD. Not enforced anywhere yet -
  -- the app currently only cares about the Plan/Task flow.
  `app_permit_open` INT NULL,
  `app_permit_todolist` INT NULL,
  `app_permit_doing` INT NULL,
  `app_permit_done` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`app_id`),
  UNIQUE KEY `app_acronym` (`app_acronym`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Plan_MVP_name is a plain unique-per-application column rather than the
-- primary key, for the same cascade-avoidance reason as app_id above -
-- plan_id is the real PK/FK target.
CREATE TABLE `plans` (
  `plan_id` INT NOT NULL AUTO_INCREMENT,
  `plan_name` VARCHAR(50) NOT NULL,
  `plan_app_id` CHAR(36) NOT NULL,
  `plan_start_date` DATETIME NOT NULL,
  `plan_end_date` DATETIME NOT NULL,
  `updated_at` DATETIME(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`plan_id`),
  UNIQUE KEY `plan_app_id_plan_name` (`plan_app_id`, `plan_name`),
  FOREIGN KEY (`plan_app_id`) REFERENCES `applications`(`app_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- task_description is TEXT (the ERD's "INT" looked like a copy/paste typo -
-- confirmed). task_state is the 5-value enum already used by the Task Board
-- UI. task_owner is nullable, unlike the ERD's NN - the frontend already
-- supports creating a task before anyone is assigned to it ("Unassigned"),
-- so it must be possible to have no owner yet; task_creator stays required
-- since it's always set from the authenticated caller. task_due_date isn't
-- in the ERD either, but the Task Board cards already show a due date -
-- added for the same reason as app_name above.
CREATE TABLE `tasks` (
  `task_id` INT NOT NULL AUTO_INCREMENT,
  `task_name` VARCHAR(50) NOT NULL,
  `task_description` TEXT NULL,
  `task_plan_id` INT NULL,
  `task_app_id` CHAR(36) NOT NULL,
  `task_state` ENUM('Open', 'To Do', 'Doing', 'Done', 'Closed') NOT NULL DEFAULT 'Open',
  `task_creator` INT NOT NULL,
  `task_owner` INT NULL,
  `task_create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `task_due_date` DATETIME NULL,
  `task_notes` JSON NOT NULL,
  `updated_at` DATETIME(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`task_id`),
  FOREIGN KEY (`task_plan_id`) REFERENCES `plans`(`plan_id`) ON DELETE SET NULL,
  FOREIGN KEY (`task_app_id`) REFERENCES `applications`(`app_id`) ON DELETE CASCADE,
  FOREIGN KEY (`task_creator`) REFERENCES `users`(`user_id`),
  FOREIGN KEY (`task_owner`) REFERENCES `users`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per state change, oldest first by insertion. Backs the "Task
-- History" panel on the Task Board (clicking a card). changed_at is
-- DATETIME(6) for the same reason as tasks.updated_at - fine-grained enough
-- to order entries made within the same second (e.g. rapid approve/reject
-- clicks) correctly.
CREATE TABLE `task_history` (
  `history_id` INT NOT NULL AUTO_INCREMENT,
  `task_id` INT NOT NULL,
  `state` ENUM('Open', 'To Do', 'Doing', 'Done', 'Closed') NOT NULL,
  `changed_by` INT NOT NULL,
  `changed_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`history_id`),
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`task_id`) ON DELETE CASCADE,
  FOREIGN KEY (`changed_by`) REFERENCES `users`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
