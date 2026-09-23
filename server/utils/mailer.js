import nodemailer from "nodemailer";

// Built lazily (not at import time) so a missing/incomplete SMTP config
// doesn't crash the whole server on startup - it only matters once an email
// actually needs to go out.
let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return transporter;
};

// Sends a real email once SMTP_HOST is configured in .env; until then it
// just logs what would have been sent, so the notification flow can be
// built/tested before real SMTP credentials (and real user emails - see the
// seed data in database/setup.sql) are in place.
export const sendMail = async ({ to, subject, text }) => {
  if (!to) return;

  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] SMTP not configured - would send to ${to}: ${subject}\n${text}`);
    return;
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
};
