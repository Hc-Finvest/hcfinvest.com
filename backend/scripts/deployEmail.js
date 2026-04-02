/**
 * deployEmail.js
 * Connects to production via SSH and:
 *  1. Updates .env  (EMAIL_PROVIDER=resend + RESEND_API_KEY)
 *  2. Uploads new emailService.js
 *  3. Seeds email templates into MongoDB
 *  4. Restarts PM2
 *
 * Run: node scripts/deployEmail.js
 */

import { Client } from 'ssh2'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Connection config ──────────────────────────────────────────────────────
const SSH = {
  host: '206.189.142.175',
  port: 22,
  username: 'hcfinvest',
  password: 'pune@N!lesh$2025'
}

const REMOTE_BASE = '/home/hcfinvest/hcfinvest/backend'
// Confirmed correct path from recon
const NEW_RESEND_KEY = 're_JpAs5xru_GWbxUy6NaGiK9rs7DgryLhLj'

// ── Helpers ────────────────────────────────────────────────────────────────

function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err)
      let stdout = '', stderr = ''
      stream.on('data', d => { stdout += d })
      stream.stderr.on('data', d => { stderr += d })
      stream.on('close', (code) => {
        if (code !== 0 && stderr) {
          console.warn(`  ⚠ stderr: ${stderr.trim()}`)
        }
        resolve(stdout.trim())
      })
    })
  })
}

function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err)
      sftp.fastPut(localPath, remotePath, {}, (err) => {
        sftp.end()
        if (err) return reject(err)
        resolve()
      })
    })
  })
}

// ── Email templates seed script (written to server) ───────────────────────

