// Seed default email templates
// Run: node scripts/seedEmailTemplates.js

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import EmailTemplate from '../models/EmailTemplate.js'

dotenv.config()

const defaultTemplates = [
  {
    name: 'OTP - Signup',
    slug: 'otp-signup',
    subject: 'Your Verification Code - {{app_name}}',
    category: 'authentication',
    isSystem: true,
    description: 'OTP email sent during user signup',
    placeholders: [
      { key: 'otp', description: 'The 6-digit OTP code', example: '123456' },
      { key: 'app_name', description: 'Application name', example: 'HCF Invest' },
      { key: 'expiry_minutes', description: 'OTP expiry time in minutes', example: '10' }
    ],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Verify Your Email</h2>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                Use the following OTP to complete your registration. This code is valid for <strong>{{expiry_minutes}} minutes</strong>.
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #f97316;">{{otp}}</span>
              </div>
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: 'OTP - Password Reset',
    slug: 'otp-password_reset',
    subject: 'Password Reset OTP - {{app_name}}',
    category: 'authentication',
    isSystem: true,
    description: 'OTP email sent for password reset',
    placeholders: [
      { key: 'otp', description: 'The 6-digit OTP code', example: '123456' },
      { key: 'app_name', description: 'Application name', example: 'HCF Invest' },
      { key: 'expiry_minutes', description: 'OTP expiry time in minutes', example: '10' }
    ],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Password Reset</h2>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                Use the following OTP to reset your password. This code is valid for <strong>{{expiry_minutes}} minutes</strong>.
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #f97316;">{{otp}}</span>
              </div>
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email or contact support.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: 'Welcome Email',
    slug: 'welcome',
    subject: 'Welcome to {{app_name}}! 🎉',
    category: 'transactional',
    isSystem: true,
    description: 'Welcome email sent after successful registration',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email address', example: 'john@example.com' },
      { key: 'app_name', description: 'Application name', example: 'HCF Invest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Welcome, {{user_name}}! 🎉</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for joining {{app_name}}! We're thrilled to have you on board.
              </p>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Your account has been successfully created. You can now access all our features and start your trading journey.
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px; color: #333333; font-size: 16px;">What's Next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                  <li>Complete your profile</li>
                  <li>Add funds to your wallet</li>
                  <li>Start trading</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{frontend_url}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Get Started
                </a>
              </div>
              <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">
                If you have any questions, our support team is here to help.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: 'Password Reset Link',
    slug: 'password-reset',
    subject: 'Reset Your Password - {{app_name}}',
    category: 'authentication',
    isSystem: true,
    description: 'Password reset link email',
    placeholders: [
      { key: 'reset_url', description: 'Password reset URL', example: 'https://example.com/reset?token=xxx' },
      { key: 'expiry_minutes', description: 'Link expiry time in minutes', example: '60' },
      { key: 'app_name', description: 'Application name', example: 'HCF Invest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{reset_url}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                This link will expire in <strong>{{expiry_minutes}} minutes</strong>.
              </p>
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email or contact support.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: 'Deposit Confirmation',
    slug: 'deposit-confirmation',
    subject: 'Deposit Confirmed - {{app_name}}',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a deposit is confirmed',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'amount', description: 'Deposit amount', example: '$1,000' },
      { key: 'transaction_id', description: 'Transaction ID', example: 'TXN123456' },
      { key: 'app_name', description: 'Application name', example: 'HCF Invest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Deposit Confirmed ✓</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Hi {{user_name}}, your deposit has been successfully processed.
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #666666; font-size: 14px;">Amount:</td>
                    <td style="padding: 10px 0; color: #22c55e; font-size: 18px; font-weight: 600; text-align: right;">{{amount}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666666; font-size: 14px; border-top: 1px solid #eee;">Transaction ID:</td>
                    <td style="padding: 10px 0; color: #333333; font-size: 14px; text-align: right; border-top: 1px solid #eee;">{{transaction_id}}</td>
                  </tr>
                </table>
              </div>
              <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">
                The funds are now available in your wallet.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: 'Withdrawal Confirmation',
    slug: 'withdrawal-confirmation',
    subject: 'Withdrawal Processed - {{app_name}}',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a withdrawal is processed',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'amount', description: 'Withdrawal amount', example: '$500' },
      { key: 'transaction_id', description: 'Transaction ID', example: 'TXN123456' },
      { key: 'app_name', description: 'Application name', example: 'HCF Invest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Withdrawal Processed</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Hi {{user_name}}, your withdrawal request has been processed.
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #666666; font-size: 14px;">Amount:</td>
                    <td style="padding: 10px 0; color: #f97316; font-size: 18px; font-weight: 600; text-align: right;">{{amount}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666666; font-size: 14px; border-top: 1px solid #eee;">Transaction ID:</td>
                    <td style="padding: 10px 0; color: #333333; font-size: 14px; text-align: right; border-top: 1px solid #eee;">{{transaction_id}}</td>
                  </tr>
                </table>
              </div>
              <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">
                The funds will be credited to your bank account within 1-3 business days.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
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
]

async function seedTemplates() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcf'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    for (const template of defaultTemplates) {
      const existing = await EmailTemplate.findOne({ slug: template.slug })
      if (existing) {
        console.log(`Template already exists: ${template.slug}`)
        continue
      }

      await EmailTemplate.create(template)
      console.log(`Created template: ${template.slug}`)
    }

    console.log('\n✅ Email templates seeded successfully!')
    await mongoose.disconnect()
    process.exit(0)

  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

seedTemplates()
