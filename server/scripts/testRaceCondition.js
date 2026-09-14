// Exercises every write path against `accounts` / `user_groups` under real
// concurrency (two calls fired with Promise.allSettled, no await between them)
// to check what the database actually guarantees vs. what the app assumes.
//
// Run with: npm run test:race  (needs the dev MySQL server up)
import pool from "../config/database.js";
import { hashPassword } from "../utils/accounts.js";
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

async function insertAccount({ username, email, roles = [] }) {
  const hashed = await hashPassword(PASSWORD);
  const [result] = await pool.query(
    "INSERT INTO accounts (username, email, password, roles, active) VALUES (?, ?, ?, ?, 1)",
    [username, email, hashed, JSON.stringify(roles)],
  );
  return result.insertId;
}

async function countWhere(column, value) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS c FROM accounts WHERE ${column} = ?`,
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
  const [rows] = await pool.query("SELECT roles FROM accounts WHERE id = ?", [userId]);
  const roles = rows[0].roles;
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

// --- 1/2: two brand-new accounts racing on the same UNIQUE column -----------

async function testCreateDuplicateUsername() {
  const username = `${PREFIX}dup_username`;
  const [reqA, reqB] = [1, 2].map((n) => ({
    body: {
      username,
      email: `${PREFIX}cu_${n}@example.com`,
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
  const count = await countWhere("username", username);
  if (count !== 1) throw new Error(`expected 1 row for username, found ${count}`);
}

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

// --- 3/4: two EXISTING accounts racing to rename onto the same value --------

async function testUpdateIntoDuplicateUsername() {
  const target = `${PREFIX}renamed_username`;
  const idA = await insertAccount({ username: `${PREFIX}uu_a`, email: `${PREFIX}uu_a@example.com` });
  const idB = await insertAccount({ username: `${PREFIX}uu_b`, email: `${PREFIX}uu_b@example.com` });

  const settled = await Promise.allSettled([
    updateUser({ params: { id: idA }, body: { username: target, email: `${PREFIX}uu_a@example.com`, roles: [], active: true, version: 0 } }, fakeRes()),
    updateUser({ params: { id: idB }, body: { username: target, email: `${PREFIX}uu_b@example.com`, roles: [], active: true, version: 0 } }, fakeRes()),
  ]);
  const { succeeded, dup409 } = summarize(settled);
  if (succeeded.length !== 1 || dup409.length !== 1) {
    throw new Error(`expected 1 success + 1 dup409, got ${succeeded.length} success / ${dup409.length} dup409`);
  }
  const count = await countWhere("username", target);
  if (count !== 1) throw new Error(`expected 1 row for renamed username, found ${count}`);
}

async function testUpdateIntoDuplicateEmail() {
  const target = `${PREFIX}renamed_email@example.com`;
  const idA = await insertAccount({ username: `${PREFIX}ue_a`, email: `${PREFIX}ue_a@example.com` });
  const idB = await insertAccount({ username: `${PREFIX}ue_b`, email: `${PREFIX}ue_b@example.com` });

  const settled = await Promise.allSettled([
    updateUser({ params: { id: idA }, body: { username: `${PREFIX}ue_a`, email: target, roles: [], active: true, version: 0 } }, fakeRes()),
    updateUser({ params: { id: idB }, body: { username: `${PREFIX}ue_b`, email: target, roles: [], active: true, version: 0 } }, fakeRes()),
  ]);
  const { succeeded, dup409 } = summarize(settled);
  if (succeeded.length !== 1 || dup409.length !== 1) {
    throw new Error(`expected 1 success + 1 dup409, got ${succeeded.length} success / ${dup409.length} dup409`);
  }
  const count = await countWhere("email", target);
  if (count !== 1) throw new Error(`expected 1 row for renamed email, found ${count}`);
}

// --- 5: two admins editing the SAME account at once --------------------
// Both requests are read against the same starting `version`, simulating two
// admins who loaded the row before either saved. The UPDATE ... WHERE
// version = ? in updateUser() means only the first to commit can match; the
// second gets a 409 instead of silently overwriting the first admin's edit
// (the lost-update race). This also protects accounts.roles / user_groups
// (two copies of the same fact — see the comment on syncUserGroups) from
// drifting apart, since only the winning request calls syncUserGroups.

async function testConcurrentSameAccountUpdate() {
  const id = await insertAccount({
    username: `${PREFIX}roles_user`,
    email: `${PREFIX}roles_user@example.com`,
    roles: ["Developer"],
  });

  const settled = await Promise.allSettled([
    updateUser({ params: { id }, body: { username: `${PREFIX}roles_user`, email: `${PREFIX}roles_user@example.com`, roles: ["admin"], active: true, version: 0 } }, fakeRes()),
    updateUser({ params: { id }, body: { username: `${PREFIX}roles_user`, email: `${PREFIX}roles_user@example.com`, roles: ["Project Manager"], active: true, version: 0 } }, fakeRes()),
  ]);
  const { succeeded, dup409 } = summarize(settled);
  if (succeeded.length !== 1 || dup409.length !== 1) {
    throw new Error(`expected 1 success + 1 conflict(409), got ${succeeded.length} success / ${dup409.length} conflict`);
  }

  const roles = await getRoles(id);
  const groupNames = await getUserGroupNames(id);
  if (JSON.stringify(roles) !== JSON.stringify(groupNames)) {
    throw new Error(
      `accounts.roles and user_groups drifted apart: roles=${JSON.stringify(roles)} but user_groups=${JSON.stringify(groupNames)}. ` +
      `syncUserGroups() is not run inside the same transaction/lock as the accounts UPDATE, so two concurrent edits to the same user can interleave.`,
    );
  }
}

async function cleanup() {
  await pool.query("DELETE FROM accounts WHERE username LIKE ?", [`${PREFIX}%`]);
}

async function main() {
  try {
    await test("createUser: same username, different emails", testCreateDuplicateUsername);
    await test("createUser: same email, different usernames", testCreateDuplicateEmail);
    await test("updateUser: two accounts renamed to same username", testUpdateIntoDuplicateUsername);
    await test("updateUser: two accounts renamed to same email", testUpdateIntoDuplicateEmail);
    await test("updateUser: two admins editing the same account — second gets a conflict", testConcurrentSameAccountUpdate);
  } finally {
    await cleanup();
    await pool.end();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) process.exitCode = 1;
}

main();
