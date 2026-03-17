import express from 'express'
import Carousel from '../models/Carousel.js'
import { adminMiddleware } from '../middleware/auth.js'

const router = express.Router()

// ============================================
// CAROUSEL ROUTES
// Provides CRUD operations for carousel images
// ============================================

// ============================================
// GET ALL CAROUSEL IMAGES (PUBLIC)
// Used by user dashboard to display carousel
// Returns only active images sorted by order
// ============================================
router.get('/', async (req, res) => {
  try {
    const carousels = await Carousel.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
    
    res.json({
      success: true,
      carousels
    })
  } catch (error) {
    console.error('Error fetching carousels:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================================
// GET ALL CAROUSEL IMAGES (ADMIN)
// Returns all images including inactive ones
// Used by admin panel for management
// ============================================
router.get('/admin/all', adminMiddleware, async (req, res) => {
  try {
    const carousels = await Carousel.find()
      .sort({ order: 1, createdAt: -1 })
      .populate('createdBy', 'email firstName')
    
    res.json({
      success: true,
      carousels
    })
  } catch (error) {
    console.error('Error fetching all carousels:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================================
// ADD NEW CAROUSEL IMAGE (ADMIN)
// Creates a new carousel image entry
// Required: imageUrl
// Optional: title, description, linkUrl, order, isActive
// ============================================
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { imageUrl, title, description, linkUrl, order, isActive } = req.body

    // Validate required field
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      })
    }

    // Get the highest order number and add 1 for new image
    const lastCarousel = await Carousel.findOne().sort({ order: -1 })
    const newOrder = order !== undefined ? order : (lastCarousel ? lastCarousel.order + 1 : 0)

    // Create new carousel image
    const carousel = await Carousel.create({
      imageUrl,
      title: title || '',
      description: description || '',
      linkUrl: linkUrl || '',
      order: newOrder,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.admin?._id
    })

    res.status(201).json({
      success: true,
      message: 'Carousel image added successfully',
      carousel
    })
  } catch (error) {
    console.error('Error adding carousel:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================================
// UPDATE CAROUSEL IMAGE (ADMIN)
// Updates an existing carousel image by ID
// Can update: imageUrl, title, description, linkUrl, order, isActive
// ============================================
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { imageUrl, title, description, linkUrl, order, isActive } = req.body

    // Find and update the carousel image
    const carousel = await Carousel.findByIdAndUpdate(
      id,
      {
        ...(imageUrl && { imageUrl }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true }
    )

    if (!carousel) {
      return res.status(404).json({
        success: false,
        message: 'Carousel image not found'
      })
    }

    res.json({
      success: true,
      message: 'Carousel image updated successfully',
      carousel
    })
  } catch (error) {
    console.error('Error updating carousel:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================================
// DELETE CAROUSEL IMAGE (ADMIN)
// Permanently removes a carousel image by ID
// ============================================
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const carousel = await Carousel.findByIdAndDelete(id)

    if (!carousel) {
      return res.status(404).json({
        success: false,
        message: 'Carousel image not found'
      })
    }

    res.json({
      success: true,
      message: 'Carousel image deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting carousel:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================================
// TOGGLE CAROUSEL ACTIVE STATUS (ADMIN)
// Quickly enable/disable a carousel image
// ============================================
router.patch('/:id/toggle', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const carousel = await Carousel.findById(id)
    if (!carousel) {
      return res.status(404).json({
        success: false,
        message: 'Carousel image not found'
      })
    }

    // Toggle the isActive status
    carousel.isActive = !carousel.isActive
    await carousel.save()

    res.json({
      success: true,
      message: `Carousel image ${carousel.isActive ? 'activated' : 'deactivated'} successfully`,
      carousel
    })
  } catch (error) {
    console.error('Error toggling carousel:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================================
// REORDER CAROUSEL IMAGES (ADMIN)
// Updates the order of multiple carousel images at once
// Expects: { orders: [{ id: '...', order: 0 }, { id: '...', order: 1 }] }
// ============================================
router.put('/reorder/bulk', adminMiddleware, async (req, res) => {
  try {
    const { orders } = req.body

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        message: 'Orders array is required'
      })
    }

    // Update each carousel's order
    const updatePromises = orders.map(({ id, order }) =>
      Carousel.findByIdAndUpdate(id, { order })
    )

    await Promise.all(updatePromises)

    res.json({
      success: true,
      message: 'Carousel order updated successfully'
    })
  } catch (error) {
    console.error('Error reordering carousels:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
