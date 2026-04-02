import nodemailer from 'nodemailer'
import EmailTemplate from '../models/EmailTemplate.js'
import EmailLog from '../models/EmailLog.js'

class EmailService {
  constructor() {
    this.transporter = null
    this.initialized = false
  }

  _loadConfig() {
    this.provider = process.env.EMAIL_PROVIDER || 'resend'
    this.appName = process.env.APP_NAME || 'HC Finvest'
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'support@heddgecapitals.com'
    this.fromName = process.env.SMTP_FROM_NAME || 'HC Finvest Support'
    this.resendApiKey = process.env.RESEND_API_KEY
  }

  async initialize() {
    if (this.initialized) return
    this._loadConfig()

    // SMTP fallback setup
    if (process.env.SMTP_HOST) {
      try {
        const port = parseInt(process.env.SMTP_PORT) || 465
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure: port === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 30000
        })
      } catch (error) {
        console.error('SMTP transporter setup failed:', error.message)
      }
    }

    this.initialized = true
    console.log(`✅ Email service initialized — provider: ${this.provider}`)
  }

  // ─── Core send ────────────────────────────────────────────────────────────

  async sendEmail(options) {
    await this.initialize()

    const {
      to,
      toName,
      userId,
      subject,
      html,
      text,
      templateSlug,
      templateId,
      category = 'transactional',
      metadata = {},
      sentBy,
      ipAddress,
      userAgent
    } = options

    const emailLog = await EmailLog.create({
      recipient: { email: to, name: toName, userId },
      template: templateId,
      templateSlug,
      subject,
      htmlContent: html,
      textContent: text,
      status: 'pending',
      provider: this.provider,
      category,
      metadata,
      sentBy,
      ipAddress,
      userAgent
    })

    try {
      let result

      if (this.provider === 'resend' && this.resendApiKey) {
        result = await this._sendViaResend(options)
      } else if (this.transporter) {
        result = await this._sendViaSMTP(options)
      } else {
        throw new Error('No email provider configured. Set RESEND_API_KEY or SMTP_HOST in .env')
      }

      await EmailLog.updateStatus(emailLog._id, 'sent', {
        providerMessageId: result.messageId
      })

      console.log(`📧 Email sent via ${this.provider} → ${to}`)
      return { success: true, messageId: result.messageId, logId: emailLog._id }

    } catch (error) {
      await EmailLog.updateStatus(emailLog._id, 'failed', {
        error: {
          code: error.code,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      })

      console.error(`❌ Failed to send email to ${to}:`, error.message)
      throw error
    }
  }

  // ─── Providers ────────────────────────────────────────────────────────────

  async _sendViaResend(options) {
    const { to, toName, subject, html, text } = options

    if (!this.resendApiKey) {
      throw new Error('RESEND_API_KEY is not set in environment variables')
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: toName ? [`${toName} <${to}>`] : [to],
        subject,
        html,
        text: text || this._stripHtml(html)
      })
    })

    const data = await response.json()

    if (!response.ok) {
      const msg = data?.message || data?.name || `Resend error ${response.status}`
      throw new Error(msg)
    }

    return { messageId: data.id }
  }

  async _sendViaSMTP(options) {
    const { to, toName, subject, html, text } = options

    if (!this.transporter) {
      throw new Error('SMTP transporter is not initialized')
    }

    const info = await this.transporter.sendMail({
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      subject,
      html,
      text: text || this._stripHtml(html)
    })

    return { messageId: info.messageId }
  }

  // ─── High-level helpers ───────────────────────────────────────────────────

  async sendTemplateEmail(options) {
    const {
      to,
      toName,
      userId,
      templateSlug,
      data = {},
      category,
      metadata = {},
      sentBy,
      ipAddress,
      userAgent
    } = options

    const template = await EmailTemplate.getBySlug(templateSlug)
    if (!template) {
      throw new Error(`Email template not found: ${templateSlug}`)
    }

    const templateData = {
      app_name: this.appName,
      user_name: toName || 'User',
      email: to,
      year: new Date().getFullYear(),
      ...data
    }

    const { subject, html, text } = template.render(templateData)

    return this.sendEmail({
      to,
      toName,
      userId,
      subject,
      html,
      text,
      templateSlug,
      templateId: template._id,
      category: category || template.category,
      metadata,
      sentBy,
      ipAddress,
      userAgent
    })
  }

  async sendOTPEmail(email, otp, purpose = 'signup') {
    const purposeTexts = {
      signup: 'complete your registration',
      login: 'log in to your account',
      password_reset: 'reset your password',
      email_change: 'verify your new email address',
      verification: 'verify your email address'
    }

    const purposeText = purposeTexts[purpose] || 'verify your identity'

    try {
      return await this.sendTemplateEmail({
        to: email,
        templateSlug: `otp-${purpose}`,
        data: { otp, purpose: purposeText, expiry_minutes: 10 },
        category: 'otp'
      })
    } catch (err) {
      console.error(`🚨 Fallback in sendOTPEmail for ${email} because:`, err.message)
      return this.sendEmail({
        to: email,
        subject: `Your OTP Code - ${this.appName}`,
        html: this._getOTPEmailHTML(otp, purposeText),
        category: 'otp',
        metadata: { purpose }
      })
    }
  }

  async sendWelcomeEmail(user, password) {
    try {
      return await this.sendTemplateEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        templateSlug: 'welcome',
        data: { 
          user_name: user.firstName, 
          email: user.email,
          password: password || '********' // Use placeholder if password not provided
        },
        category: 'transactional'
      })
    } catch {
      return this.sendEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        subject: `Welcome to ${this.appName}!`,
        html: this._getWelcomeEmailHTML(user.firstName),
        category: 'transactional'
      })
    }
  }

  async sendPasswordResetEmail(email, resetToken, resetUrl) {
    try {
      return await this.sendTemplateEmail({
        to: email,
        templateSlug: 'password-reset',
        data: { reset_url: resetUrl, reset_token: resetToken, expiry_minutes: 60 },
        category: 'transactional'
      })
    } catch {
      return this.sendEmail({
        to: email,
        subject: `Password Reset - ${this.appName}`,
        html: this._getPasswordResetEmailHTML(resetUrl),
        category: 'transactional'
      })
    }
  }

  // ─── Connection check ─────────────────────────────────────────────────────

  async verifyConnection() {
    await this.initialize()

    if (this.provider === 'resend' && this.resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/domains', {
          headers: { 'Authorization': `Bearer ${this.resendApiKey}` }
        })
        if (response.ok) {
          return { success: true, message: 'Resend API is reachable and key is valid' }
        }
        return { success: false, message: `Resend returned status ${response.status}` }
      } catch (error) {
        return { success: false, message: `Resend check failed: ${error.message}` }
      }
    }

    if (this.transporter) {
      try {
        await this.transporter.verify()
        return { success: true, message: 'SMTP connection verified' }
      } catch (error) {
        return { success: false, message: `SMTP error: ${error.message}` }
      }
    }

    return { success: false, message: 'No active email provider configured' }
  }

  // ─── Fallback HTML templates ───────────────────────────────────────────────

  _stripHtml(html) {
    return (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  _getOTPEmailHTML(otp, purposeText) {
    return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.3);">
        <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:1px;">${this.appName}</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Professional Trading Platform</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 8px;color:#fff;font-size:22px;">Your Verification Code</h2>
          <p style="margin:0 0 28px;color:#aaa;font-size:15px;line-height:1.6;">Use this code to ${purposeText}:</p>
          <div style="text-align:center;margin:32px 0;">
            <div style="display:inline-block;background:#f97316;border-radius:10px;padding:20px 48px;">
              <span style="font-size:42px;font-weight:800;letter-spacing:14px;color:#fff;font-family:monospace;">${otp}</span>
            </div>
          </div>
          <p style="margin:0 0 8px;color:#888;font-size:13px;text-align:center;">⏱ This code expires in <strong style="color:#f97316;">10 minutes</strong>.</p>
        </td></tr>
        <tr><td style="background:#111;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a;">
          <p style="margin:0;color:#666;font-size:12px;">© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  }

  _getWelcomeEmailHTML(firstName) {
    return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.3);">
        <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:1px;">${this.appName}</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 8px;color:#fff;font-size:24px;">Welcome aboard, ${firstName || 'Trader'}! 🎉</h2>
          <p style="margin:0 0 24px;color:#aaa;font-size:15px;line-height:1.7;">Your account is ready. You're now part of a professional trading community.</p>
        </td></tr>
        <tr><td style="background:#111;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a;">
          <p style="margin:0;color:#666;font-size:12px;">© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  }

  _getPasswordResetEmailHTML(resetUrl) {
    return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.3);">
        <tr><td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:1px;">${this.appName}</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 8px;color:#fff;font-size:22px;">Reset your password</h2>
          <p style="margin:0 0 28px;color:#aaa;font-size:15px;line-height:1.6;">Click the button below to set a new password.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:700;">Reset Password</a>
          </div>
          <p style="margin:0 0 8px;color:#888;font-size:13px;text-align:center;">This link expires in <strong style="color:#dc2626;">60 minutes</strong>.</p>
        </td></tr>
        <tr><td style="background:#111;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a;">
          <p style="margin:0;color:#666;font-size:12px;">© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  }
}

const emailService = new EmailService()
export default emailService
