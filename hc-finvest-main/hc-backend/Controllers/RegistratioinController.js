import Registration from "../models/Registration.js";

// ✅ Create new registration
export const createRegistration = async (req, res) => {
  try {
    const { fullName, phoneNumber, email } = req.body;

    // Validation
    if (!fullName || !phoneNumber || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existing = await Registration.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const newReg = new Registration({ fullName, phoneNumber, email });
    await newReg.save();

    res.status(201).json({
      message: "Registration successful",
      data: newReg,
    });
  } catch (error) {
    console.error("Error creating registration:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Get all registrations
export const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 });
    res.status(200).json(registrations);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Delete a registration by ID
export const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Registration.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Registration not found" });
    }

    res.status(200).json({ message: "Registration deleted successfully" });
  } catch (error) {
    console.error("Error deleting registration:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
