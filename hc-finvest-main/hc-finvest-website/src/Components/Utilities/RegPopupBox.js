import axios from "axios";
import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import countries from "./Countries";
import "../Styles/RegPopupBox.css"  // 👈 ADD THIS IMPORT

const RegPopupBox = ({ onClose }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
  });

  const [errors, setErrors] = useState({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.fullName.trim())
      newErrors.fullName = "Full Name is required";

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone Number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone Number must be exactly 10 digits";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert("❗Please correct the errors before submitting.");
      return;
    }

    try {
      console.log(formData);
      const res = await axios.post(
        "https://hcfinvest.onrender.com/api/register",
        formData
      );

      alert("✅ Submitted Successfully! We’ll get back to you soon.");
      console.log("Server response:", res.data);

      setFormData({ fullName: "", phoneNumber: "", email: "" });
      setErrors({});
      onClose();
    } catch (err) {
      console.error("❌ Error submitting form:", err);
      alert("Failed to submit registration!");
    }
  };

  return (
    <Box
      className="popup-bg-animate"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1300,
        px: 2,
      }}
    >
      <Box
        className="popup-animate"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: { xs: "100%", sm: "90%", md: "800px" },
          height: { xs: "auto", md: "500px" },
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          backgroundColor: "#fff",
        }}
      >
        {/* Left Side Form */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 3, sm: 4 },
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <IconButton
            sx={{ position: "absolute", top: 10, left: 10 }}
            size="small"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ textAlign: "center", mb: 3 }}>
            <img
              src="Images/MainContentImages/Hc Finvest Logo for website 3.svg"
              alt="HC Finvest"
              style={{
                width: isMobile ? 150 : 200,
                marginBottom: 10,
              }}
            />
            <Typography
              variant={isMobile ? "h6" : "h5"}
              sx={{ fontWeight: 700, color: "#ff8c00" }}
            >
              Welcome to HC Finvest
            </Typography>
          </Box>

          <TextField
            fullWidth
            placeholder="Enter Your Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            size="small"
            sx={{ 
              mb: 2,
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": {
                  borderColor: "#ff8c00",
                },
              },
            }}
            error={Boolean(errors.fullName)}
            helperText={errors.fullName}
          />

          <FormControl sx={{ mb: 2, textAlign:'left' }} fullWidth size="small" >
            <InputLabel>Country Code</InputLabel>
            <Select
              name="countryCode"
              value={formData.countryCode}
              onChange={handleChange}
              label="Country Code"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: "#ff8c00",
                  },
                },
              }}
            >
              {countries.map((c) => (
                <MenuItem key={c.code} value={c.dial}>
                  <img
                    src={`https://flagcdn.com/24x18/${c.code}.png`}
                    alt={c.name}
                    style={{ width: 24, marginRight: 10 }}
                  />
                  {c.dial} — {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            placeholder="Enter Your Valid Phone Number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            size="small"
            sx={{ 
              mb: 2,
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": {
                  borderColor: "#ff8c00",
                },
              },
            }}
            error={Boolean(errors.phoneNumber)}
            helperText={errors.phoneNumber}
          />

          <TextField
            fullWidth
            placeholder="Enter Your Valid Email ID"
            name="email"
            value={formData.email}
            onChange={handleChange}
            size="small"
            sx={{ 
              mb: 3,
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": {
                  borderColor: "#ff8c00",
                },
              },
            }}
            error={Boolean(errors.email)}
            helperText={errors.email}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            sx={{
              backgroundColor: "#ff8c00",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              py: 1.2,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              "&:hover": { backgroundColor: "#e67300" },
            }}
          >
            Submit
          </Button>
        </Box>

        {/* Right Side Image */}
        <Box
          sx={{
            flex: 1,
            backgroundImage: `url('Images/MainContentImages/For welcome  2.webp')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: { xs: "none", md: "block" },
          }}
        ></Box>
      </Box>
    </Box>
  );
};

export default RegPopupBox;
