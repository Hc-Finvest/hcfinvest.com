import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
  heading: { type: String, required: false },
  content: { type: String, required: false },
});

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },

  image: {
    data: Buffer,
    contentType: String,
  },

  sections: [sectionSchema],
});

export default mongoose.model("Blog", blogSchema);
