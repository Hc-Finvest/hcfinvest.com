import { Box, Link, Typography } from "@mui/material"

const ResearchAndToolBox = () => {
    return (
      <Box
        sx={{
          width: { xs: "100%", sm: "80%", md: "220px" }, // fluid width for all devices
          maxWidth: "220px", // max width for larger screens
          p: 2,
          backgroundColor: "#f9f9f9",
          borderRadius: "20px",
          textAlign: "left",
          mx: "auto", // centers on small screens
        }}
      >
        {[
          { label: "News", href: "https://www.reuters.com/" },
          { label: "Economic Calendar", href: "economicCalander" },
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
export default ResearchAndToolBox;