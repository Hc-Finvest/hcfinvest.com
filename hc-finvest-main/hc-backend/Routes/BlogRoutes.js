import express from "express";
import multer from "multer";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
} from "../Controllers/BlogController.js";

const router = express.Router();

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.post("/", upload.single("image"), createBlog);
router.get("/", getAllBlogs);
router.get("/:id", getBlogById); // ✅ this is the single blog route

export default router;
