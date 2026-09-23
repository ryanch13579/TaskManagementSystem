import pool from "../config/database.js";
import { hashPassword } from "../utils/users.js";

// Type plaintext passwords here — they're hashed before being stored.
const seedUsers = [
  { name: "admin1", email: "admin1@gmail.com", password: "admin1", roles: ["admin"] },
  {
    name: "admin2",
    email: "admin2@gmail.com",
    password: "admin2",
    roles: ["admin", "Project Lead"],
  },
  { name: "user1", email: "user1@gmail.com", password: "user1", roles: ["Developer"] },
  {
    name: "user2",
    email: "user2@gmail.com",
    password: "user2",
    roles: ["Project Manager", "Developer"],
  },
];

async function run() {
  try {
    for (const u of seedUsers) {
      const hashed = await hashPassword(u.password);
      // ON DUPLICATE KEY UPDATE makes this safe to re-run.
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = VALUES(role)`,
        [u.name, u.email, hashed, JSON.stringify(u.roles)],
      );
      console.log(`Seeded ${u.email}`);
    }
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
