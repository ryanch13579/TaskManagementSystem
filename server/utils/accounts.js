import bcrypt from "bcrypt";

// Number of bcrypt salt rounds — centralized so every hash in the app uses the same cost factor.
const SALT_ROUNDS = 10;

export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,10}$/;
export const PASSWORD_RULE_MESSAGE =
  "Password must be 8-10 characters with at least one letter, number, and special character";

export const formatAccount = (row) => ({
  ...row,
  roles: typeof row.roles === "string" ? JSON.parse(row.roles) : row.roles,
  active: !!row.active,
});

export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);
