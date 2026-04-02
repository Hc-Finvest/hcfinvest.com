import { Box, Link, Typography } from "@mui/material"

const PlatformBox = () => {
    return (
      <Box
        sx={{
          width: { xs: "100%", sm: "90%", md: "310px" }, // fluid width for all devices
          maxWidth: "290px", // max width for larger screens
          p: 1,
          backgroundColor: "#f9f9f9",
          borderRadius: "20px",
          textAlign: "left",
          mx: "auto", // centers on smaller screens
        }}
      >
        {[
          { label: "Web Terminal", href: "https://trade.hcfinvest.com/user/login" },
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
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              textDecoration: "none",
              color: "black",
              cursor: "pointer",
            }}
          >
            {item.label}
          </Link>
          </Typography>
        ))}
      </Box>
    );
}
export default PlatformBox;
