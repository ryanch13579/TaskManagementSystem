import pool from "../config/database.js";
import { hashPassword } from "../utils/accounts.js";

// Type plaintext passwords here — they're hashed before being stored.
const seedUsers = [
  { email: "admin1@gmail.com", password: "admin1", roles: ["admin"] },
  {
    email: "admin2@gmail.com",
    password: "admin2",
    roles: ["admin", "Project Lead"],
  },
  { email: "user1@gmail.com", password: "user1", roles: ["Developer"] },
  {
    email: "user2@gmail.com",
    password: "user2",
    roles: ["Project Manager", "Developer"],
  },
];

async function run() {
  try {
    for (const u of seedUsers) {
      const hashed = await hashPassword(u.password);
      // ON DUPLICATE KEY UPDATE makes this safe to re-run: an existing row
      // (matched on the email unique key) gets its password/roles refreshed
      // instead of the insert failing.
      await pool.query(
        `INSERT INTO accounts (email, password, roles)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE password = VALUES(password), roles = VALUES(roles)`,
        [u.email, hashed, JSON.stringify(u.roles)],
      );
      console.log(`Seeded ${u.email}`);
    }
  } finally {
    // This is a one-shot script, not the long-lived server — close the pool
    // so the process can exit instead of hanging on the open connections.
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  // Non-zero exit so `npm run seed` reports failure instead of looking clean.
  process.exit(1);
});
