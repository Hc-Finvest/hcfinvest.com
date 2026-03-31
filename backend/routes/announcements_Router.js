
// announcements_Router.js


import express from "express";
import Announcement from "../models/Announcement.js";


const router = express.Router()


// ----------------------------------------
//      Create New Announcement          
// ----------------------------------------

router.post("/create", async (req, res) => {
  try {
    const { title, description } = req.body;

    const newAnnouncement = new Announcement({
      title,
      description,
    });

    await newAnnouncement.save();

    res.status(201).json({
      message: "Announcement created successfully",
      data: newAnnouncement,
    });

  } catch (error) {

    console.log(`Error creating announcement : ${error.message}`.bgRed);
    

    res.status(500).json({ message: `Error creating announcement : ${error.message}` });
  }
});



// ----------------------------------------
//      Get All Announcements
// ----------------------------------------

// routes/user.js
/* 
router.get("/get/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });

    res.json(announcements);

  } catch (error) {
    res.status(500).json({ message: "Error fetching announcements" });
  }
});
 */

router.get("/get/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ updatedAt: -1 }); // ✅ UPDATED

    res.json(announcements);

  } catch (error) {
    res.status(500).json({ message: "Error fetching announcements" });
  }
});


// ----------------------------------------
// ✏️ UPDATE
// ----------------------------------------

router.put("/update/:id", async (req, res) => {
  try {
    const { title, description } = req.body;

    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, description },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ----------------------------------------
// 🗑 DELETE
// ----------------------------------------

router.delete("/delete/:id", async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

