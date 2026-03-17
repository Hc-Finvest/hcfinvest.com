import React from "react";
import {
  Card,
  Typography,
  Button,
  Grid,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const MainContentCard1 = ({ title, md, abc, ssf, ml }) => {
  const navigate = useNavigate();

  const handleReadMore = () => {
    if (title === "Starter") {
      navigate("/starterAccount");
    } else if (title === "Pro Trader") {
      navigate("/proTraderAccount");
    } else if (title === "Zero Spread") {
      navigate("/zeroSpreadAccount");
    } else if (title === "Elite") {
      navigate("/eliteAccount");
    } else {
      navigate("/");
    }
  };

  return (
    <Card
      sx={{
        width: "240px",
        backgroundColor: "#fff",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        overflow: "hidden",
        position: "relative",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
          transform: "translateY(-5px)",
        },
      }}
    >
      {/* Slanted Diagonal Ribbon Header */}
      <Box
        sx={{
          position: "relative",
          background: "linear-gradient(135deg, #ff8c00 0%, #ff7000 100%)",
          height: "60px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          clipPath: "polygon(0 0, 100% 0, 100% 70%, 0 100%)",
        }}
      >
        <Typography
          sx={{
            color: "white",
            fontWeight: "700",
            fontSize: "1.1rem",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Content Rows */}
      <Box sx={{ pt: "15px", px: "20px", pb: "10px" }}>
        <Grid container justifyContent="space-between" sx={{ py: "12px", borderBottom: "1px solid #eee" }}>
          <Grid item>
            <Typography sx={{ color: "#888", fontSize: "13px" }}>Min Deposit</Typography>
          </Grid>
          <Grid item>
            <Typography sx={{ color: "#333", fontSize: "13px", fontWeight: "600" }}>{md}</Typography>
          </Grid>
        </Grid>

        <Grid container justifyContent="space-between" sx={{ py: "12px", borderBottom: "1px solid #eee" }}>
          <Grid item>
            <Typography sx={{ color: "#888", fontSize: "13px" }}>Currencies</Typography>
          </Grid>
          <Grid item>
            <Typography sx={{ color: "#333", fontSize: "13px", fontWeight: "600" }}>{abc}</Typography>
          </Grid>
        </Grid>

        <Grid container justifyContent="space-between" sx={{ py: "12px", borderBottom: "1px solid #eee" }}>
          <Grid item>
            <Typography sx={{ color: "#888", fontSize: "13px" }}>Spreads From</Typography>
          </Grid>
          <Grid item>
            <Typography sx={{ color: "#333", fontSize: "13px", fontWeight: "600" }}>{ssf}</Typography>
          </Grid>
        </Grid>

        <Grid container justifyContent="space-between" sx={{ py: "12px" }}>
          <Grid item>
            <Typography sx={{ color: "#888", fontSize: "13px" }}>Max Leverage</Typography>
          </Grid>
          <Grid item>
            <Typography sx={{ color: "#333", fontSize: "13px", fontWeight: "600" }}>{ml}</Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Button */}
      <Box sx={{ p: "15px", display: "flex", justifyContent: "center" }}>
        <Button
          onClick={handleReadMore}
          sx={{
            background: "linear-gradient(135deg, #ff8c00 0%, #ff7000 100%)",
            color: "white",
            padding: "10px 40px",
            borderRadius: "25px",
            fontWeight: "600",
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            "&:hover": {
              background: "linear-gradient(135deg, #ff7000 0%, #ff5500 100%)",
            },
          }}
        >
          Read More
        </Button>
      </Box>
    </Card>
  );
};

export default MainContentCard1;
