import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Container, Typography, Skeleton } from "@mui/material";
import { Helmet } from "react-helmet-async";

const BlogDetails = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true); // NEW

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axios.get(
          `https://hcfinvest.onrender.com/api/blogs/${id}`
        );
        setBlog(response.data);
      } catch (error) {
        console.error("Error fetching blog details:", error);
      } finally {
        setLoading(false); // END LOADING
      }
    };
    fetchBlog();
  }, [id]);

  // -----------------------------------------------------------
  //                SKELETON LOADER (WHEN LOADING)
  // -----------------------------------------------------------

  if (loading) {
    return (
      <Container sx={{ padding: "30px" }}>
        {/* Title Skeleton */}
        <Skeleton variant="text" width="50%" height={50} />

        {/* Date Skeleton */}
        <Skeleton variant="text" width="20%" height={25} sx={{ mb: 3 }} />

        {/* Image Skeleton */}
        <Skeleton
          variant="rectangular"
          width="100%"
          height={400}
          sx={{ borderRadius: "10px", mb: 3 }}
        />

        {/* Description Skeleton */}
        <Skeleton variant="text" height={30} width="100%" />
        <Skeleton variant="text" height={30} width="95%" />
        <Skeleton variant="text" height={30} width="90%" sx={{ mb: 4 }} />

        {/* Section skeletons */}
        <Skeleton variant="text" height={40} width="40%" />
        <Skeleton variant="text" height={25} width="100%" />
        <Skeleton variant="text" height={25} width="95%" />
        <Skeleton variant="text" height={25} width="90%" />
      </Container>
    );
  }

  // -----------------------------------------------------------
  //                NORMAL BLOG UI (WHEN LOADED)
  // -----------------------------------------------------------

  if (!blog) return <Typography>No blog found.</Typography>;

  const getImageUrl = (image) => {
    if (!image || !image.data) return "Images/default_blog.png";
    const base64String = btoa(
      new Uint8Array(image.data.data).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    return `data:${image.contentType};base64,${base64String}`;
  };

  return (
    <>
      <Helmet>
         <link rel="canonical" href="https://www.hcfinvest.com/blogs/:id" />
      </Helmet>

        <Container sx={{ padding: "30px" }}>
      <Box sx={{ textAlign: "left", marginBottom: "20px" }}>
        <Typography variant="h3" sx={{ fontWeight: 600 }}>
          {blog.title}
        </Typography>
        <Typography variant="body2" sx={{ color: "gray" }}>
          {new Date(blog.date).toLocaleDateString("en-GB")}
        </Typography>
      </Box>

      {/* Blog Image */}
      <img
        src={getImageUrl(blog.image)}
        alt={blog.title}
        style={{
          width: "100%",
          height: "400px",
          objectFit: "cover",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      />

      {/* Blog Description */}
      <Typography
        variant="body1"
        sx={{ textAlign: "justify", fontSize: "1.1rem", marginBottom: "30px" }}
      >
        {blog.description}
      </Typography>

      {/* Blog Sections */}
      {blog.sections && blog.sections.length > 0 && (
        <Box sx={{ marginTop: "20px" }}>
          {blog.sections.map((section, index) => (
            <Box key={index} sx={{ marginBottom: "20px" }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  marginBottom: "10px",
                  color: "#ff8c00",
                  textAlign: "left",
                }}
              >
                {section.heading}
              </Typography>

              <div
                dangerouslySetInnerHTML={{ __html: section.content }}
                style={{
                  fontSize: "1.05rem",
                  color: "#333",
                  lineHeight: "1.7",
                  textAlign: "justify",
                }}
              ></div>
            </Box>
          ))}
        </Box>
      )}
    </Container>
    </>
  );
};

export default BlogDetails;
