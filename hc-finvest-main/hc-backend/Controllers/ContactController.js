import Contact  from "../models/Contact.js"

// @desc   Save contact form data
// @route  POST /api/contact
// @access Public
export const saveContactForm = async (req, res) => {
  try {
    const { firstName, lastName, email, country, phone, subject, message } =
      req.body;

    // Validation (optional)
    if (!firstName || !email || !message) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }

    const contact = new Contact({
      firstName,
      lastName,
      email,
      country,
      phone,
      subject,
      message,
    });

    await contact.save();
    res.status(201).json({ message: "Form submitted successfully!" });
  } catch (error) {
    console.error("Error saving contact form:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// (Optional) Get all contact entries — for admin dashboard
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
};
