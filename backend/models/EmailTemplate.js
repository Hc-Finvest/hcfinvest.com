import mongoose from 'mongoose'

const emailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  textContent: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['authentication', 'transactional', 'marketing', 'notification', 'system'],
    default: 'transactional'
  },
  placeholders: [{
    key: String,
    description: String,
    example: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
})

// Index for faster queries (slug already has unique: true which creates an index)
emailTemplateSchema.index({ category: 1, isActive: 1 })

// Static method to get template by slug
emailTemplateSchema.statics.getBySlug = async function(slug) {
  return this.findOne({ slug, isActive: true })
}

// Method to render template with data
emailTemplateSchema.methods.render = function(data) {
  let html = this.htmlContent
  let text = this.textContent
  let subject = this.subject

  // Replace placeholders
  Object.keys(data).forEach(key => {
    const placeholder = new RegExp(`{{${key}}}`, 'g')
    html = html.replace(placeholder, data[key] || '')
    text = text.replace(placeholder, data[key] || '')
    subject = subject.replace(placeholder, data[key] || '')
  })

  return { subject, html, text }
}

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema)

export default EmailTemplate
