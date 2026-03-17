import express from "express";
import {
  createRegistration,
  getAllRegistrations,
  deleteRegistration,
} from "../Controllers/RegistratioinController.js";

const router = express.Router();

// Create a new registration
router.post("/", createRegistration);

// Get all registrations
router.get("/", getAllRegistrations);

// Delete a registration by ID
router.delete("/:id", deleteRegistration);

export default router;
