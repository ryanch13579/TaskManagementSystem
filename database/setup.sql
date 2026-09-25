-- Single-file clean start for the whole database: drops and recreates
-- everything (users/groups/permissions fully seeded, Applications/Plans/
-- Tasks schema in place but empty - no dummy apps/plans/tasks). Pair with
-- teardown.sql for a full wipe.
--
-- This is a merge of create_users_table.sql + create_workspace_tables.sql
-- into one self-contained file (no SOURCE, so it works the same whether run
-- from the `database/` directory or anywhere else) - those two files still
-- exist separately if you only need to reset one half of the schema.
CREATE DATABASE IF NOT EXISTS `nodelogin` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `nodelogin`;

-- Drop in dependency order: tasks/plans reference Application, Application
-- has no dependents left once those are gone.
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `plans`;
DROP TABLE IF EXISTS `Application`;
DROP TABLE IF EXISTS `users`;

-- ============================================================
-- Users / roles / permissions
-- ============================================================

-- Column names/types follow the Users ERD: user_id (PK), name (UNIQUE),
-- email (UNIQUE), password_hash, role (JSON), is_active, created_at,
-- updated_at.
--
-- `role` is also the sole source of truth for group/role membership - there
-- is no separate groups/user_groups table. checkGroup(userId, groupName)
-- (server/utils/users.js) checks membership by reading this
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
  ('admin1', 'admin1@gmail.com', '$2b$10$hv5bmPMn/DS4areGK4jjJOzUxpQbsysCroAMjYNK3ejsLK6/61Tfq', JSON_ARRAY('admin','Project Lead','Developer','Project Manager')),               -- admin1
  ('admin2', 'admin2@gmail.com', '$2b$10$ttoWY1J8YLRGFclq.1h1AOK8HBThY1Sb5lP3tDwY2EAfJP84N/P3y', JSON_ARRAY('admin', 'Project Lead')), -- admin2
  ('user1',  'user1@gmail.com',  '$2b$10$PXopUV.w9Qo9/.neHo5LSub2UBStbV5CyKPON96BxjvrDM0D5h/gi', JSON_ARRAY('Developer')),            -- user1
  ('user2',  'user2@gmail.com',  '$2b$10$fAzspnLS3DCwOpciV7Q7vO8LXBxN54OssT/M0fUkkHwxpm1Fn2S/2', JSON_ARRAY('Project Manager', 'Developer')); -- user2

-- ============================================================
-- Applications / Plans / Tasks - schema only, no seed data
-- ============================================================

-- Column names follow the Application ERD exactly now (App_Acronym,
-- App_Description, App_Rnumber, App_startDate/endDate, App_permit_*) -
-- App_Acronym is the real primary key, not a surrogate id. Renaming an
-- acronym cascades through every plan/task that references it via
-- ON UPDATE CASCADE (see `plans`/`tasks` below) rather than needing a
-- stable surrogate to insulate against that. There's no separate display
-- name column either (App_Acronym is all the ERD gives an application) -
-- updated_at/created_at are the only columns here that aren't from the ERD,
-- kept for the same optimistic-concurrency reason as `users` above.
CREATE TABLE `Application` (
  `App_Acronym` VARCHAR(10) NOT NULL,
  `App_Description` TEXT NULL,
  -- Running number for this app's next generated Task_id (see `tasks`
  -- below) - server-managed only, never accepted from the client, and
  -- incremented (under a row lock) each time a task is created so two
  -- concurrent creates on the same app can never hand out the same number.
  `App_Rnumber` INT NOT NULL DEFAULT 1,
  `App_startDate` DATETIME NOT NULL,
  `App_endDate` DATETIME NOT NULL,
  -- Permission-related columns from the ERD. Not enforced anywhere yet -
  -- the app currently only cares about the Plan/Task flow.
  `App_permit_Open` INT NULL,
  `App_permit_toDoList` INT NULL,
  `App_permit_Doing` INT NULL,
  `App_permit_Done` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`App_Acronym`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Plan_name is the plan's real primary key, matching the ERD - there's no
