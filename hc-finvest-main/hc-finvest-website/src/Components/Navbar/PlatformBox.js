import { Box, Link, Typography } from "@mui/material"

const PlatformBox = () => {
    return (
      <Box
        sx={{
          width: { xs: "100%", sm: "90%", md: "310px" }, // fluid width for all devices
          maxWidth: "310px", // max width for larger screens
          p: 2,
          backgroundColor: "#f9f9f9",
          borderRadius: "20px",
          textAlign: "left",
          mx: "auto", // centers on smaller screens
        }}
      >
        {[
          { label: "MetaTrader 5 for PC", href: "metaTrade5forPc" },
          {
            label: "MetaTrader 5 for Mobile (Android/IOS)",
            href: "metaTrade5Android",
          },
        ].map((item, index) => (
          <Typography
            key={index}
            sx={{
              margin: "5px 0",
              padding: "5px",
              borderRadius: "5px",
              transition: "color 0.3s ease",
              "&:hover": {
                backgroundColor: "lightgray",
                borderRadius: "5px",
              },
            }}
          >
            <Link
              underline="none"
              style={{
                textDecoration: "none", // remove underline
                color: "black", // inherit black color
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
}
export default PlatformBox;