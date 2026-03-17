import Review from "../models/Review.js";

// @desc    Create a review
// @route   POST /api/reviews
// @access  Public
export const createReview = async (req, res) => {
  try {
    const { name, email, rating, description } = req.body;

    const review = await Review.create({
      name,
      email,
      rating,
      description,
      image: `https://i.pravatar.cc/150?u=${email}`,
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