const SEED_SCRIPT = `
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import EmailTemplate from '../models/EmailTemplate.js'
dotenv.config()

const tpls = [
  {
    name: 'OTP - Signup Verification', slug: 'otp-signup',
    subject: 'Your HC Finvest verification code: {{otp}}',
    category: 'authentication', isSystem: true,
    htmlContent: \`<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f0f0f0"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.25)"><tr><td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);padding:32px 40px;text-align:center"><h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:0.5px">HC Finvest</h1><p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:12px;letter-spacing:2px;text-transform:uppercase">Professional Trading Platform</p></td></tr><tr><td style="padding:44px 40px"><h2 style="margin:0 0 10px;color:#ffffff;font-size:22px;font-weight:700">Verify your email</h2><p style="margin:0 0 32px;color:#aaaaaa;font-size:15px;line-height:1.7">Hi <strong style="color:#fff">{{user_name}}</strong>, enter the code below to complete your registration.</p><table width="100%"><tr><td align="center" style="padding:0 0 32px"><table cellpadding="0" cellspacing="0"><tr><td style="background:#f97316;border-radius:12px;padding:22px 52px"><span style="font-size:44px;font-weight:900;letter-spacing:16px;color:#fff;font-family:'Courier New',monospace">{{otp}}</span></td></tr></table></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px"><tr><td style="background:#111;border-radius:8px;padding:14px 18px;border-left:3px solid #f97316"><p style="margin:0;color:#888;font-size:13px">⏱ This code expires in <strong style="color:#f97316">{{expiry_minutes}} minutes</strong>. Do not share it with anyone.</p></td></tr></table><p style="margin:0;color:#555;font-size:12px;text-align:center">If you did not attempt to create an account, please ignore this email.</p></td></tr><tr><td style="background:#111;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a"><p style="margin:0;color:#444;font-size:12px">© {{year}} HC Finvest. All rights reserved.</p></td></tr></table></td></tr></table></body></html>\`,
    textContent: 'Your HC Finvest OTP is: {{otp}}\\nExpires in {{expiry_minutes}} minutes. Do not share.'
  },
  {
    name: 'OTP - Login Verification', slug: 'otp-login',
    subject: '{{otp}} — your HC Finvest login code',
    category: 'authentication', isSystem: true,
    htmlContent: \`<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f0f0f0"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.25)"><tr><td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);padding:32px 40px;text-align:center"><h1 style="margin:0;color:#fff;font-size:24px;font-weight:800">HC Finvest</h1><p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:12px;letter-spacing:2px;text-transform:uppercase">Professional Trading Platform</p></td></tr><tr><td style="padding:44px 40px"><h2 style="margin:0 0 10px;color:#fff;font-size:22px;font-weight:700">Login verification</h2><p style="margin:0 0 32px;color:#aaa;font-size:15px;line-height:1.7">Hi <strong style="color:#fff">{{user_name}}</strong>, use this code to log in to your account.</p><table width="100%"><tr><td align="center" style="padding:0 0 32px"><table cellpadding="0" cellspacing="0"><tr><td style="background:#f97316;border-radius:12px;padding:22px 52px"><span style="font-size:44px;font-weight:900;letter-spacing:16px;color:#fff;font-family:'Courier New',monospace">{{otp}}</span></td></tr></table></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px"><tr><td style="background:#111;border-radius:8px;padding:14px 18px;border-left:3px solid #f97316"><p style="margin:0;color:#888;font-size:13px">⏱ Expires in <strong style="color:#f97316">{{expiry_minutes}} minutes</strong>.</p></td></tr></table><p style="margin:0;color:#555;font-size:12px;text-align:center">If you did not request this login, please secure your account immediately.</p></td></tr><tr><td style="background:#111;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a"><p style="margin:0;color:#444;font-size:12px">© {{year}} HC Finvest. All rights reserved.</p></td></tr></table></td></tr></table></body></html>\`,
    textContent: 'Your HC Finvest login OTP is: {{otp}}\\nExpires in {{expiry_minutes}} minutes.'
  },
  {
    name: 'OTP - Password Reset', slug: 'otp-password_reset',
    subject: 'Reset your HC Finvest password — code {{otp}}',
    category: 'authentication', isSystem: true,
    htmlContent: \`<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f0f0f0"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden"><tr><td style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);padding:32px 40px;text-align:center"><h1 style="margin:0;color:#fff;font-size:24px;font-weight:800">HC Finvest</h1><p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:12px;letter-spacing:2px;text-transform:uppercase">Security Alert</p></td></tr><tr><td style="padding:44px 40px"><h2 style="margin:0 0 10px;color:#fff;font-size:22px;font-weight:700">Password reset code</h2><p style="margin:0 0 32px;color:#aaa;font-size:15px;line-height:1.7">Hi <strong style="color:#fff">{{user_name}}</strong>, use this code to reset your password.</p><table width="100%"><tr><td align="center" style="padding:0 0 32px"><table cellpadding="0" cellspacing="0"><tr><td style="background:#dc2626;border-radius:12px;padding:22px 52px"><span style="font-size:44px;font-weight:900;letter-spacing:16px;color:#fff;font-family:'Courier New',monospace">{{otp}}</span></td></tr></table></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px"><tr><td style="background:#111;border-radius:8px;padding:14px 18px;border-left:3px solid #dc2626"><p style="margin:0;color:#888;font-size:13px">⏱ Expires in <strong style="color:#dc2626">{{expiry_minutes}} minutes</strong>. Never share this with anyone.</p></td></tr></table><p style="margin:0;color:#555;font-size:12px;text-align:center">If you did not request this, your password remains unchanged.</p></td></tr><tr><td style="background:#111;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a"><p style="margin:0;color:#444;font-size:12px">© {{year}} HC Finvest. All rights reserved.</p></td></tr></table></td></tr></table></body></html>\`,
    textContent: 'Your HC Finvest password reset OTP is: {{otp}}\\nExpires in {{expiry_minutes}} minutes.'
  },
  {
    name: 'Welcome Email', slug: 'welcome',
    subject: 'Welcome to HC Finvest, {{user_name}}! Your account is ready 🎉',
    category: 'transactional', isSystem: true,
    htmlContent: \`<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f0f0f0"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.25)"><tr><td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);padding:36px 40px;text-align:center"><h1 style="margin:0;color:#fff;font-size:26px;font-weight:800">HC Finvest</h1><p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:2px;text-transform:uppercase">Professional Trading Platform</p></td></tr><tr><td style="padding:44px 40px"><h2 style="margin:0 0 12px;color:#fff;font-size:24px;font-weight:700">Welcome aboard, {{user_name}}! 🎉</h2><p style="margin:0 0 28px;color:#aaa;font-size:15px;line-height:1.8">Your account is all set. You are now part of a professional trading community trusted by thousands of traders.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px"><tr><td style="background:#111;border-radius:10px;padding:18px 22px;border-left:4px solid #f97316"><p style="margin:0 0 5px;color:#f97316;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Registered Account</p><p style="margin:0;color:#ddd;font-size:15px">{{email}}</p></td></tr></table><table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom:32px"><tr><td width="32%" style="background:#1e1e1e;border-radius:10px;padding:18px 12px;text-align:center;border:1px solid #2a2a2a"><p style="margin:0 0 8px;font-size:24px">📈</p><p style="margin:0;color:#fff;font-size:12px;font-weight:700">Live Trading</p><p style="margin:4px 0 0;color:#666;font-size:11px">Real-time markets</p></td><td width="4%"></td><td width="32%" style="background:#1e1e1e;border-radius:10px;padding:18px 12px;text-align:center;border:1px solid #2a2a2a"><p style="margin:0 0 8px;font-size:24px">🏆</p><p style="margin:0;color:#fff;font-size:12px;font-weight:700">Prop Trading</p><p style="margin:4px 0 0;color:#666;font-size:11px">Funded challenges</p></td><td width="4%"></td><td width="28%" style="background:#1e1e1e;border-radius:10px;padding:18px 12px;text-align:center;border:1px solid #2a2a2a"><p style="margin:0 0 8px;font-size:24px">💼</p><p style="margin:0;color:#fff;font-size:12px;font-weight:700">Copy Trading</p><p style="margin:4px 0 0;color:#666;font-size:11px">Follow masters</p></td></tr></table><p style="margin:0;color:#666;font-size:13px;line-height:1.8">Questions? Contact us at <a href="mailto:support@heddgecapitals.com" style="color:#f97316;text-decoration:none;font-weight:600">support@heddgecapitals.com</a></p></td></tr><tr><td style="background:#111;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a"><p style="margin:0;color:#444;font-size:12px">© {{year}} HC Finvest. All rights reserved.</p><p style="margin:6px 0 0;color:#333;font-size:11px">This is an automated message. Please do not reply.</p></td></tr></table></td></tr></table></body></html>\`,
    textContent: 'Welcome to HC Finvest, {{user_name}}!\\nYour account ({{email}}) is ready.\\nSupport: support@heddgecapitals.com'
  },
  {
    name: 'Password Reset Link', slug: 'password-reset',
    subject: 'Reset your HC Finvest password',
    category: 'transactional', isSystem: true,
    htmlContent: \`<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f0f0f0"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden"><tr><td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);padding:32px 40px;text-align:center"><h1 style="margin:0;color:#fff;font-size:24px;font-weight:800">HC Finvest</h1></td></tr><tr><td style="padding:44px 40px"><h2 style="margin:0 0 12px;color:#fff;font-size:22px;font-weight:700">Password reset request</h2><p style="margin:0 0 32px;color:#aaa;font-size:15px;line-height:1.7">Hi <strong style="color:#fff">{{user_name}}</strong>, click the button below to reset your password. This link expires in {{expiry_minutes}} minutes.</p><table width="100%"><tr><td align="center" style="padding:0 0 32px"><a href="{{reset_url}}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:16px 44px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.5px">Reset Password</a></td></tr></table><p style="margin:0;color:#555;font-size:12px;text-align:center">If you did not request a password reset, you can safely ignore this email.</p></td></tr><tr><td style="background:#111;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a"><p style="margin:0;color:#444;font-size:12px">© {{year}} HC Finvest. All rights reserved.</p></td></tr></table></td></tr></table></body></html>\`,
    textContent: 'Reset your HC Finvest password:\\n{{reset_url}}\\nExpires in {{expiry_minutes}} minutes.'
  }
]

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')
  let created = 0, updated = 0
  for (const t of tpls) {
    const exists = await EmailTemplate.findOne({ slug: t.slug })
    if (exists) {
      await EmailTemplate.updateOne({ slug: t.slug }, { $set: t })
      console.log('Updated:', t.slug); updated++
    } else {
      await EmailTemplate.create(t)
      console.log('Created:', t.slug); created++
    }
  }
  console.log('Seed complete:', created, 'created,', updated, 'updated')
  process.exit(0)
}
seed().catch(e => { console.error(e.message); process.exit(1) })
`

