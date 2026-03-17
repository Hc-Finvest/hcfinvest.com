import {
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import GiftIcon from "@mui/icons-material/CardGiftcard";
import TradingDetailsBox from "./Utilities/TradingDetailsBox";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import SpeedIcon from "@mui/icons-material/Speed";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { Helmet } from "react-helmet-async";

const BonusPage = () => {
  return (
    <>
       <Helmet>
        <link rel="canonical" href="https://www.hcfinvest.com/bonus" />
       </Helmet>
      <Box
        sx={{
          width: "100%",
          height: { xs: "380px", sm: "420px", md: "470px" },
          backgroundImage: "url(Images/BonusImages/bannerBonus.webp)",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          px: 2,
          color:'white'
        }}
      >
        <Box>
          <h1
            sx={{
            zIndex: 2,
            fontWeight: 600,
            textAlign: "center",
            px: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            }}
          >
            Get a 50% Bonus – Up to $2000
          </h1>

          <h3
            sx={{
            zIndex: 2,
            fontWeight: 600,
            textAlign: "center",
            px: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            }}
          >
            Unlock a 50% boost up to $2,000. Amplify your trades — sign up
            today!
          </h3>
        </Box>
      </Box>

      {/* Bonus Section */}
      <Grid
        container
        size={12}
        spacing={6}
        display="flex"
        justifyContent="center"
        alignItems="center"
        border="0px solid red"
      >
        {/* LEFT IMAGE */}
        <Grid
          item
          xs={12}
          md={6}
          lg={6}
          sx={{
            display: "flex",
            justifyContent: "center",
            border: "0px solid red",
          }}
        >
          <Box
            component="img"
            src="/Images/BonusImages/Bonus.webp"
            sx={{
              width: "100%",
              maxWidth: "700px",
              borderRadius: "10px",
              objectFit: "cover",
            }}
          />
        </Grid>

        {/* RIGHT CONTENT */}
        <Grid item xs={12} md={6} border="0px solid green">
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              bgcolor: "#ff8c00",
              px: 2,
              py: 1,
              borderRadius: "30px",
              fontWeight: 600,
              fontSize: "1.1rem",
              color: "white",
              mb: 2,
            }}
          >
            <GiftIcon sx={{ mr: 1 }} /> 50% Bonus
          </Box>

          <Typography variant="h4" fontWeight={700}>
            Get 50% Cash Deposit Bonus
          </Typography>

          <Typography sx={{ mt: 2 }}>
            Maximize your trading power with a{" "}
            <span style={{ color: "#ff8c00" }}>
              50% deposit bonus up to $2000
            </span>
            . Boost your account instantly.
          </Typography>

          <Box
            sx={{
              backgroundColor: "#ffffff1a",
              borderRadius: "15px",
              p: 2,
              mt: 4,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Unlock a 50% bonus on your first deposit:
            </Typography>

            <Table component={Paper}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: "#0b1660", color: "white" }}>
                    Deposit Amount ($)
                  </TableCell>
                  <TableCell sx={{ bgcolor: "#0b1660", color: "white" }}>
                    Margin Bonus ($)
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {[
                  ["$500", "$250"],
                  ["$1,000", "$500"],
                  ["$2,000", "$1,000"],
                  ["$5,000", "$2,000"],
                  ["$10,000", "$2,000"],
                ].map(([deposit, bonus]) => (
                  <TableRow key={deposit}>
                    <TableCell>{deposit}</TableCell>
                    <TableCell>{bonus}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Typography sx={{ mt: 1, fontSize: "0.9rem", color: "black" }}>
              Note :- The maximum bonus you can receive is $2,000.
            </Typography>
          </Box>
        </Grid>
      </Grid>
      {/* </Container> */}
      <Box
        sx={{
          backgroundColor: "#f8f9fa",
          py: 7,
          px: 2,
        }}
      >
        {/* <Container> */}
        <Box textAlign="center" mb={5}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#ff8c00",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Why Choose HC Finvest?
          </Typography>
        </Box>

        {/* FIXED CARD HEIGHT + ONE ROW */}
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={6} md={4}>
            <Box
              sx={{
                bgcolor: "#fff",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
                transition: "0.3s",
                height: "240px", // ❗ fixed height
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": {
                  transform: "translateY(-6px)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                },
              }}
            >
              <LaptopMacIcon
                sx={{ fontSize: "2.7rem", color: "#ff8c00", mb: 1 }}
              />
              <Typography variant="h6" fontWeight={600} mb={1}>
                Advanced Multi-Device Platforms
              </Typography>
              <Typography variant="body2">
                Trade seamlessly across all platforms – optimized for every
                device.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box
              sx={{
                bgcolor: "#fff",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
                transition: "0.3s",
                height: "240px", // ❗ same height
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": {
                  transform: "translateY(-6px)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                },
              }}
            >
              <SpeedIcon sx={{ fontSize: "2.7rem", color: "#ff8c00", mb: 1 }} />
              <Typography variant="h6" fontWeight={600} mb={1}>
                Lightning-Fast Order Execution
              </Typography>
              <Typography variant="body2">
                Ultra-low latency and instant trade execution.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box
              sx={{
                bgcolor: "#fff",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
                transition: "0.3s",
                height: "240px", // ❗ same height
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": {
                  transform: "translateY(-6px)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                },
              }}
            >
              <PsychologyIcon
                sx={{ fontSize: "2.7rem", color: "#ff8c00", mb: 1 }}
              />
              <Typography variant="h6" fontWeight={600} mb={1}>
                Smart Trading & Market Insights
              </Typography>
              <Typography variant="body2">
                AI-powered analytics for better trading decisions.
              </Typography>
            </Box>
          </Grid>
        </Grid>
        {/* </Container> */}
      </Box>
      <TradingDetailsBox />
    </>
  );
};

export default BonusPage;
