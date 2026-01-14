import express from 'express'
import EmailOTP from '../models/EmailOTP.js'
import EmailTemplate from '../models/EmailTemplate.js'
import EmailLog from '../models/EmailLog.js'
import User from '../models/User.js'
import emailService from '../services/emailService.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Rate limiting middleware for OTP requests
const otpRateLimiter = async (req, res, next) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' })
  }

  const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
  const recentRequests = await EmailOTP.countDocuments({
    email: email.toLowerCase(),
    createdAt: { $gte: oneMinuteAgo }
  })

  if (recentRequests >= 2) {
    return res.status(429).json({ 
      success: false, 
      message: 'Too many requests. Please wait a minute before requesting another OTP.' 
    })
  }

  next()
}

// ==================== PUBLIC ROUTES ====================

// Send OTP for signup
router.post('/send-otp', otpRateLimiter, async (req, res) => {
  try {
    const { email, purpose = 'signup' } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }

    // Check if user already exists (for signup)
    if (purpose === 'signup') {
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'An account with this email already exists' 
        })
      }
    }

    // Generate OTP
    const { otp } = await EmailOTP.createOTP(email, purpose, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    // Send OTP email
    await emailService.sendOTPEmail(email, otp, purpose)

    res.json({ 
      success: true, 
      message: 'OTP sent successfully. Please check your email.',
      expiresIn: 600 // 10 minutes in seconds
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose = 'signup' } = req.body

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      })
    }

    await EmailOTP.verifyOTP(email, otp, purpose)

    res.json({ 
      success: true, 
      message: 'OTP verified successfully',
      verified: true
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// Resend OTP
router.post('/resend-otp', otpRateLimiter, async (req, res) => {
  try {
    const { email, purpose = 'signup' } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }

    // Generate new OTP
    const { otp } = await EmailOTP.createOTP(email, purpose, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    // Send OTP email
    await emailService.sendOTPEmail(email, otp, purpose)

    res.json({ 
      success: true, 
      message: 'OTP resent successfully',
      expiresIn: 600
    })

  } catch (error) {
    console.error('Resend OTP error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// ==================== ADMIN ROUTES ====================

// Get all email templates
router.get('/templates', adminMiddleware, async (req, res) => {
  try {
    const { category, isActive } = req.query
    const filter = {}
    
    if (category) filter.category = category
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    const templates = await EmailTemplate.find(filter)
      .sort({ category: 1, name: 1 })

    res.json({ success: true, templates })

  } catch (error) {
    console.error('Get templates error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single template
router.get('/templates/:id', adminMiddleware, async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id)
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }

    res.json({ success: true, template })

  } catch (error) {
    console.error('Get template error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create email template
router.post('/templates', adminMiddleware, async (req, res) => {
  try {
    const { name, slug, subject, htmlContent, textContent, description, category, placeholders } = req.body

    if (!name || !slug || !subject || !htmlContent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, slug, subject, and HTML content are required' 
      })
    }

    const template = await EmailTemplate.create({
      name,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      subject,
      htmlContent,
      textContent,
      description,
      category,
      placeholders,
      createdBy: req.admin?._id
    })

    res.status(201).json({ success: true, template })

  } catch (error) {
    console.error('Create template error:', error)
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'A template with this name or slug already exists' 
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update email template
router.put('/templates/:id', adminMiddleware, async (req, res) => {
  try {
    const { name, slug, subject, htmlContent, textContent, description, category, placeholders, isActive } = req.body

    const template = await EmailTemplate.findById(req.params.id)
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }

    // Don't allow editing system templates' slug
    if (template.isSystem && slug && slug !== template.slug) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change slug of system templates' 
      })
    }

    Object.assign(template, {
      name: name || template.name,
      slug: slug ? slug.toLowerCase().replace(/\s+/g, '-') : template.slug,
      subject: subject || template.subject,
      htmlContent: htmlContent || template.htmlContent,
      textContent: textContent !== undefined ? textContent : template.textContent,
      description: description !== undefined ? description : template.description,
      category: category || template.category,
      placeholders: placeholders || template.placeholders,
      isActive: isActive !== undefined ? isActive : template.isActive,
      updatedBy: req.admin?._id
    })

    await template.save()

    res.json({ success: true, template })

  } catch (error) {
    console.error('Update template error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete email template
router.delete('/templates/:id', adminMiddleware, async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id)
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }

    if (template.isSystem) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete system templates' 
      })
    }

    await template.deleteOne()

    res.json({ success: true, message: 'Template deleted successfully' })

  } catch (error) {
    console.error('Delete template error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Preview template with sample data
router.post('/templates/:id/preview', adminMiddleware, async (req, res) => {
  try {
    const { data = {} } = req.body
    const template = await EmailTemplate.findById(req.params.id)
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }

    // Add default preview data
    const previewData = {
      app_name: process.env.APP_NAME || 'HCF Invest',
      user_name: 'John Doe',
      email: 'john@example.com',
      otp: '123456',
      year: new Date().getFullYear(),
      ...data
    }

    const rendered = template.render(previewData)

    res.json({ success: true, preview: rendered })

  } catch (error) {
    console.error('Preview template error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Send email to user (manual trigger)
router.post('/send', adminMiddleware, async (req, res) => {
  try {
    const { 
      userId, 
      email, 
      templateId, 
      templateSlug,
      subject,
      htmlContent,
      data = {} 
    } = req.body

    let recipientEmail = email
    let recipientName = data.user_name
    let recipientUserId = userId

    // If userId provided, get user details
    if (userId) {
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' })
      }
      recipientEmail = user.email
      recipientName = user.firstName
      recipientUserId = user._id
    }

    if (!recipientEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email or userId is required' 
      })
    }

    let result

    // If template provided, use template
    if (templateId || templateSlug) {
      result = await emailService.sendTemplateEmail({
        to: recipientEmail,
        toName: recipientName,
        userId: recipientUserId,
        templateSlug: templateSlug || (await EmailTemplate.findById(templateId))?.slug,
        data,
        category: 'manual',
        sentBy: req.admin?._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })
    } else if (subject && htmlContent) {
      // Custom email
      result = await emailService.sendEmail({
        to: recipientEmail,
        toName: recipientName,
        userId: recipientUserId,
        subject,
        html: htmlContent,
        category: 'manual',
        sentBy: req.admin?._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Either templateId/templateSlug or subject/htmlContent is required' 
      })
    }

    res.json({ success: true, message: 'Email sent successfully', ...result })

  } catch (error) {
    console.error('Send email error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get email logs
router.get('/logs', adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      category, 
      email,
      userId,
      startDate,
      endDate 
    } = req.query

    const filter = {}
    
    if (status) filter.status = status
    if (category) filter.category = category
    if (email) filter['recipient.email'] = new RegExp(email, 'i')
    if (userId) filter['recipient.userId'] = userId
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [logs, total] = await Promise.all([
      EmailLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('template', 'name slug')
        .populate('sentBy', 'email name'),
      EmailLog.countDocuments(filter)
    ])

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })

  } catch (error) {
    console.error('Get email logs error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get email stats
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const stats = await EmailLog.getStats(startDate, endDate)

    // Format stats
    const formattedStats = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      delivered: 0,
      opened: 0
    }

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count
      formattedStats.total += stat.count
    })

    res.json({ success: true, stats: formattedStats })

  } catch (error) {
    console.error('Get email stats error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Test email configuration
router.post('/test', adminMiddleware, async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }

    // Verify connection first
    const connectionStatus = await emailService.verifyConnection()
    if (!connectionStatus.success) {
      return res.status(500).json({ 
        success: false, 
        message: `Email service not configured: ${connectionStatus.message}` 
      })
    }

    // Send test email
    await emailService.sendEmail({
      to: email,
      subject: 'Test Email - HCF Invest',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>This is a test email from HCF Invest.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
      category: 'transactional'
    })

    res.json({ success: true, message: 'Test email sent successfully' })

  } catch (error) {
    console.error('Test email error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