-- surrogate plan_id. A plan's identity is only unique *within* its
-- application (two apps can each have a "Sprint 1"), so the key is the pair
-- (Plan_name, Plan_app_Acronym), not Plan_name alone. Plan_app_Acronym
-- references Application.App_Acronym - ON UPDATE CASCADE keeps it in sync
-- if an application is ever re-acronymed.
CREATE TABLE `plans` (
  `Plan_name` VARCHAR(50) NOT NULL,
  `Plan_app_Acronym` VARCHAR(10) NOT NULL,
  `Plan_startDate` DATETIME NOT NULL,
  `Plan_endDate` DATETIME NOT NULL,
  `updated_at` DATETIME(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Plan_name`, `Plan_app_Acronym`),
  FOREIGN KEY (`Plan_app_Acronym`) REFERENCES `Application`(`App_Acronym`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Task_description is TEXT (the ERD's "INT" looked like a copy/paste typo -
-- confirmed). Task_state is the 5-value enum already used by the Task Board
-- UI. Task_owner is nullable, unlike the ERD's NN - the frontend already
-- supports creating a task before anyone is assigned to it ("Unassigned"),
-- so it must be possible to have no owner yet; Task_creator stays required
-- since it's always set from the authenticated caller. Tasks have no
-- start/end or due date - only Task_createDate, set automatically.
--
-- Task_id is the human-readable `[App_Acronym]_[running number]` string
-- itself (e.g. "ABC_1") - there's no separate surrogate integer key. It's
-- built once at creation from the owning application's App_Acronym +
-- App_Rnumber and never changes afterwards, even if the application is
-- later renamed/re-acronymed - see createTask in
-- server/controllers/taskController.js.
--
-- Task_notes is also the task's full history trail - there is no separate
-- task_history table. It's a JSON array, append-only: task creation and
-- every later edit/state-change adds one entry (never removes or rewrites
-- earlier ones) of the shape { state, changedBy, changedAt, text }, where
-- `text` is whatever was typed in the "Additional Notes" box for that save
-- (null if nothing was typed). Backs the "Task History" panel on the Task
-- Board directly off this column - see updateTask/createTask in
-- server/controllers/taskController.js.
--
-- Task_app_Acronym references Application.App_Acronym directly, with
-- ON UPDATE CASCADE so a re-acronymed application updates it automatically.
-- Task_plan is nullable (a task can have no plan) and, together with
-- Task_app_Acronym, forms a composite FK into plans(Plan_name,
-- Plan_app_Acronym) - this is what guarantees a task's plan actually
-- belongs to the task's own application. MySQL's FK match semantics mean
-- that composite FK is simply skipped whenever Task_plan is NULL, so an
-- unplanned task needs no special case. It's ON DELETE RESTRICT rather than
-- SET NULL (unlike Task_plan's old single-column FK) because a composite
-- FK's SET NULL would have to null out Task_app_Acronym too, which can't
-- happen - a task always has an app. There's no delete-plan feature today,
-- so this is only a future guardrail: a plan with tasks still on it can't
-- be deleted until they're moved off it.
CREATE TABLE `tasks` (
  `Task_id` VARCHAR(20) NOT NULL,
  `Task_name` VARCHAR(50) NOT NULL,
  `Task_description` TEXT NULL,
  `Task_plan` VARCHAR(50) NULL,
  `Task_app_Acronym` VARCHAR(10) NOT NULL,
  `Task_state` ENUM('Open', 'To Do', 'Doing', 'Done', 'Closed') NOT NULL DEFAULT 'Open',
  `Task_creator` INT NOT NULL,
  `Task_owner` INT NULL,
  -- Microsecond precision (like updated_at above) so getTasks's
  -- ORDER BY Task_createDate stays a stable creation order even when two
  -- tasks are created within the same second.
  `Task_createDate` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `Task_notes` JSON NOT NULL,
  `updated_at` DATETIME(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Task_id`),
  FOREIGN KEY (`Task_app_Acronym`) REFERENCES `Application`(`App_Acronym`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`Task_plan`, `Task_app_Acronym`) REFERENCES `plans`(`Plan_name`, `Plan_app_Acronym`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`Task_creator`) REFERENCES `users`(`user_id`),
  FOREIGN KEY (`Task_owner`) REFERENCES `users`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
