import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  CircularProgress,
} from "@mui/material";
import axios from "axios";

const ReviewSection = () => {
  const [reviews, setReviews] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    description: "",
    rating: 0,
  });

  const [errors, setErrors] = useState({});

  // ==============================
  // Fetch Reviews from Backend
  // ==============================
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://hcfinvest.onrender.com/api/reviews");
      setReviews(res.data.data);
    } catch (err) {
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Form Handlers
  // ==============================
  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setFormData({ name: "", email: "", description: "", rating: 0 });
    setErrors({});
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    let tempErrors = {};

    if (!formData.name.trim()) tempErrors.name = "Name is required";

    if (!formData.email.trim()) {
      tempErrors.email = "Email is required";
    }

    if (!formData.description.trim())
      tempErrors.description = "Description is required";

    if (!formData.rating)
      tempErrors.rating = "Rating is required";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // ==============================
  // Submit Review
  // ==============================
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await axios.post("https://hcfinvest.onrender.com/api/reviews", formData);
      fetchReviews(); // refresh list
      handleClose();
    } catch (err) {
      console.log(err);
    }
  };

  // ==============================
  // Smooth Horizontal Wheel Scroll
  // ==============================
  const handleWheel = (e) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <Box sx={{ bgcolor: "#fff", py: 8 , border:'0px solid red' }}>
      <Box sx={{ maxWidth: "1300px", mx: "auto", px: 3, border:'0px solid green' }}>

        {/* Header */}
        <Box textAlign="center" mb={6}>
            <Typography
              variant="h2"
              sx={{ fontSize: "39px", fontWeight: "bold" }}
            >
              <span style={{ color: "#ff8c00" }}>Customer</span> Reviews
            </Typography>
        </Box>

        {/* Add Review Button */}
        <Box display="flex" justifyContent="flex-end" mb={5}>
          <Button
            variant="contained"
            size="large"
            onClick={handleOpen}
            sx={{
              borderRadius: 3,
              px: 4,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor:'#ff8c00 !important'
            }}
          >
            + Add Review
          </Button>
        </Box>

        {/* Loading */}
        {loading && (
          <Box textAlign="center">
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {error && (
          <Typography color="error" textAlign="center">
            {error}
          </Typography>
        )}

        {/* Horizontal Scroll Reviews */}
        {!loading && (
          <Box
            ref={scrollRef}
            onWheel={handleWheel}
            sx={{
              display: "flex",
              gap: 4,
              overflowX: "auto",
              overflowY: "hidden",
              flexWrap: "nowrap",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",

              // Hide scrollbar
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              border:'0px solid red',
              padding:2
            }}
          >
            {reviews.map((review) => (
              <Card
                key={review._id}
                sx={{
                  width: 280,
                  height: 420,
                  flexShrink: 0,
                  borderRadius: 4,
                  boxShadow: 3,
                  transition: "0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 8,
                  },
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    mb={2}
                  >
                    <Avatar
                      src={review.image}
                      alt={review.name}
                      sx={{ width: 80, height: 80, mb: 2 }}
                    />
                    <Typography fontWeight={600}>
                      {review.name}
                    </Typography>
                    <Rating
                      value={review.rating}
                      readOnly
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 6,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {review.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Dialog */}
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
          <DialogTitle fontWeight={600}>
            Share Your Experience
          </DialogTitle>

          <DialogContent>
            <TextField
              label="Full Name"
              name="name"
              fullWidth
              margin="normal"
              value={formData.name}
              onChange={handleChange}
              error={Boolean(errors.name)}
              helperText={errors.name}
            />

            <TextField
              label="Email Address"
              name="email"
              fullWidth
              margin="normal"
              value={formData.email}
              onChange={handleChange}
              error={Boolean(errors.email)}
              helperText={errors.email}
            />

            <TextField
              label="Your Review"
              name="description"
              multiline
              rows={4}
              fullWidth
              margin="normal"
              value={formData.description}
              onChange={handleChange}
              error={Boolean(errors.description)}
              helperText={errors.description}
            />

            <Box mt={3}>
              <Typography fontWeight={500} mb={1}>
                Your Rating
              </Typography>
              <Rating
                value={formData.rating}
                onChange={(e, newValue) =>
                  setFormData({ ...formData, rating: newValue })
                }
                size="large"
              />
              {errors.rating && (
                <Typography variant="caption" color="error">
                  {errors.rating}
                </Typography>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="contained" sx={{backgroundColor:'#ff8c00 !important'}} onClick={handleSubmit}>
              Submit Review
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ReviewSection;
