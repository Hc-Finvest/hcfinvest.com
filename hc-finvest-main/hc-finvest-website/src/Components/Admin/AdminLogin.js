import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (username === "HC-Finvest" && password === "hcfinvest@2025") {
      localStorage.setItem("adminAuth", "true");
      alert("✔ Login Successful! Welcome Admin.");
      window.location.href = "/admin/adminBlogManagement";
    } else {
      alert("❌ Invalid Credentials!");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <Box
      sx={{
        backgroundImage: `url("Images/AdminImages/adminwpnew.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Glassmorph Box */}
      <Box
        sx={{
          width: { xs: "90%", sm: "470px", md: "500px" },
          height: { xs: "auto", sm: "460px", md: "400px" },
          bgcolor: "rgba(255,255,255,0.15)",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.3)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          p: 4,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <img
            src="Images/MainContentImages/Hc Finvest Logo for website 3.svg"
            alt="Logo"
            style={{ height: "50px" }}
          />
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: "white", mb: 3 }}
        >
          Admin Login
        </Typography>

        {/* Username */}
        <TextField
          fullWidth
          label="Username"
          variant="outlined"
          size="small"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          InputProps={{
            style: {
              color: "white",
              backgroundColor: "transparent",
            },
          }}
          InputLabelProps={{
            style: { color: "#e0e0e0" },
          }}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              backgroundColor: "transparent !important",
              "& fieldset": { borderColor: "rgba(255,255,255,0.4)" },
              "&:hover fieldset": { borderColor: "#fff" },
              "&.Mui-focused fieldset": { borderColor: "#fff" },
            },
          }}
        />

        {/* Password — only ENTER handler here */}
        <TextField
          fullWidth
          label="Password"
          type="password"
          variant="outlined"
          size="small"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyPress}
          sx={{
            mb: 3,
            input: { color: "white" },
            label: { color: "#e0e0e0" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "rgba(255,255,255,0.4)" },
              "&:hover fieldset": { borderColor: "#fff" },
              "&.Mui-focused fieldset": { borderColor: "#fff" },
            },
          }}
        />

        {/* Login Button */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleLogin}
          sx={{
            textTransform: "none",
            py: 1,
            fontWeight: 600,
            bgcolor: "#0b2447",
            "&:hover": { bgcolor: "#132a5c" },
          }}
        >
          Login
        </Button>
      </Box>
    </Box>
  );
};

export default AdminLogin;
