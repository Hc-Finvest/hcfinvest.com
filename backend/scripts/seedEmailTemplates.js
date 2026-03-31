/**
 * Seed default email templates into MongoDB.
 * Run once: node scripts/seedEmailTemplates.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import EmailTemplate from '../models/EmailTemplate.js'

dotenv.config()

const APP_NAME = process.env.APP_NAME || 'HC Finvest'
const PRIMARY_COLOR = '#f97316'
const BG_COLOR = '#0f0f0f'

// ─── Shared layout wrapper ────────────────────────────────────────────────────
const layout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.3);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:1px;">${APP_NAME}</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Professional Trading Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#111;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a;">
              <p style="margin:0;color:#666;font-size:12px;">© {{year}} ${APP_NAME}. All rights reserved.</p>
              <p style="margin:6px 0 0;color:#555;font-size:11px;">This is an automated email. Please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

// ─── Templates ────────────────────────────────────────────────────────────────

const templates = [

  // ── OTP: Signup ──
  {
    name: 'OTP - Signup Verification',
    slug: 'otp-signup',
    subject: 'Verify your email — {{otp}} is your {{app_name}} code',
    category: 'authentication',
    description: 'OTP email sent during user signup',
    isSystem: true,
    placeholders: [
      { key: 'otp', description: 'One-time password', example: '482910' },
      { key: 'user_name', description: 'User first name', example: 'Sanket' },
      { key: 'expiry_minutes', description: 'OTP validity in minutes', example: '10' },
      { key: 'year', description: 'Current year', example: '2025' }
    ],
    htmlContent: layout(`
      <h2 style="margin:0 0 8px;color:#fff;font-size:22px;">Verify your email address</h2>
      <p style="margin:0 0 28px;color:#aaa;font-size:15px;line-height:1.6;">
        Hi <strong style="color:#fff;">{{user_name}}</strong>, use the code below to complete your registration on ${APP_NAME}.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:8px 0 32px;">
            <div style="display:inline-block;background:#f97316;border-radius:10px;padding:20px 48px;">
              <span style="font-size:42px;font-weight:800;letter-spacing:14px;color:#fff;font-family:monospace;">{{otp}}</span>
            </div>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;color:#888;font-size:13px;text-align:center;">
        ⏱ This code expires in <strong style="color:#f97316;">{{expiry_minutes}} minutes</strong>.
      </p>
      <p style="margin:0;color:#666;font-size:12px;text-align:center;">
        If you did not attempt to sign up, please ignore this email.
      </p>
    `),
    textContent: 'Your {{app_name}} signup OTP is: {{otp}}\nThis code expires in {{expiry_minutes}} minutes.\nDo not share this code with anyone.'
  },

  // ── OTP: Login ──
  {
    name: 'OTP - Login Verification',
    slug: 'otp-login',
    subject: '{{otp}} — your {{app_name}} login code',
    category: 'authentication',
    description: 'OTP email sent during login',
    isSystem: true,
    placeholders: [
      { key: 'otp', description: 'One-time password', example: '391027' },
      { key: 'user_name', description: 'User first name', example: 'Sanket' },
      { key: 'expiry_minutes', description: 'OTP validity in minutes', example: '10' }
    ],
    htmlContent: layout(`
      <h2 style="margin:0 0 8px;color:#fff;font-size:22px;">Login verification code</h2>
      <p style="margin:0 0 28px;color:#aaa;font-size:15px;line-height:1.6;">
        Hi <strong style="color:#fff;">{{user_name}}</strong>, here is your login code for ${APP_NAME}.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:8px 0 32px;">
            <div style="display:inline-block;background:#f97316;border-radius:10px;padding:20px 48px;">
              <span style="font-size:42px;font-weight:800;letter-spacing:14px;color:#fff;font-family:monospace;">{{otp}}</span>
            </div>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;color:#888;font-size:13px;text-align:center;">
        ⏱ Expires in <strong style="color:#f97316;">{{expiry_minutes}} minutes</strong>.
      </p>
      <p style="margin:0;color:#666;font-size:12px;text-align:center;">
        If you did not request this, secure your account immediately.
      </p>
    `),
    textContent: 'Your {{app_name}} login OTP is: {{otp}}\nExpires in {{expiry_minutes}} minutes. Never share this code.'
  },

  // ── OTP: Password Reset ──
  {
    name: 'OTP - Password Reset',
    slug: 'otp-password_reset',
    subject: 'Reset your {{app_name}} password — code {{otp}}',
    category: 'authentication',
    description: 'OTP email for password reset',
    isSystem: true,
    placeholders: [
      { key: 'otp', description: 'One-time password', example: '748302' },
      { key: 'user_name', description: 'User first name', example: 'Sanket' },
      { key: 'expiry_minutes', description: 'OTP validity in minutes', example: '10' }
    ],
    htmlContent: layout(`
      <h2 style="margin:0 0 8px;color:#fff;font-size:22px;">Password reset request</h2>
      <p style="margin:0 0 28px;color:#aaa;font-size:15px;line-height:1.6;">
        Hi <strong style="color:#fff;">{{user_name}}</strong>, use this code to reset your ${APP_NAME} password.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:8px 0 32px;">
            <div style="display:inline-block;background:#dc2626;border-radius:10px;padding:20px 48px;">
              <span style="font-size:42px;font-weight:800;letter-spacing:14px;color:#fff;font-family:monospace;">{{otp}}</span>
            </div>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;color:#888;font-size:13px;text-align:center;">
        ⏱ This code expires in <strong style="color:#dc2626;">{{expiry_minutes}} minutes</strong>.
      </p>
      <p style="margin:0;color:#666;font-size:12px;text-align:center;">
        If you did not request a password reset, please ignore this email. Your password is safe.
      </p>
    `),
    textContent: 'Your {{app_name}} password reset OTP is: {{otp}}\nExpires in {{expiry_minutes}} minutes. Do not share.'
  },

  // ── Welcome ──
  {
    name: 'Welcome Email',
    slug: 'welcome',
    subject: 'Welcome to {{app_name}}, {{user_name}}! 🎉',
    category: 'transactional',
    description: 'Welcome email sent after successful registration',
    isSystem: true,
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'Sanket' },
      { key: 'email', description: 'User email', example: 'sanket@example.com' }
    ],
    htmlContent: layout(`
      <h2 style="margin:0 0 8px;color:#fff;font-size:24px;">Welcome aboard, {{user_name}}! 🎉</h2>
      <p style="margin:0 0 24px;color:#aaa;font-size:15px;line-height:1.7;">
        Your ${APP_NAME} account is ready. You're now part of a professional trading community.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:#222;border-radius:8px;padding:20px 24px;border-left:4px solid #f97316;">
            <p style="margin:0 0 6px;color:#f97316;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your account</p>
            <p style="margin:0;color:#ddd;font-size:15px;">{{email}}</p>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr>
          <td width="32%" style="background:#1e1e1e;border-radius:8px;padding:16px;text-align:center;border:1px solid #2a2a2a;">
            <p style="margin:0 0 4px;font-size:20px;">📈</p>
            <p style="margin:0;color:#fff;font-size:12px;font-weight:600;">Live Trading</p>
          </td>
          <td width="4%"></td>
          <td width="32%" style="background:#1e1e1e;border-radius:8px;padding:16px;text-align:center;border:1px solid #2a2a2a;">
            <p style="margin:0 0 4px;font-size:20px;">🏆</p>
            <p style="margin:0;color:#fff;font-size:12px;font-weight:600;">Prop Trading</p>
          </td>
          <td width="4%"></td>
          <td width="28%" style="background:#1e1e1e;border-radius:8px;padding:16px;text-align:center;border:1px solid #2a2a2a;">
            <p style="margin:0 0 4px;font-size:20px;">💼</p>
            <p style="margin:0;color:#fff;font-size:12px;font-weight:600;">Copy Trading</p>
          </td>
        </tr>
      </table>
      <p style="margin:0;color:#666;font-size:13px;line-height:1.6;">
        Need help? Contact us at <a href="mailto:support@heddgecapitals.com" style="color:#f97316;text-decoration:none;">support@heddgecapitals.com</a>
      </p>
    `),
    textContent: 'Welcome to {{app_name}}, {{user_name}}!\n\nYour account ({{email}}) is ready.\n\nStart trading now at hcfinvest.com\n\nNeed help? Email support@heddgecapitals.com'
  },

  // ── Password Reset (link-based) ──
  {
    name: 'Password Reset Link',
    slug: 'password-reset',
    subject: 'Reset your {{app_name}} password',
    category: 'transactional',
    description: 'Password reset email with reset link',
    isSystem: true,
    placeholders: [
      { key: 'reset_url', description: 'Password reset URL', example: 'https://hcfinvest.com/reset?token=abc' },
      { key: 'expiry_minutes', description: 'Link validity in minutes', example: '60' },
      { key: 'user_name', description: 'User first name', example: 'Sanket' }
    ],
    htmlContent: layout(`
      <h2 style="margin:0 0 8px;color:#fff;font-size:22px;">Reset your password</h2>
      <p style="margin:0 0 28px;color:#aaa;font-size:15px;line-height:1.6;">
        Hi <strong style="color:#fff;">{{user_name}}</strong>, we received a request to reset your ${APP_NAME} password. 
        Click the button below to set a new one.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="{{reset_url}}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:700;">
              Reset Password
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;color:#888;font-size:13px;text-align:center;">
        This link expires in <strong style="color:#f97316;">{{expiry_minutes}} minutes</strong>.
      </p>
      <p style="margin:0;color:#666;font-size:12px;text-align:center;">
        If you did not request this, please ignore this email. Your password will not change.
      </p>
    `),
    textContent: 'Reset your {{app_name}} password:\n{{reset_url}}\n\nThis link expires in {{expiry_minutes}} minutes.\nIf you did not request this, ignore this email.'
  }
]

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    let created = 0
    let updated = 0

    for (const tpl of templates) {
      const existing = await EmailTemplate.findOne({ slug: tpl.slug })
      if (existing) {
        await EmailTemplate.updateOne({ slug: tpl.slug }, tpl)
        console.log(`🔄 Updated: ${tpl.slug}`)
        updated++
      } else {
        await EmailTemplate.create(tpl)
        console.log(`✅ Created: ${tpl.slug}`)
        created++
      }
    }

    console.log(`\n📧 Email templates seeded — ${created} created, ${updated} updated`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  }
}

seed()
