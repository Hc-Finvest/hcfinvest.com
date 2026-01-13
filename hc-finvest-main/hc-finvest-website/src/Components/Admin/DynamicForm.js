import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Divider,
  
} from "@mui/material";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import axios from "axios";

export default function DynamicArticleFormMUI() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [sections, setSections] = useState([{ heading: "", content: "" }]);

  // Handle image upload + preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddSection = () => {
    setSections([...sections, { heading: "", content: "" }]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("date", date);
    if (image) formData.append("image", image);
    formData.append("sections", JSON.stringify(sections));

    try {
      const res = await axios.post(
        "http://localhost:5000/api/articles/create",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert("✅ Article saved successfully!");
      console.log(res.data);

      setTitle("");
      setDate("");
      setImage(null);
      setPreview("");
      setSections([{ heading: "", content: "" }]);
    } catch (error) {
      console.error("❌ Error saving article:", error);
      alert("Failed to save article.");
    }
  };

  return (
    <Box
      sx={{
        maxWidth: "900px",
        mx: "auto",
        my: 5,
        p: 3,
        backgroundColor: "#fafafa",
        borderRadius: 3,
        boxShadow: 3,
      }}
    >
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        📝 Create Styled Article
      </Typography>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* Title */}
        <TextField
          label="Article Title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 3 }}
          required
        />

        {/* Date */}
        <TextField
          label="Published Date"
          type="date"
          fullWidth
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 3 }}
          required
        />

        {/* Image Upload */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Upload Cover Image
          </Typography>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {preview && (
            <Box mt={2}>
              <Typography variant="subtitle2">Image Preview:</Typography>
              <img
                src={preview}
                alt="Preview"
                style={{
                  width: "100%",
                  maxHeight: "250px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginTop: "10px",
                }}
              />
            </Box>
          )}
        </Box>

        {/* Dynamic Sections */}
        {sections.map((section, index) => (
          <Card key={index} sx={{ mb: 4, p: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Section {index + 1}
              </Typography>

              <TextField
                label="Section Heading"
                fullWidth
                variant="outlined"
                value={section.heading}
                onChange={(e) => handleChange(index, "heading", e.target.value)}
                sx={{ mb: 3 }}
              />

              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Section Content
              </Typography>

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

        <Box display="flex" gap={2}>
          <Button variant="outlined" color="primary" onClick={handleAddSection}>
            ➕ Add Section
          </Button>
          <Button variant="contained" color="success" type="submit">
            💾 Save Article
          </Button>
        </Box>
      </form>

      <Divider sx={{ my: 4 }} />
    </Box>
  );
}
