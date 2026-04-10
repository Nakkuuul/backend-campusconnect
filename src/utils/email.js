import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

// ── Transporter ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass, // Gmail App Password (not your account password)
  },
});

// Verify connection on startup in dev
if (env.isDev) {
  transporter.verify().then(() => logger.info('SMTP transporter ready')).catch(err => logger.error(`SMTP error: ${err.message}`));
}

// ── HTML email template ───────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CampusConnect</title>
</head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:10px;background:#13161e;border:1px solid #1e2333;border-radius:12px;padding:12px 20px;">
        <div style="width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,#4f6ef7,#22d3a5);display:inline-flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:14px;">📍</span>
        </div>
        <span style="color:#e8ecf5;font-weight:800;font-size:16px;letter-spacing:-0.02em;">
          Campus<span style="color:#4f6ef7;">Connect</span>
        </span>
      </div>
    </div>

    <!-- Card -->
    <div style="background:#13161e;border:1px solid #1e2333;border-radius:16px;overflow:hidden;">
      <div style="height:4px;background:linear-gradient(90deg,#4f6ef7,#22d3a5);"></div>
      <div style="padding:36px 32px;">
        ${content}
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;color:#4e566e;font-size:12px;margin-top:24px;line-height:1.6;">
      Bennett University · CampusConnect Lost & Found<br/>
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
`;

// ── Send verification magic link ──────────────────────────────────────────────
export const sendVerificationEmail = async ({ name, email, verificationUrl }) => {
  const firstName = name.split(' ')[0];

  const html = baseTemplate(`
    <h1 style="color:#e8ecf5;font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-0.02em;">
      Verify your email
    </h1>
    <p style="color:#8b93aa;font-size:14px;margin:0 0 28px;line-height:1.7;">
      Hi ${firstName}, you're almost in! Click the button below to verify your @bennett.edu.in email and activate your CampusConnect account.
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${verificationUrl}"
        style="display:inline-block;background:#4f6ef7;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:-0.01em;">
        Verify my email →
      </a>
    </div>

    <div style="background:#0d0f14;border:1px solid #1e2333;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
      <p style="color:#4e566e;font-size:11px;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">Or copy this link</p>
      <p style="color:#8b93aa;font-size:12px;margin:0;word-break:break-all;">${verificationUrl}</p>
    </div>

    <div style="display:flex;align-items:center;gap:8px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:12px 14px;">
      <span style="font-size:14px;">⚠️</span>
      <p style="color:#fbbf24;font-size:12px;margin:0;line-height:1.5;">
        This link expires in <strong>24 hours</strong>. After that, you'll need to request a new one.
      </p>
    </div>
  `);

  await transporter.sendMail({
    from:    env.smtpFrom,
    to:      email,
    subject: 'Verify your CampusConnect account',
    html,
  });

  logger.info(`Verification email sent to ${email}`);
};

// ── Send welcome email post-verification ─────────────────────────────────────
export const sendWelcomeEmail = async ({ name, email }) => {
  const firstName = name.split(' ')[0];

  const html = baseTemplate(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;border-radius:50%;background:rgba(34,211,165,0.12);border:2px solid rgba(34,211,165,0.3);display:inline-flex;align-items:center;justify-content:center;font-size:28px;">
        ✅
      </div>
    </div>

    <h1 style="color:#e8ecf5;font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-0.02em;text-align:center;">
      You're in, ${firstName}!
    </h1>
    <p style="color:#8b93aa;font-size:14px;margin:0 0 28px;line-height:1.7;text-align:center;">
      Your account has been verified. You can now report lost & found items, submit claims, and help reunite Bennett students with their belongings.
    </p>

    <div style="display:grid;gap:12px;margin-bottom:28px;">
      ${[
        ['🔴', 'Report a lost item', 'Let the campus know what you\'ve lost.'],
        ['🟢', 'Report a found item', 'Help someone get their belongings back.'],
        ['🔍', 'Browse items', 'See what\'s been reported across campus.'],
      ].map(([emoji, title, desc]) => `
        <div style="background:#0d0f14;border:1px solid #1e2333;border-radius:8px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;">
          <span style="font-size:18px;flex-shrink:0;">${emoji}</span>
          <div>
            <p style="color:#e8ecf5;font-size:13px;font-weight:700;margin:0 0 3px;">${title}</p>
            <p style="color:#8b93aa;font-size:12px;margin:0;">${desc}</p>
          </div>
        </div>
      `).join('')}
    </div>

    <div style="text-align:center;">
      <a href="${env.clientOrigin}/dashboard"
        style="display:inline-block;background:#4f6ef7;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">
        Go to Dashboard →
      </a>
    </div>
  `);

  await transporter.sendMail({
    from:    env.smtpFrom,
    to:      email,
    subject: `Welcome to CampusConnect, ${firstName}!`,
    html,
  });

  logger.info(`Welcome email sent to ${email}`);
};