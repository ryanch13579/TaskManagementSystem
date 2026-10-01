// "2026-09-25 10:21:00" in Singapore time - the same shape the DB returns
// DATETIME columns in (dateStrings: true), so every date the client sees
// is SG-time text. The "sv-SE" locale is what gives the yyyy-mm-dd hh:mm:ss
// layout; it's pinned to Asia/Singapore so the server's own timezone
// doesn't matter.
export const sgDateTime = (date = new Date()) =>
  date.toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });
