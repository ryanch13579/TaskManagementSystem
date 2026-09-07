import bcrypt from "bcrypt";
import pool from "../config/database.js";

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
      const hashed = await bcrypt.hash(u.password, 10);
      await pool.query(
        `INSERT INTO accounts (email, password, roles)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE password = VALUES(password), roles = VALUES(roles)`,
        [u.email, hashed, JSON.stringify(u.roles)],
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
