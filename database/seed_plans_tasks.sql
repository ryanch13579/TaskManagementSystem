-- Demo data for the Plans & Tasks / Task Board screens, so those pages have
-- something to show without creating it by hand through the UI:
--   DEMO   - 3 plans (2-3 tasks each) plus a couple of unplanned tasks
--   CRM    - 2 plans, 5 tasks
--   HRMS   - 2 plans, 4 tasks plus 1 unplanned task
--   MOBILE - 1 plan, 3 tasks
--   DEMO2  - no plans or tasks (exercises the empty state)
--
-- Run after setup.sql (or create_users_table.sql + create_workspace_tables.sql)
-- - it needs users 1-4 (admin1/admin2/user1/user2) already seeded, since
-- Task_creator/Task_owner are FKs into `users`.
--
-- Safe to re-run: deletes the seeded applications first, then reinserts
-- everything fresh. Tasks are deleted explicitly before their applications:
-- tasks -> plans is ON DELETE RESTRICT, so letting the Application delete
-- cascade would fail as soon as any task belongs to a plan.
USE `nodelogin`;

DELETE FROM `tasks` WHERE `Task_app_Acronym` IN ('DEMO', 'CRM', 'HRMS', 'MOBILE', 'DEMO2');
DELETE FROM `Application` WHERE `App_Acronym` IN ('DEMO', 'CRM', 'HRMS', 'MOBILE', 'DEMO2');

INSERT INTO `Application`
  (`App_Acronym`, `App_Description`, `App_Rnumber`, `App_startDate`, `App_endDate`)
VALUES
  ('DEMO', 'Demo application seeded with sample plans and tasks', 11, '2026-01-01', '2026-12-31');

INSERT INTO `plans`
  (`Plan_name`, `Plan_app_Acronym`, `Plan_startDate`, `Plan_endDate`)
VALUES
  ('Sprint 1', 'DEMO', '2026-01-01', '2026-03-31'),
  ('Sprint 2', 'DEMO', '2026-04-01', '2026-06-30'),
  ('Sprint 3', 'DEMO', '2026-07-01', '2026-09-30');

-- Task_notes mirrors what createTask() writes: a one-entry history array
-- recording the creator and the state the task started in ("Open"), even
-- for tasks seeded further along - see server/controllers/taskController.js.
-- Task_id follows the same `[App_Acronym]_[running number]` scheme it
-- generates, 1 through 10, which is why App_Rnumber above is seeded at 11.
INSERT INTO `tasks`
  (`Task_id`, `Task_name`, `Task_description`, `Task_plan`, `Task_app_Acronym`, `Task_state`, `Task_creator`, `Task_owner`, `Task_notes`)
