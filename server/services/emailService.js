const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_SECURE."
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return transporter;
}

async function sendPasswordResetEmail(recipientEmail, token) {
  const from = process.env.FROM_EMAIL || "no-reply@fitquest.local";
  const appDeepLink = `fitquest://reset-password?token=${encodeURIComponent(
    token
  )}`;

  const text = [
    "You requested a password reset.",
    "\n",
    `Token: ${token}`,
  ].join("");

  const html = `
    <p>You requested a password reset.</p>
    <p><strong>Token:</strong> ${token}</p>
    <p><a href="${appDeepLink}">Open FitQuest to reset password</a> (if your device supports deep links)</p>
    <p>If the link doesn't work, open the app, tap <em>Forgot your password?</em> and paste the token above.</p>
  `;

  const info = await getTransporter().sendMail({
    from,
    to: recipientEmail,
    subject: "FitQuest password reset",
    text,
    html,
  });

  return info;
}

module.exports = { sendPasswordResetEmail };
