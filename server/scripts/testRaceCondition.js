// Exercises every write path against `users` / `user_groups` under real
// concurrency (two calls fired with Promise.allSettled, no await between them)
// to check what the database actually guarantees vs. what the app assumes.
//
// Run with: npm run test:race  (needs the dev MySQL server up)
import pool from "../config/database.js";
import { hashPassword } from "../utils/users.js";
import { createUser, updateUser } from "../controllers/userController.js";

const PASSWORD = "Passw0rd!";
const PREFIX = "race_test_";

const fakeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
};

const summarize = (results) => {
  const succeeded = results.filter((r) => r.status === "fulfilled");
  const failed = results.filter((r) => r.status === "rejected");
  const dup409 = failed.filter((r) => r.reason?.status === 409);
  return { succeeded, failed, dup409 };
};

async function insertUser({ username, email, roles = [] }) {
  const hashed = await hashPassword(PASSWORD);
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)",
    [username, email, hashed, JSON.stringify(roles)],
  );
  return result.insertId;
}

async function countWhere(column, value) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS c FROM users WHERE ${column} = ?`,
    [value],
  );
  return rows[0].c;
}

async function getUserGroupNames(userId) {
  const [rows] = await pool.query(
    `SELECT g.name FROM user_groups ug JOIN \`groups\` g ON ug.group_id = g.id WHERE ug.user_id = ?`,
    [userId],
  );
  return rows.map((r) => r.name).sort();
}

async function getRoles(userId) {
  const [rows] = await pool.query("SELECT role FROM users WHERE user_id = ?", [userId]);
  const roles = rows[0].role;
  return (typeof roles === "string" ? JSON.parse(roles) : roles).slice().sort();
}

const results = [];
async function test(name, fn) {
  try {
    await fn();
    console.log(`PASS  ${name}`);
    results.push({ name, ok: true });
  } catch (err) {
    console.log(`FAIL  ${name}`);
    console.log(`      ${err.message}`);
    results.push({ name, ok: false, err });
  }
}

// --- 1: two brand-new users racing on the same UNIQUE email ----------------

async function testCreateDuplicateEmail() {
  const email = `${PREFIX}dup_email@example.com`;
  const [reqA, reqB] = [1, 2].map((n) => ({
    body: {
      username: `${PREFIX}ce_${n}`,
      email,
      password: PASSWORD,
      roles: [],
      active: true,
    },
  }));

  const settled = await Promise.allSettled([
    createUser(reqA, fakeRes()),
    createUser(reqB, fakeRes()),
  ]);
  const { succeeded, dup409 } = summarize(settled);
  if (succeeded.length !== 1 || dup409.length !== 1) {
    throw new Error(`expected 1 success + 1 dup409, got ${succeeded.length} success / ${dup409.length} dup409`);
  }
  const count = await countWhere("email", email);
  if (count !== 1) throw new Error(`expected 1 row for email, found ${count}`);
}

// --- 1b: two brand-new users racing on the same UNIQUE name -----------------

async function testCreateDuplicateName() {
  const username = `${PREFIX}dup_name`;
  const [reqA, reqB] = [1, 2].map((n) => ({
    body: {
      username,
      email: `${PREFIX}cn_${n}@example.com`,
      password: PASSWORD,
      roles: [],
      active: true,
    },
  }));

  const settled = await Promise.allSettled([
    createUser(reqA, fakeRes()),
    createUser(reqB, fakeRes()),
  ]);
  const { succeeded, dup409 } = summarize(settled);
  if (succeeded.length !== 1 || dup409.length !== 1) {
    throw new Error(`expected 1 success + 1 dup409, got ${succeeded.length} success / ${dup409.length} dup409`);
  }
  const count = await countWhere("name", username);
  if (count !== 1) throw new Error(`expected 1 row for name, found ${count}`);
}

// --- 2: two EXISTING users racing to rename onto the same email ------------

async function testUpdateIntoDuplicateEmail() {
  const target = `${PREFIX}renamed_email@example.com`;
  const idA = await insertUser({ username: `${PREFIX}ue_a`, email: `${PREFIX}ue_a@example.com` });
  const idB = await insertUser({ username: `${PREFIX}ue_b`, email: `${PREFIX}ue_b@example.com` });

  const settled = await Promise.allSettled([
    updateUser({ params: { id: idA }, body: { username: `${PREFIX}ue_a`, email: target, roles: [], active: true, updated_at: null } }, fakeRes()),
    updateUser({ params: { id: idB }, body: { username: `${PREFIX}ue_b`, email: target, roles: [], active: true, updated_at: null } }, fakeRes()),
  ]);
  const { succeeded, dup409 } = summarize(settled);
  if (succeeded.length !== 1 || dup409.length !== 1) {
    throw new Error(`expected 1 success + 1 dup409, got ${succeeded.length} success / ${dup409.length} dup409`);
  }
  const count = await countWhere("email", target);
  if (count !== 1) throw new Error(`expected 1 row for renamed email, found ${count}`);
}

// --- 3: two admins editing the SAME user at once --------------------
// Both requests are read against the same starting `updated_at` (null, since
// this user was just inserted and never updated), simulating two admins who
// loaded the row before either saved. The UPDATE ... WHERE updated_at <=> ?
// in updateUser() means only the first to commit can match — the row's
// updated_at has moved on by the time the second runs — so the second gets a
// 409 instead of silently overwriting the first admin's edit (the
// lost-update race). This also protects users.role / user_groups (two
// copies of the same fact — see the comment on syncUserGroups) from
// drifting apart, since only the winning request calls syncUserGroups.

async function testConcurrentSameUserUpdate() {
  const id = await insertUser({
    username: `${PREFIX}roles_user`,
    email: `${PREFIX}roles_user@example.com`,
    roles: ["Developer"],
  });

  const settled = await Promise.allSettled([
    updateUser({ params: { id }, body: { username: `${PREFIX}roles_user`, email: `${PREFIX}roles_user@example.com`, roles: ["admin"], active: true, updated_at: null } }, fakeRes()),
    updateUser({ params: { id }, body: { username: `${PREFIX}roles_user`, email: `${PREFIX}roles_user@example.com`, roles: ["Project Manager"], active: true, updated_at: null } }, fakeRes()),
  ]);
  const { succeeded, dup409 } = summarize(settled);
  if (succeeded.length !== 1 || dup409.length !== 1) {
    throw new Error(`expected 1 success + 1 conflict(409), got ${succeeded.length} success / ${dup409.length} conflict`);
  }

  const roles = await getRoles(id);
  const groupNames = await getUserGroupNames(id);
  if (JSON.stringify(roles) !== JSON.stringify(groupNames)) {
    throw new Error(
      `users.role and user_groups drifted apart: role=${JSON.stringify(roles)} but user_groups=${JSON.stringify(groupNames)}. ` +
      `syncUserGroups() is not run inside the same transaction/lock as the users UPDATE, so two concurrent edits to the same user can interleave.`,
    );
  }
}

async function cleanup() {
  await pool.query("DELETE FROM users WHERE name LIKE ?", [`${PREFIX}%`]);
}

async function main() {
  try {
    await test("createUser: same email, different usernames", testCreateDuplicateEmail);
    await test("createUser: same username, different emails", testCreateDuplicateName);
    await test("updateUser: two users renamed to same email", testUpdateIntoDuplicateEmail);
    await test("updateUser: two admins editing the same user — second gets a conflict", testConcurrentSameUserUpdate);
  } finally {
    await cleanup();
    await pool.end();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) process.exitCode = 1;
}

main();
