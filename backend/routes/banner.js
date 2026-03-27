// import express from 'express'
// import Banner from '../models/Banner.js'
// import { adminMiddleware } from '../middleware/auth.js'

// const router = express.Router()

// // ==================== PUBLIC ROUTES ====================

// // Get active banners for client dashboard
// router.get('/active', async (req, res) => {
//   try {
//     const { position } = req.query
//     const banners = await Banner.getActiveBanners(position || null)
//     res.json({ success: true, banners })
//   } catch (error) {
//     console.error('Error fetching active banners:', error)
//     res.status(500).json({ success: false, message: error.message })
//   }
// })

// // ==================== ADMIN ROUTES ====================

// // Get all banners (admin)
// router.get('/', adminMiddleware, async (req, res) => {
//   try {
//     const { isActive, position } = req.query
//     const filter = {}
    
//     if (isActive !== undefined) filter.isActive = isActive === 'true'
//     if (position) filter.position = position

//     const banners = await Banner.find(filter)
//       .sort({ priority: -1, createdAt: -1 })
//       .populate('createdBy', 'email name')

//     res.json({ success: true, banners })
//   } catch (error) {
//     console.error('Error fetching banners:', error)
//     res.status(500).json({ success: false, message: error.message })
//   }
// })

// // Get single banner
// router.get('/:id', adminMiddleware, async (req, res) => {
//   try {
//     const banner = await Banner.findById(req.params.id)
//     if (!banner) {
//       return res.status(404).json({ success: false, message: 'Banner not found' })
//     }
//     res.json({ success: true, banner })
//   } catch (error) {
//     console.error('Error fetching banner:', error)
//     res.status(500).json({ success: false, message: error.message })
//   }
// })

// // Create banner
// router.post('/', adminMiddleware, async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       imageUrl,
//       linkUrl,
//       linkText,
//       backgroundColor,
//       textColor,
//       position,
//       priority,
//       isActive,
//       startDate,
//       endDate,
//       targetAudience
//     } = req.body

//     if (!title) {
//       return res.status(400).json({ success: false, message: 'Title is required' })
//     }

//     const banner = await Banner.create({
//       title,
//       description,
//       imageUrl,
//       linkUrl,
//       linkText,
//       backgroundColor,
//       textColor,
//       position,
//       priority: priority || 0,
//       isActive: isActive !== false,
//       startDate: startDate || null,
//       endDate: endDate || null,
//       targetAudience,
//       createdBy: req.admin?._id
//     })

//     res.status(201).json({ success: true, banner })
//   } catch (error) {
//     console.error('Error creating banner:', error)
//     res.status(500).json({ success: false, message: error.message })
//   }
// })

// // Update banner
// router.put('/:id', adminMiddleware, async (req, res) => {
//   try {
//     const banner = await Banner.findById(req.params.id)
//     if (!banner) {
//       return res.status(404).json({ success: false, message: 'Banner not found' })
//     }

//     const {
//       title,
//       description,
//       imageUrl,
//       linkUrl,
//       linkText,
//       backgroundColor,
//       textColor,
//       position,
//       priority,
//       isActive,
//       startDate,
//       endDate,
//       targetAudience
//     } = req.body

//     Object.assign(banner, {
//       title: title !== undefined ? title : banner.title,
//       description: description !== undefined ? description : banner.description,
//       imageUrl: imageUrl !== undefined ? imageUrl : banner.imageUrl,
//       linkUrl: linkUrl !== undefined ? linkUrl : banner.linkUrl,
//       linkText: linkText !== undefined ? linkText : banner.linkText,
//       backgroundColor: backgroundColor !== undefined ? backgroundColor : banner.backgroundColor,
//       textColor: textColor !== undefined ? textColor : banner.textColor,
//       position: position !== undefined ? position : banner.position,
//       priority: priority !== undefined ? priority : banner.priority,
//       isActive: isActive !== undefined ? isActive : banner.isActive,
//       startDate: startDate !== undefined ? startDate : banner.startDate,
//       endDate: endDate !== undefined ? endDate : banner.endDate,
//       targetAudience: targetAudience !== undefined ? targetAudience : banner.targetAudience
//     })

//     await banner.save()

//     res.json({ success: true, banner })
//   } catch (error) {
//     console.error('Error updating banner:', error)
//     res.status(500).json({ success: false, message: error.message })
//   }
// })

// // Delete banner
// router.delete('/:id', adminMiddleware, async (req, res) => {
//   try {
//     const banner = await Banner.findById(req.params.id)
//     if (!banner) {
//       return res.status(404).json({ success: false, message: 'Banner not found' })
//     }

//     await banner.deleteOne()

//     res.json({ success: true, message: 'Banner deleted successfully' })
//   } catch (error) {
//     console.error('Error deleting banner:', error)
//     res.status(500).json({ success: false, message: error.message })
//   }
// })

// // Toggle banner active status
// router.patch('/:id/toggle', adminMiddleware, async (req, res) => {
//   try {
//     const banner = await Banner.findById(req.params.id)
//     if (!banner) {
//       return res.status(404).json({ success: false, message: 'Banner not found' })
//     }

//     banner.isActive = !banner.isActive
//     await banner.save()

//     res.json({ success: true, banner, message: `Banner ${banner.isActive ? 'activated' : 'deactivated'}` })
//   } catch (error) {
//     console.error('Error toggling banner:', error)
//     res.status(500).json({ success: false, message: error.message })
//   }
// })

// export default router


import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Banner from "../models/Banner.js";

const router = express.Router();


// ===============================
// Ensure Upload Folder Exists
// ===============================

const uploadPath = "uploads/banners";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}


// ===============================
// Multer Storage
// ===============================

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }

});

const upload = multer({ storage });



// ===============================
// CREATE BANNER
// ===============================

router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const { title, desc, highlight } = req.body;

    const banner = new Banner({
      title,
      desc,
      highlight,
      image: req.file.filename
    });

    await banner.save();

    res.json({
      success: true,
      data: banner
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// ===============================
// GET ALL BANNERS
// ===============================

router.get("/getall", async (req, res) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: banners
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// ===============================
// DELETE BANNER
// ===============================

router.delete("/delete/:id", async (req, res) => {

  try {

    await Banner.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Banner deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});


export default router;