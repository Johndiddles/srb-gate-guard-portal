import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
): Promise<void> {
  const from = process.env.SMTP_USER;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  await transporter.sendMail({
    from,
    to,
    subject: "Reset your Gate Guard Cloud Portal password",
    text: [
      "You requested a password reset for your Cloud Portal account.",
      "",
      `Open this link to choose a new password (valid for 1 hour):`,
      resetLink,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <p>You requested a password reset for your Cloud Portal account.</p>
      <p><a href="${resetLink}">Reset your password</a></p>
      <p>This link expires in one hour.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `.trim(),
  });
}
