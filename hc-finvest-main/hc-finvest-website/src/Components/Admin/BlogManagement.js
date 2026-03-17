import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState, useEffect } from "react";
import axios from "axios";
import ScrollToTopButton from "../Utilities/ScrollToTopButton";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
// import SEO from "../SEO";

const BlogManagement = () => {
  const [date, setDate] = useState("");
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [sections, setSections] = useState([{ heading: "", content: "" }]);

  const handleAddSection = () => {
    setSections([...sections, { heading: "", content: "" }]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setFileName(file.name);
    }
  };

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date || !image || !title) {
      alert("Please fill all fields and upload an image!");
      return;
    }

    const blogData = new FormData();
    blogData.append("title", title);
    blogData.append("date", date);
    blogData.append("image", image);
    blogData.append("sections", JSON.stringify(sections));

    try {
      await axios.post("https://hcfinvest.onrender.com/api/blogs", blogData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Blog added successfully!");

      setTitle("");
      setDate("");
      setImage(null);
      setFileName("");
      setSections([{ heading: "", content: "" }]);

      handleClose();
      fetchBlogs();
    } catch (error) {
      console.error("Error adding blog:", error);
    }
  };

  // DELETE BLOG
  const handleDelete = async (blogId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this blog?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`https://hcfinvest.onrender.com/api/blogs/${blogId}`);
      alert("Blog deleted successfully!");
      fetchBlogs();
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Failed to delete blog!");
    }
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://hcfinvest.onrender.com/api/blogs");
      setBlogs(res.data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
<>

    <Container sx={{ backgroundColor: "#fff" }} maxWidth={false} disableGutters>
      <ScrollToTopButton />

      <Grid
        sx={{ display: "flex", justifyContent: "flex-end", margin: "20px" }}
      >
        <Button variant="contained" onClick={handleClickOpen}>
          Add Blog
        </Button>
      </Grid>

      {/* Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        disableEnforceFocus
        disableRestoreFocus
      >
        <DialogTitle
          sx={{
            fontSize: "2rem",
            fontWeight: "600",
            color: "#ff8c00",
            textAlign: "center",
          }}
        >
          Add New Blog
        </DialogTitle>

        <DialogContent>
          {/* Upload + Fields */}
          <Grid>
            <TextField
              fullWidth
              label="Selected File"
              value={fileName}
              placeholder="No file chosen"
              sx={{ margin: "10px" }}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      component="label"
                      sx={{
                        height: "40px",
                        textTransform: "none",
                        backgroundColor: "#11155c",
                      }}
                    >
                      Upload
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </Button>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Choose Date"
              fullWidth
              type="date"
              value={date}
              sx={{ margin: "10px" }}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Title"
              fullWidth
              sx={{ margin: "10px" }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Grid>

          {sections.map((section, index) => (
            <Card key={index} sx={{ mb: 4, p: 2, borderRadius: 2 }}>
              <CardContent>
                <TextField
                  label="Section Heading"
                  fullWidth
                  variant="outlined"
                  value={section.heading}
                  onChange={(e) =>
                    handleChange(index, "heading", e.target.value)
                  }
                  sx={{ mb: 3 }}
                />

                <ReactQuill
                  theme="snow"
                  value={section.content}
                  onChange={(value) => handleChange(index, "content", value)}
                  placeholder="Write your detailed content here..."
                  style={{
                    height: "200px",
                    marginBottom: "40px",
                    backgroundColor: "white",
                  }}
                />
              </CardContent>
            </Card>
          ))}

          <Button variant="outlined" sx={{marginRight:'5px'}} color="primary" onClick={handleAddSection}>
            ➕ Add Section
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              if (sections.length > 1) {
                setSections(sections.slice(0, -1));
              } else {
                alert("At least one section is required.");
              }
            }}
          >
            ❌ Remove Section
          </Button>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#11155c" }}
            onClick={handleSubmit}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Display Blogs */}
      <Grid
        container
        justifyContent="center"
        sx={{ padding: "30px" }}
        spacing={2}
      >
        {loading
          ? [...Array(6)].map((_, i) => (
              <Grid item xs={12} sm={6} md={3.5} key={i}>
                <Card sx={{ margin: "15px", width: "400px", height: "450px" }}>
                  <Box
                    sx={{
                      width: "100%",
                      height: 300,
                      bgcolor: "#e3e6e8",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                  <CardContent>
                    <Box
                      sx={{
                        width: "40%",
                        height: "14px",
                        bgcolor: "#e3e6e8",
                        mb: 2,
                        animation: "pulse 1.5s infinite",
                      }}
                    />
                    <Box
                      sx={{
                        width: "70%",
                        height: "18px",
                        bgcolor: "#e3e6e8",
                        animation: "pulse 1.5s infinite",
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))
          : blogs.map((blog) => {
              let imageSrc = "";

              if (blog.image?.data) {
                const base64String = btoa(
                  new Uint8Array(blog.image.data.data).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    ""
                  )
                );
                imageSrc = `data:${blog.image.contentType};base64,${base64String}`;
              }

              return (
                <Grid item key={blog._id} xs={12} sm={6} md={3.5}>
                  <Card
                    sx={{
                      margin: "15px",
                      width: "400px",
                      height: "450px",
                      position: "relative",
                    }}
                  >
                    {/* DELETE BUTTON (top-right corner) */}
                    <IconButton
                      sx={{
                        position: "absolute",
                        top: 5,
                        right: 5,
                        color: "red",
                        backgroundColor: "white",
                        "&:hover": { backgroundColor: "#ffe6e6" },
                      }}
                      onClick={() => handleDelete(blog._id)}
                    >
                      <DeleteIcon />
                    </IconButton>

                    {imageSrc && (
                      <img
                        src={imageSrc}
                        style={{
                          height: 300,
                          width: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}

                    <CardContent>
                      <Typography
                        variant="body1"
                        align="left"
                        sx={{ color: "text.secondary", marginBottom: "10px" }}
                      >
                        {new Date(blog.date).toLocaleDateString()}
                      </Typography>

                      <Typography
                        variant="h6"
                        align="left"
                        sx={{ color: "#11155c", marginBottom: "8px" }}
                      >
                        {blog.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
      </Grid>

      {/* Skeleton */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Container>
</>
  );
};

export default BlogManagement;
