import { Box, Grid, Link, Typography } from "@mui/material";

const TradingBox = () => {
  const navItems = [
    { text: "Swap", path: "/swapMarket" },
    { text: "Margin & Leverage", path: "/marginLeverage" },
    { text: "Deposit & Withdrawal", path: "/depositWithdrawal" },
  ];

  return (
    <Box
      sx={{
        width: { xs: "100%", sm: "100%", md: "900px" }, // responsive width
        p: 2,
        backgroundColor: "#f9f9f9",
        borderRadius: "20px",
        textAlign: "left",
        mx: "auto", // center horizontally on small screens
      }}
    >
      <Grid
        container
        spacing={2} // add spacing for small screens
        display="flex"
        justifyContent="space-between"
      >
        {/* ACCOUNTS */}
        <Grid item xs={12} sm={6} md={2.2}>
          <Typography
            sx={{ fontWeight: "bold", color: "#102040", mb: 1, padding: "5px" }}
          >
            ACCOUNTS
          </Typography>
          {[
            "Accounts Types",
            "Starter",
            "Pro Trader",
            "Zero Spread",
            "Elite",
          ].map((text, index) => (
            <Typography
              key={index}
              sx={{
                fontWeight: "400",
                color: "#000",
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
                  color: "inherit", // inherit black color
                  cursor: "pointer",
                }}
                href={text.toLowerCase().replace(/\s/g, "") + "Account"}
              >
                {text}
              </Link>
            </Typography>
          ))}
        </Grid>

        {/* MARKETS */}
        <Grid item xs={12} sm={6} md={2.2}>
          <Typography sx={{ fontWeight: "bold", color: "#102040", mb: 1 }}>
            MARKETS
          </Typography>
          {[
            "Forex",
            "Metals",
            "Indices",
            "Stocks",
            "Commodities",
            "Cryptocurrency",
          ].map((text, index) => (
            <Typography
              key={index}
              sx={{
                fontWeight: "400",
                color: "#000",
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
                  color: "inherit", // inherit black color
                  cursor: "pointer",
                }}
                href={text.toLowerCase().replace(/\s/g, "") + "Market"}
              >
                {text}
              </Link>
            </Typography>
          ))}
        </Grid>

        {/* TRADING */}
        <Grid item xs={12} sm={6} md={2.2}>
          <Typography sx={{ fontWeight: "bold", color: "#102040", mb: 1 }}>
            TRADING
          </Typography>
          {navItems.map((item, index) => (
            <Typography
              key={index}
              sx={{
                fontWeight: "400",
                color: "#000",
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
                  color: "inherit", // inherit black color
                  cursor: "pointer",
                }}
                href={item.path}
              >
                {item.text}
              </Link>
            </Typography>
          ))}
        </Grid>

        {/* PROMOTIONS */}
        <Grid item xs={12} sm={6} md={2.2}>
          <Typography sx={{ fontWeight: "bold", color: "#102040", mb: 1 }}>
            PROMOTIONS
          </Typography>
          <Typography
            sx={{
              fontWeight: "400",
              color: "#000",
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
                color: "inherit", // inherit black color
                cursor: "pointer",
              }}
              href="promotions"
            >
              Promotions
            </Link>
          </Typography>
        </Grid>

        {/* PARTNERSHIP */}
        <Grid item xs={12} sm={6} md={2.2}>
          <Typography sx={{ fontWeight: "bold", color: "#102040", mb: 1 }}>
            PARTNERSHIP
          </Typography>
          {["Introducing Broker", "Welcome Account"].map((text, index) => (
            <Typography
              key={index}
              sx={{
                fontWeight: "400",
                color: "#000",
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
                  color: "inherit", // inherit black color
                  cursor: "pointer",
                }}
                href={text.toLowerCase().replace(/\s/g, "")}
              >
                {text}
              </Link>
            </Typography>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
};
export default TradingBox;
