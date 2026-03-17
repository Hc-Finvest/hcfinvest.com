import express from "express";
import { getReviews, createReview } from "../Controllers/ReviewController.js";

const router = express.Router();

// Create a new registration
router.post("/", createReview);

// Get all registrations
router.get("/", getReviews);

export default router;
