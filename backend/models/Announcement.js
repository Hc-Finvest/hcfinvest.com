
// Announcement.js
/* 
import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Announcement", announcementSchema);
 */


// Announcement.js

import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
  },
  { timestamps: true } // ✅ REQUIRED (adds createdAt + updatedAt)
);

export default mongoose.model("Announcement", announcementSchema);