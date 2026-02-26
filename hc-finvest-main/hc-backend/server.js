import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import blogRoutes from "./Routes/BlogRoutes.js";
import registrationRoutes from "./Routes/RegistrationRoutes.js";
import contactRoutes from "./Routes/ContactRoutes.js";
import swapRoutes from "./Routes/SwapRoutes.js";
import spreadRoutes from "./Routes/SpreadRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import reviewRoutes from "./Routes/ReviewRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
/* ✅ Cache headers for uploaded images */
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000");
  res.setHeader(
    "Expires",
    new Date(Date.now() + 31536000000).toUTCString()
  );
  next();
});

/* ✅ Serve uploaded images */
app.use("/uploads", express.static("uploads")); // serve image files

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

// ✅ Routes
app.use("/api/blogs", blogRoutes);
app.use("/api/register", registrationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/spreads", spreadRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/reviews",reviewRoutes);

// // ✅ Default route
// app.get("/", (req, res) => {
//   res.send("Welcome to the Blog API 🚀");
// });

app.use(
  express.static(path.join(__dirname, "../hc-finvest-website/build"), {
    maxAge: "1y", // cache for 1 year
    immutable: true, // tells browser the file never changes (because of hashed filenames)
  })
);

app.get(/.*/, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../hc-finvest-website/build", "index.html")
  );
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
