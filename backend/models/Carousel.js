import mongoose from 'mongoose'

// ============================================
// CAROUSEL MODEL
// Stores carousel/slider images for user dashboard
// Admin can add, update, delete, and reorder images
// ============================================

const carouselSchema = new mongoose.Schema({
  // Image URL - required field for the carousel image
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  
  // Title - optional text overlay on the image
  title: {
    type: String,
    default: ''
  },
  
  // Description - optional description text
  description: {
    type: String,
    default: ''
  },
  
  // Link URL - optional click-through link
  linkUrl: {
    type: String,
    default: ''
  },
  
  // Display order - for sorting carousel images
  order: {
    type: Number,
    default: 0
  },
  
  // Active status - only active images are shown
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Created by admin reference
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { 
  timestamps: true // Adds createdAt and updatedAt fields
})

export default mongoose.model('Carousel', carouselSchema)
