import { createPortalTransporter, getPortalMailFrom } from "./transporter";

export type NewAdminUserCredentialsParams = {
  name: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
};

export async function sendNewAdminUserCredentialsEmail(
  to: string,
  params: NewAdminUserCredentialsParams,
): Promise<void> {
  const transporter = createPortalTransporter();
  const from = getPortalMailFrom();

  const { name, email, temporaryPassword, loginUrl } = params;
  const text = [
    `Hello ${name},`,
    "",
    "Welcome to Gate Guard Cloud Portal. Use the credentials below to sign in:",
    "",
    `Login page: ${loginUrl}`,
    `Email: ${email}`,
    `Temporary password: ${temporaryPassword}`,
    "",
    "You will be asked to change your password after you sign in.",
    "",
    "If you did not expect this account, contact your administrator.",
  ].join("\n");

  const html = `
    <p>Hello ${escapeHtml(name)},</p>
    <p>Welcome to Gate Guard Cloud Portal. Use the credentials below to sign in:</p>
    <p><a href="${escapeHtmlAttr(loginUrl)}">Open the login page</a></p>
    <ul>
      <li><strong>Email:</strong> ${escapeHtml(email)}</li>
      <li><strong>Temporary password:</strong> ${escapeHtml(temporaryPassword)}</li>
    </ul>
    <p>You will be asked to change your password after you sign in.</p>
    <p>If you did not expect this account, contact your administrator.</p>
  `.trim();

  await transporter.sendMail({
    from,
    to,
    subject: "Your Gate Guard Cloud Portal account",
    text,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtmlAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
