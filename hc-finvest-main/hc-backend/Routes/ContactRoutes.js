import express from "express";
const router = express.Router();
// const {
//   saveContactForm,
//   getAllContacts,
// } 
import {
  saveContactForm,
  getAllContacts,
} from "../Controllers/ContactController.js";

// Route to save contact form data
router.post("/", saveContactForm);

// Optional route to get all stored data (for admin)
router.get("/", getAllContacts);

export default router;
