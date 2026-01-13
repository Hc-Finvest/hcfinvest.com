import React from "react";
import {
  Box,
  Typography,
  Link,
} from "@mui/material";


const AboutUsBox = () => {
  return (

    <Box
      sx={{
        width: { xs: "100%", sm: "80%", md: "250px" }, // fluid width for mobile/tablet/desktop
        maxWidth: "250px", // max width for larger screens
        p: 2,
        backgroundColor: "#f9f9f9",
        borderRadius: "20px",
        textAlign: "left",
        mx: "auto", // center on small screens
      }}
    >
      {[
        { label: "About HC Finvest", href: "about" },
        { label: "Regulation And Licence", href: "regulationAndLicence" },
        { label: "Security Of Funds", href: "securityOfFunds" },
      ].map((item, index) => (
        <Typography
          key={index}
          sx={{
            margin: "5px 0",
            padding: "5px",
            borderRadius: "5px",
            transition: "color 0.3s ease",
            "&:hover": { backgroundColor: "lightgray", borderRadius: "5px" },
          }}
        >
          <Link
            underline="none"
            style={{
              textDecoration: "none", // remove underline
              color: "black", // white text for dark theme
              cursor: "pointer",
            }}
            href={item.href}
          >
            {item.label}
          </Link>
        </Typography>
      ))}
    </Box>
  );
};

export default AboutUsBox;
