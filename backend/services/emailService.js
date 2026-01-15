import nodemailer from 'nodemailer'
import EmailTemplate from '../models/EmailTemplate.js'
import EmailLog from '../models/EmailLog.js'

class EmailService {
  constructor() {
    this.transporter = null
    this.resendApiKey = process.env.RESEND_API_KEY
    this.provider = process.env.EMAIL_PROVIDER || 'smtp'
    this.appName = process.env.APP_NAME || 'hcfinvest'
    this.fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@hcfinvest.com'
    this.fromName = process.env.SMTP_FROM_NAME || 'hcfinvest'
    this.initialized = false
  }

  async initialize() {
    if (this.initialized) return

    try {
      switch (this.provider) {
        case 'resend':
          // Resend uses HTTP API, no transporter needed
          if (!this.resendApiKey) {
            throw new Error('RESEND_API_KEY is required for Resend provider')
          }
          console.log(`📧 Email Provider: Resend (HTTP API)`)
          console.log(`📧 From: ${this.fromName} <${this.fromEmail}>`)
          break

        case 'smtp':
        case 'zoho':
          const port = parseInt(process.env.SMTP_PORT) || 465
          const isSecure = port === 465
          
          // Zoho SMTP Configuration
          // Host: smtppro.zoho.in (India) or smtp.zoho.com (Global)
          // Port 465: SSL (secure: true)
          // Port 587: STARTTLS (secure: false)
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtppro.zoho.in',
            port: port,
            secure: isSecure,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            },
            tls: {
              rejectUnauthorized: true,
              minVersion: 'TLSv1.2'
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 60000,
            debug: true,
            logger: true
          })
          
          // Log configuration (without password)
          console.log(`📧 Email Config: ${process.env.SMTP_HOST}:${port} (secure: ${isSecure})`)
          console.log(`📧 User: ${process.env.SMTP_USER}`)
          console.log(`📧 From: ${this.fromName} <${this.fromEmail}>`)
          break

        case 'sendgrid':
          // SendGrid configuration
          this.transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            auth: {
              user: 'apikey',
              pass: process.env.SENDGRID_API_KEY
            }
          })
          break

        case 'ses':
          // AWS SES configuration
          this.transporter = nodemailer.createTransport({
            host: `email-smtp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
            port: 587,
            secure: false,
            auth: {
              user: process.env.AWS_SES_ACCESS_KEY,
              pass: process.env.AWS_SES_SECRET_KEY
            }
          })
          break

        case 'brevo':
          // Brevo (Sendinblue) configuration
          this.transporter = nodemailer.createTransport({
            host: 'smtp-relay.brevo.com',
            port: 587,
            auth: {
              user: process.env.BREVO_USER,
              pass: process.env.BREVO_API_KEY
            }
          })
          break

        default:
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          })
      }

      this.initialized = true
      console.log(`Email service initialized with provider: ${this.provider}`)
    } catch (error) {
      console.error('Failed to initialize email service:', error.message)
      throw error
    }
  }

  // Send email via Resend HTTP API
  async sendViaResend(options) {
    const { to, toName, subject, html, text } = options
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [toName ? `${toName} <${to}>` : to],
        subject,
        html,
        text: text || this.stripHtml(html)
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || `Resend API error: ${response.status}`)
    }

    return { messageId: data.id }
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

    // Create email log entry
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
      provider: this.provider,
      category,
      metadata,
      sentBy,
      ipAddress,
      userAgent
    })

    try {
      let info

      // Use Resend HTTP API if provider is 'resend'
      if (this.provider === 'resend') {
        info = await this.sendViaResend({ to, toName, subject, html, text })
      } else {
        // Use SMTP_USER as sender to avoid relay errors
        const senderEmail = process.env.SMTP_USER || this.fromEmail
        const mailOptions = {
          from: `"${this.fromName}" <${senderEmail}>`,
          to: toName ? `"${toName}" <${to}>` : to,
          subject,
          html,
          text: text || this.stripHtml(html)
        }

        // Send email via SMTP
        info = await this.transporter.sendMail(mailOptions)
      }

      // Update log with success
      await EmailLog.updateStatus(emailLog._id, 'sent', {
        providerMessageId: info.messageId
      })

      console.log(`Email sent successfully to ${to}: ${info.messageId}`)
      return { success: true, messageId: info.messageId, logId: emailLog._id }

    } catch (error) {
      // Update log with error
      await EmailLog.updateStatus(emailLog._id, 'failed', {
        error: {
          code: error.code,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

    // Get template
    const template = await EmailTemplate.getBySlug(templateSlug)
    if (!template) {
      throw new Error(`Email template not found: ${templateSlug}`)
    }

    // Add default data
    const templateData = {
      app_name: this.appName,
      user_name: toName || 'User',
      email: to,
      year: new Date().getFullYear(),
      ...data
    }

    // Render template
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

    // Try to use template, fallback to inline HTML
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
      // Fallback to inline HTML if template not found
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
      // Fallback to inline HTML
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

  // Helper method to strip HTML tags
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  // Fallback email templates
  getOTPEmailHTML(otp, purposeText) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your OTP Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${this.appName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Your Verification Code</h2>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                Use the following OTP to ${purposeText}. This code is valid for <strong>10 minutes</strong>.
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #f97316;">${otp}</span>
              </div>
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't request this code, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} ${this.appName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }

  getWelcomeEmailHTML(userName) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${this.appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${this.appName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Welcome, ${userName}! 🎉</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for joining ${this.appName}! We're excited to have you on board.
              </p>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Your account has been successfully created. You can now access all our features and start trading.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://hcfinvest.com'}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Get Started
                </a>
              </div>
              <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">
                If you have any questions, feel free to reach out to our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} ${this.appName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }

  getPasswordResetEmailHTML(resetUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${this.appName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Password Reset Request</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                This link will expire in <strong>60 minutes</strong>.
              </p>
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} ${this.appName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }

  // Verify transporter connection
  async verifyConnection() {
    await this.initialize()
    try {
      // Resend doesn't need SMTP verification
      if (this.provider === 'resend') {
        // Test Resend API by checking API key validity
        const response = await fetch('https://api.resend.com/domains', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.resendApiKey}`
          }
        })
        if (response.ok) {
          return { success: true, message: 'Resend API is ready' }
        } else {
          const data = await response.json()
          return { success: false, message: data.message || 'Resend API error' }
        }
      }
      
      await this.transporter.verify()
      return { success: true, message: 'Email service is ready' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
}

// Export singleton instance
const emailService = new EmailService()
export default emailService
