import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  country: String,
  phone: String,
  subject: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Contact", contactSchema);
