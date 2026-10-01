-- Upgrades an existing database to per-application permissions without
-- wiping it: the old unused INT App_permit_* columns become group-name
-- columns, App_permit_Create is added, and every existing application gets
-- the default groups (the same rights that were hardcoded before). Only
-- needed for a database created before this change - setup.sql and
-- create_workspace_tables.sql already have the new columns. Run once.
USE `nodelogin`;

ALTER TABLE `Application`
  ADD COLUMN `App_permit_Create` VARCHAR(50) NULL DEFAULT 'Project Lead' AFTER `App_endDate`,
  MODIFY `App_permit_Open` VARCHAR(50) NULL DEFAULT 'Project Manager',
  MODIFY `App_permit_toDoList` VARCHAR(50) NULL DEFAULT 'Developer',
  MODIFY `App_permit_Doing` VARCHAR(50) NULL DEFAULT 'Developer',
  MODIFY `App_permit_Done` VARCHAR(50) NULL DEFAULT 'Project Lead';

-- The old columns were never written, so they're all NULL - which would now
-- mean "nobody permitted". Give existing applications the defaults instead.
-- updated_at is set to itself so this doesn't count as a user edit.
UPDATE `Application`
   SET App_permit_Create = 'Project Lead',
       App_permit_Open = 'Project Manager',
       App_permit_toDoList = 'Developer',
       App_permit_Doing = 'Developer',
       App_permit_Done = 'Project Lead',
       updated_at = updated_at;
