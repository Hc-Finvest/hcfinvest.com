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
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    description: "",
    rating: 0,
    image: null,
  });

  // ==========================
  // FETCH REVIEWS
  // ==========================
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://hcfinvest.onrender.com/api/reviews");

      if (Array.isArray(res.data)) {
        setReviews(res.data);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.log("Fetch Error:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // SUBMIT REVIEW WITH IMAGE
  // ==========================
const handleSubmit = async () => {
  try {

    if (!formData.name || !formData.email || !formData.description || !formData.rating) {
      alert("Please fill all fields");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("rating", formData.rating);

    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    // IMPORTANT: Do NOT manually set headers
    await axios.post(
      "https://hcfinvest.onrender.com/api/reviews",
      formDataToSend
    );

    fetchReviews();
    setOpen(false);

  } catch (error) {
    console.log("Submit Error:", error.response?.data);
  }
};

  // ==========================
  // SMOOTH HORIZONTAL SCROLL
  // ==========================
const handleWheel = (e) => {
  if (scrollRef.current) {
    scrollRef.current.scrollBy({
      left: e.deltaY,
      behavior: "smooth",
    });
  }
};
  return (
    <Box sx={{ bgcolor: "#fff", py: 8 }}>
      <Box sx={{ maxWidth: "1300px", mx: "auto", px: 3 }}>

        {/* HEADER */}
           <Typography
              variant="h2"
              sx={{ fontSize: "39px", fontWeight: "bold" }}
            >
              <span style={{ color: "#ff8c00" }}>Customer</span> Reviews
            </Typography>

        {/* ADD BUTTON */}
        <Box display="flex" justifyContent="flex-end" mb={5}>
          <Button
            variant="contained"
            size="large"
            sx={{backgroundColor:'#ff8c00 !important'}}
            onClick={() => setOpen(true)}
          >
            + Add Review
          </Button>
        </Box>

        {/* LOADING */}
        {loading ? (
          <Box textAlign="center">
            <CircularProgress />
          </Box>
        ) : (
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
              scrollSnapType: "x mandatory",
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              padding:2
            }}
          >
            {Array.isArray(reviews) && reviews.length === 0 && (
              <Typography width="100%" textAlign="center">
                No reviews yet. Be the first to add one.
              </Typography>
            )}

            {Array.isArray(reviews) &&
              reviews.map((review) => (
                <Card
                  key={review._id}
                  sx={{
                    width: 280,
                    height: 420,
                    flexShrink: 0,
                    borderRadius: 4,
                    boxShadow: 3,
                    scrollSnapAlign: "start",
                    transition: "0.3s ease",
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
                        src={
                          review.image
                            ? `https://hcfinvest.onrender.com${review.image}`
                            : ""
                        }
                        sx={{ width: 80, height: 80, mb: 2 }}
                      />
                      <Typography fontWeight={600}>
                        {review.name}
                      </Typography>
                      <Rating
                        value={review.rating}
                        readOnly
                        size="small"
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

        {/* DIALOG */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Add Review</DialogTitle>

          <DialogContent>

            <TextField
              label="Name"
              fullWidth
              margin="normal"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <TextField
              label="Email"
              fullWidth
              margin="normal"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <TextField
              label="Description"
              multiline
              rows={4}
              fullWidth
              margin="normal"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />

            <Box mt={2}>
              <Typography>Your Rating</Typography>
              <Rating
                value={formData.rating}
                onChange={(e, value) =>
                  setFormData({ ...formData, rating: value })
                }
              />
            </Box>

            {/* Upload Button */}
            <Button
              variant="outlined"
              component="label"
              sx={{ mt: 3 }}
              fullWidth
            >
              Upload Profile Picture
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    image: e.target.files[0],
                  })
                }
              />
            </Button>

          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>
              Submit
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
  );
};

export default ReviewSection;