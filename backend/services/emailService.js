import nodemailer from 'nodemailer'
import EmailTemplate from '../models/EmailTemplate.js'
import EmailLog from '../models/EmailLog.js'

class EmailService {
  constructor() {
    this.transporter = null
    this.initialized = false
  }

  // Load config
  _loadConfig() {
    this.provider = process.env.EMAIL_PROVIDER || 'smtp'
    this.appName = process.env.APP_NAME || 'HC Finvest'
    this.fromEmail = process.env.SMTP_FROM_EMAIL || "support@heddgecapitals.com"
    this.fromName = process.env.SMTP_FROM_NAME || 'HC Finvest Support'
  }

  async initialize() {
    if (this.initialized) return

    this._loadConfig()

    try {
      const port = parseInt(process.env.SMTP_PORT) || 465
      const isSecure = port === 465

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtppro.zoho.in',
        port: port,
        secure: isSecure,
        auth: {
          user: process.env.SMTP_USER || "support@heddgecapitals.com",
          pass: process.env.SMTP_PASS || "Jf0DLgxCEptT"
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      })

      console.log(
        `📧 Email Config: ${process.env.SMTP_HOST || 'smtppro.zoho.in'}:${port} (secure: ${isSecure})`
      )
      console.log(`📧 User: ${process.env.SMTP_USER || 'support@heddgecapitals.com'}`)
      console.log(`📧 From: ${this.fromName} <${this.fromEmail}>`)

      this.initialized = true
      console.log(`Email service initialized with provider: ${this.provider}`)
    } catch (error) {
      console.error('Failed to initialize email service:', error.message)
      throw error
    }
  }

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
      recipient: {
        email: to,
        name: toName,
        userId
      },
      template: templateId,
      templateSlug,
      subject,
      htmlContent: html,
      textContent: text,
      status: 'pending',
      provider: 'smtp',
      category,
      metadata,
      sentBy,
      ipAddress,
      userAgent
    })

    try {
      const senderEmail = this.fromEmail || process.env.SMTP_USER

      const mailOptions = {
        from: `"${this.fromName}" <${senderEmail}>`,
        to: toName ? `"${toName}" <${to}>` : to,
        subject,
        html,
        text: text || this.stripHtml(html)
      }


      const info = await this.transporter.sendMail(mailOptions)

      await EmailLog.updateStatus(emailLog._id, 'sent', {
        providerMessageId: info.messageId
      })

      console.log(`Email sent successfully to ${to}`)
      return { success: true, messageId: info.messageId, logId: emailLog._id }
    } catch (error) {
      await EmailLog.updateStatus(emailLog._id, 'failed', {
        error: {
          code: error.code,
          message: error.message,
          stack:
            process.env.NODE_ENV === 'development'
              ? error.stack
              : undefined
        }
      })

      console.error(`Failed to send email to ${to}:`, error.message)
      throw error
    }
  }

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
        data: {
          otp,
          purpose: purposeText,
          expiry_minutes: 10
        },
        category: 'otp'
      })
    } catch (templateError) {
      const html = this.getOTPEmailHTML(otp, purposeText)
      return this.sendEmail({
        to: email,
        subject: `Your OTP Code - ${this.appName}`,
        html,
        category: 'otp',
        metadata: { purpose }
      })
    }
  }

  async sendWelcomeEmail(user) {
    try {
      return await this.sendTemplateEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        templateSlug: 'welcome',
        data: {
          user_name: user.firstName,
          email: user.email
        },
        category: 'transactional'
      })
    } catch (templateError) {
      const html = this.getWelcomeEmailHTML(user.firstName)
      return this.sendEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        subject: `Welcome to ${this.appName}!`,
        html,
        category: 'transactional'
      })
    }
  }

  async sendPasswordResetEmail(email, resetToken, resetUrl) {
    try {
      return await this.sendTemplateEmail({
        to: email,
        templateSlug: 'password-reset',
        data: {
          reset_url: resetUrl,
          reset_token: resetToken,
          expiry_minutes: 60
        },
        category: 'transactional'
      })
    } catch (templateError) {
      const html = this.getPasswordResetEmailHTML(resetUrl)
      return this.sendEmail({
        to: email,
        subject: `Password Reset - ${this.appName}`,
        html,
        category: 'transactional'
      })
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  getOTPEmailHTML(otp, purposeText) {
  return `
  <div style="font-family: Arial; padding: 20px;">
    <h2>Your OTP Code</h2>
    <p>Use this code to ${purposeText}</p>
    <h1 style="color:#f97316; letter-spacing: 5px;">${otp}</h1>
    <p>This code is valid for 10 minutes.</p>
  </div>
  `
}

  async verifyConnection() {
    await this.initialize()
    try {
      await this.transporter.verify()
      return { success: true, message: 'Email service is ready' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
}

const emailService = new EmailService()
export default emailService;

