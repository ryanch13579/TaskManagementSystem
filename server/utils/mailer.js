import nodemailer from "nodemailer";

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

export const sendMail = async ({ to, subject, text }) => {
  if (!to) return;

  if (!process.env.SMTP_HOST) {
    console.log(
      `[mailer] SMTP not configured - would send to ${to}: ${subject}\n${text}`,
    );
    return;
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
};