// ── Main deploy ────────────────────────────────────────────────────────────

async function deploy() {
  const conn = new Client()

  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      console.log('\n✅ SSH Connected to production\n')

      try {
        // ── 1. Read current .env ──────────────────────────────────────────
        console.log('📄 Reading current .env...')
        const currentEnv = await runCommand(conn, `cat ${REMOTE_BASE}/.env`)
        console.log('Current email config:')
        currentEnv.split('\n')
          .filter(l => l.includes('EMAIL') || l.includes('RESEND') || l.includes('POSTMARK') || l.includes('SMTP'))
          .forEach(l => console.log(' ', l))

        // ── 2. Update .env ────────────────────────────────────────────────
        console.log('\n📝 Updating .env on production...')

        // Set EMAIL_PROVIDER=resend
        await runCommand(conn, `sed -i 's/EMAIL_PROVIDER=.*/EMAIL_PROVIDER=resend/' ${REMOTE_BASE}/.env`)

        // Update or add RESEND_API_KEY
        await runCommand(conn, `
          if grep -q "RESEND_API_KEY" ${REMOTE_BASE}/.env; then
            sed -i 's|RESEND_API_KEY=.*|RESEND_API_KEY=${NEW_RESEND_KEY}|' ${REMOTE_BASE}/.env
          else
            echo "RESEND_API_KEY=${NEW_RESEND_KEY}" >> ${REMOTE_BASE}/.env
          fi
        `)

        // Remove postmark
        await runCommand(conn, `sed -i '/POSTMARK_API_KEY/d' ${REMOTE_BASE}/.env`)

        const updatedLines = await runCommand(conn, `grep -E "EMAIL_PROVIDER|RESEND_API_KEY|POSTMARK" ${REMOTE_BASE}/.env`)
        console.log('✅ .env updated:')
        console.log(updatedLines)

        // ── 3. Upload emailService.js ─────────────────────────────────────
        console.log('\n📤 Uploading emailService.js...')
        const localEmailService = path.join(__dirname, '../services/emailService.js')
        const remoteEmailService = `${REMOTE_BASE}/services/emailService.js`

        await uploadFile(conn, localEmailService, remoteEmailService)
        console.log('✅ emailService.js uploaded')

        // ── 4. Write seed script ──────────────────────────────────────────
        console.log('\n📤 Writing seed script...')
        // Write using printf to avoid heredoc quoting issues
        const escapedSeed = SEED_SCRIPT.replace(/'/g, "'\\''")
        await runCommand(conn, `cat > ${REMOTE_BASE}/scripts/seedEmailTemplates.js << 'ENDSEED'\n${SEED_SCRIPT}\nENDSEED`)
        console.log('✅ Seed script written')

        // ── 5. Run seed script ────────────────────────────────────────────
        console.log('\n🌱 Seeding email templates...')
        const seedOut = await runCommand(conn, `cd ${REMOTE_BASE} && node scripts/seedEmailTemplates.js`)
        console.log(seedOut)

        // ── 6. Restart PM2 ────────────────────────────────────────────────
        console.log('\n🔄 Restarting PM2...')
        const pm2Out = await runCommand(conn, 'pm2 restart all --no-color && pm2 list --no-color')
        console.log(pm2Out)

        // ── 7. Verify ─────────────────────────────────────────────────────
        console.log('\n✅ Checking PM2 logs (last 10 lines)...')
        const logs = await runCommand(conn, 'pm2 logs --lines 10 --no-color 2>&1 | tail -20')
        console.log(logs)

        console.log('\n🎉 Deployment complete!')
        console.log('   • EMAIL_PROVIDER=resend')
        console.log('   • emailService.js deployed')
        console.log('   • Email templates seeded')
        console.log('   • PM2 restarted')

      } catch (err) {
        console.error('❌ Deploy error:', err.message)
        reject(err)
      } finally {
        conn.end()
        resolve()
      }
    })

    conn.on('error', (err) => {
      console.error('SSH connection error:', err.message)
      reject(err)
    })

    conn.connect(SSH)
  })
}

deploy().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
