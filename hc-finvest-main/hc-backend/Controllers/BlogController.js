import Blog from "../models/Blogs.js";

/**
 * @desc Create a new blog
 * @route POST /api/blogs
 */
export const createBlog = async (req, res) => {
  try {
    const { title, date } = req.body;
    const sections = JSON.parse(req.body.sections);

    if (!title || !date || !req.file) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newBlog = new Blog({
      title,
      // description,
      date,
      sections,
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
    });

    console.log("Blod Data from Controller" + newBlog);

    await newBlog.save();
    res.status(201).json({ message: "Blog created successfully!" });
  } catch (error) {
    console.error("Error creating blog:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

/**
 * @desc Get all blogs
 * @route GET /api/blogs
 */
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ date: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get single blog by id
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