VALUES
  -- Sprint 1 (3 tasks)
  ('DEMO_1', 'Set up project scaffolding', 'Initialise repo, CI, and base project structure.', 'Sprint 1', 'DEMO', 'Closed', 2, 3,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin2', 'changedAt', '2026-01-02T09:00:00.000Z', 'text', 'Initial setup task'))),
  ('DEMO_2', 'Design database schema', 'Draft ERD and initial migration scripts.', 'Sprint 1', 'DEMO', 'Done', 2, 4,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin2', 'changedAt', '2026-01-05T09:00:00.000Z', 'text', NULL))),
  ('DEMO_3', 'Implement login page', 'Build the login form and wire it to auth API.', 'Sprint 1', 'DEMO', 'Doing', 1, 3,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin1', 'changedAt', '2026-01-10T09:00:00.000Z', 'text', NULL))),

  -- Sprint 2 (2 tasks)
  ('DEMO_4', 'Build task board UI', 'Kanban-style board with drag/drop state changes.', 'Sprint 2', 'DEMO', 'To Do', 2, 4,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin2', 'changedAt', '2026-04-02T09:00:00.000Z', 'text', NULL))),
  ('DEMO_5', 'Add email notifications', 'Notify Project Leads when a task reaches Done.', 'Sprint 2', 'DEMO', 'Open', 1, NULL,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin1', 'changedAt', '2026-04-08T09:00:00.000Z', 'text', NULL))),

  -- Sprint 3 (3 tasks)
  ('DEMO_6', 'Write integration tests', 'Cover the plan/task creation and state-transition flows.', 'Sprint 3', 'DEMO', 'Open', 2, NULL,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin2', 'changedAt', '2026-07-02T09:00:00.000Z', 'text', NULL))),
  ('DEMO_7', 'Performance tuning', 'Profile and optimise the task board queries.', 'Sprint 3', 'DEMO', 'To Do', 1, 3,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin1', 'changedAt', '2026-07-05T09:00:00.000Z', 'text', NULL))),
  ('DEMO_8', 'Prepare release notes', 'Summarise changes for the Sprint 3 release.', 'Sprint 3', 'DEMO', 'Open', 2, NULL,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin2', 'changedAt', '2026-07-10T09:00:00.000Z', 'text', NULL))),

  -- Unplanned tasks (no Task_plan)
  ('DEMO_9', 'Investigate flaky CI job', 'CI intermittently fails on the workspace SSE tests.', NULL, 'DEMO', 'Open', 3, NULL,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'user1', 'changedAt', '2026-05-20T09:00:00.000Z', 'text', NULL))),
  ('DEMO_10', 'Research SSO integration', 'Look into SAML/OIDC options for enterprise login.', NULL, 'DEMO', 'Open', 4, NULL,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'user2', 'changedAt', '2026-06-25T09:00:00.000Z', 'text', NULL)));

-- ---------------------------------------------------------------------------
-- Additional applications. Same conventions as DEMO above: each App_Rnumber
-- is one past the highest Task_id number seeded for that app.
-- ---------------------------------------------------------------------------

INSERT INTO `Application`
  (`App_Acronym`, `App_Description`, `App_Rnumber`, `App_startDate`, `App_endDate`)
VALUES
  ('CRM', 'Customer relationship management portal', 6, '2026-02-01', '2026-11-30'),
  ('HRMS', 'HR management system for onboarding and leave', 6, '2026-03-01', '2027-02-28'),
  ('MOBILE', 'Companion mobile app for the task board', 4, '2026-06-01', '2026-12-31'),
  ('DEMO2', 'Another demo application (intentionally empty)', 1, '2027-01-01', '2027-12-31');

INSERT INTO `plans`
  (`Plan_name`, `Plan_app_Acronym`, `Plan_startDate`, `Plan_endDate`)
VALUES
  ('Phase 1', 'CRM', '2026-02-01', '2026-05-31'),
  ('Phase 2', 'CRM', '2026-06-01', '2026-09-30'),
  ('Q2 Release', 'HRMS', '2026-04-01', '2026-06-30'),
  ('Q3 Release', 'HRMS', '2026-07-01', '2026-09-30'),
  ('MVP', 'MOBILE', '2026-06-01', '2026-10-31');

INSERT INTO `tasks`
  (`Task_id`, `Task_name`, `Task_description`, `Task_plan`, `Task_app_Acronym`, `Task_state`, `Task_creator`, `Task_owner`, `Task_notes`)
VALUES
  -- CRM / Phase 1 (3 tasks)
  ('CRM_1', 'Customer list view', 'Paginated, searchable list of customer accounts.', 'Phase 1', 'CRM', 'Closed', 1, 3,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin1', 'changedAt', '2026-02-03T09:00:00.000Z', 'text', NULL))),
  ('CRM_2', 'Customer detail page', 'Show contact info, notes, and interaction history.', 'Phase 1', 'CRM', 'Done', 1, 4,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin1', 'changedAt', '2026-02-10T09:00:00.000Z', 'text', NULL))),
  ('CRM_3', 'Import customers from CSV', 'Bulk import with validation and error report.', 'Phase 1', 'CRM', 'Doing', 2, 3,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin2', 'changedAt', '2026-03-01T09:00:00.000Z', 'text', NULL))),

  -- CRM / Phase 2 (2 tasks)
  ('CRM_4', 'Sales pipeline dashboard', 'Chart deals by stage with totals per stage.', 'Phase 2', 'CRM', 'To Do', 2, 4,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin2', 'changedAt', '2026-06-03T09:00:00.000Z', 'text', NULL))),
  ('CRM_5', 'Email integration', 'Log sent/received customer emails automatically.', 'Phase 2', 'CRM', 'Open', 1, NULL,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin1', 'changedAt', '2026-06-12T09:00:00.000Z', 'text', NULL))),

  -- HRMS / Q2 Release (2 tasks)
  ('HRMS_1', 'Employee onboarding checklist', 'Configurable checklist assigned to new hires.', 'Q2 Release', 'HRMS', 'Done', 2, 3,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin2', 'changedAt', '2026-04-02T09:00:00.000Z', 'text', NULL))),
  ('HRMS_2', 'Leave request form', 'Submit leave with date range and reason.', 'Q2 Release', 'HRMS', 'Closed', 2, 4,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin2', 'changedAt', '2026-04-08T09:00:00.000Z', 'text', NULL))),

  -- HRMS / Q3 Release (2 tasks)
  ('HRMS_3', 'Leave approval workflow', 'Managers approve/reject leave with comments.', 'Q3 Release', 'HRMS', 'Doing', 1, 4,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin1', 'changedAt', '2026-07-03T09:00:00.000Z', 'text', NULL))),
  ('HRMS_4', 'Payroll export', 'Export monthly leave data for payroll.', 'Q3 Release', 'HRMS', 'To Do', 1, 3,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin1', 'changedAt', '2026-07-15T09:00:00.000Z', 'text', NULL))),

  -- HRMS unplanned (no Task_plan)
  ('HRMS_5', 'Audit access permissions', 'Review who can view employee records.', NULL, 'HRMS', 'Open', 3, NULL,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'user1', 'changedAt', '2026-08-05T09:00:00.000Z', 'text', NULL))),

  -- MOBILE / MVP (3 tasks)
  ('MOBILE_1', 'Set up React Native project', 'Scaffold app with navigation and auth screens.', 'MVP', 'MOBILE', 'Done', 1, 3,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin1', 'changedAt', '2026-06-02T09:00:00.000Z', 'text', NULL))),
  ('MOBILE_2', 'Task list screen', 'Read-only list of tasks assigned to the user.', 'MVP', 'MOBILE', 'Doing', 2, 4,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin2', 'changedAt', '2026-07-01T09:00:00.000Z', 'text', NULL))),
  ('MOBILE_3', 'Push notifications', 'Notify users when a task is assigned to them.', 'MVP', 'MOBILE', 'Open', 2, NULL,
    JSON_ARRAY(JSON_OBJECT('state', 'Open', 'changedBy', 'admin2', 'changedAt', '2026-08-10T09:00:00.000Z', 'text', NULL)));
