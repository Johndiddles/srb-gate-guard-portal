import nodemailer from "nodemailer";

export function createPortalTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export function getPortalMailFrom(): string {
  return process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? "";
}
