# Task Management System

A full-stack Kanban-style task manager. Applications contain plans, and plans contain tasks.
Tasks move through a fixed workflow, and each application decides which user group may perform each step.

- **Client:** React 19, Vite, Tailwind CSS, React Router
- **Server:** Node.js, Express 5, JWT auth, bcrypt, Nodemailer
- **Database:** MySQL (via `mysql2`)

## Features

- **Login** with email and password. Sessions use a JWT, and every request re-checks that the account is still active.
- **User management** (admin only): create users, edit them, assign groups and enable or disable accounts.
- **Applications** (Project Lead creates and edits): an acronym, a description, dates, and per-application permits.
- **Plans** (Project Manager creates and edits): named date ranges inside an application.
- **Task board**: tasks move through `Open → To Do → Doing → Done → Closed`. Every change is added to the task's history.
- **Live updates** over Server-Sent Events, so open boards refresh when someone else makes a change.
- **Email notification** to every Project Lead when a task reaches `Done`.

### User groups

| Group           | Default rights |
| --------------- | -------------- |
| admin           | Manage users (the only group that can open User Management) |
| Project Lead    | Create applications; create and edit tasks; approve or reject tasks in `Done` |
| Project Manager | Create plans; release `Open` tasks to `To Do` |
| Developer       | Start `To Do` tasks; request review of, or give back, `Doing` tasks |

The task rights are **per-application permits** (`App_permit_Create`, `_Open`, `_toDoList`, `_Doing`, `_Done`).
The defaults above apply to new applications, and a Project Lead can change them for each application.

## Project structure

```
client/      React front end (Vite)
  src/api/       fetch wrappers for each server resource
  src/pages/     Login, Applications, PlansAndTasks, TaskBoard, UserManagement
server/      Express API
  api/routes/        route definitions (all mounted under /api)
  api/controllers/   request handlers
  api/middleware/    verifyToken / requireGroup
  config/            MySQL connection pool
  utils/             errors, mailer, SSE, helpers
  scripts/           seedUsers.js
database/    SQL scripts (schema, seed data, migrations)
postman/     Postman collection for the API
```

## Getting started

### Prerequisites

- Node.js 20 or later
- A MySQL 8 server

### 1. Set up the database

```bash
mysql -u root -p < database/setup.sql            # creates the `nodelogin` database and seeds users
mysql -u root -p < database/seed_plans_tasks.sql # optional: demo applications, plans and tasks
```

Other scripts in `database/`:

| Script | Purpose |
| ------ | ------- |
| `teardown.sql` | Drops the entire `nodelogin` database |
| `create_users_table.sql` / `create_workspace_tables.sql` | Reset only the users half or only the workspace half of the schema |
| `migrate_app_permits.sql` | One-time upgrade of an older database to per-application permits |

### 2. Configure and start the server

Create `server/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nodelogin
JWT_SECRET=change_me

# Optional. Without SMTP_HOST, emails are logged to the console instead of sent.
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

```bash
cd server
npm install
npm run dev        # starts the API on http://localhost:5000
```

`npm run seed` re-hashes and upserts the users listed in `server/scripts/seedUsers.js`.

### 3. Start the client

```bash
cd client
npm install
npm run dev        # Vite dev server, usually http://localhost:5173
```

The client calls the API at `http://localhost:5000/api`. To change this, edit `BASE_URL` in `client/src/api/client.js`.

### Seeded accounts

`setup.sql` creates these accounts. Each password is the same as the username.

| Name   | Email                           | Groups |
| ------ | ------------------------------- | ------ |
| admin1 | adminuser13579@protonmail.com   | admin, Project Lead, Developer, Project Manager |
| admin2 | admin2@gmail.com                | admin |
| user1  | user1@gmail.com                 | Developer |
| user2  | user2@gmail.com                 | Project Manager, Developer |

## API

All endpoints are under `/api`. Unless marked otherwise, they need an `Authorization: Bearer <token>` header.

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/auth/login` | Body: `{ email, password }`. No token needed |
| POST | `/auth/logout` | |
| PUT  | `/auth/change-password/:id` | Body: `{ currentPassword, newPassword }` |
| GET / POST | `/users` | admin only |
| GET  | `/users/:id` | |
| PUT  | `/users/:id` | admin only |
| GET  | `/groups/check` | Checks whether the caller is in a group |
| GET / POST | `/applications` | POST is for Project Lead only |
| GET / PUT | `/applications/:id` | PUT is for Project Lead only |
| GET / POST | `/plans` | POST is for Project Manager only |
| PUT  | `/plans/:appId/:name` | Project Manager only |
| GET / POST | `/tasks` | GET takes `?appId=&plan=`. POST checks the application's Create permit |
| PUT  | `/tasks/:id` | Edit or change state. Checks the permit for the current state |
| POST | `/tasks/:id/notes` | Add a note to the task's history |

### Single-purpose task endpoints

These are for callers outside the web client. See the Postman collection in `postman/`.

| Method | Path | Body / query |
| ------ | ---- | ------------ |
| POST  | `/CreateTask` | `{ name, description, plan, appId, ownerId, notes }` |
| GET   | `/GetTaskbyState` | `?appId=&state=` (`Open`, `To Do`, `Doing`, `Done`, `Closed`) |
| PATCH | `/PromoteTask2Done` | `{ taskId, notes? }`. Moves a task from `Doing` to `Done` and emails Project Leads |

### Live-update streams (SSE)

These pass the token as `?token=` instead of in a header.

- `GET /events`: changes to the logged-in user's own account
- `GET /workspace/events`: plan and task changes
- `GET /applications/events`: application changes
