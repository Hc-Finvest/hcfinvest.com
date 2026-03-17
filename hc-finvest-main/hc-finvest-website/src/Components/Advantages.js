import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import TradingDetailsBox from "./Utilities/TradingDetailsBox";
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import { Helmet } from "react-helmet-async";

const Advantages = () => {
  return (
    <>
      <Helmet>
        <link rel="canonical" href="https://www.hcfinvest.com/advantages" />
      </Helmet>
      <Container sx={{ backgroundColor: "#fff" }} maxWidth={false} disableGutters>
      <ScrollToTopButton />

      {/* Banner Box */}
      <Box
        sx={{
          position: "relative",
          height: { xs: "280px", sm: "350px", md: "475px" },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          backgroundImage: `url('Images/AdvantagesImages/Newhedgecapitalsimage_About company.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          marginBottom: "30px",
          textAlign: "center",
          px: 2,
        }}
      >
        <h1
          // variant="h3"
          // component="h1"
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
          Advantages of Trading with HC Finvest
        </h1>
      </Box>

      {/* ########################## */}
      {/* REUSABLE SECTION FUNCTION */}
      {/* ########################## */}

      {[
        {
          img: "Images/AdvantagesImages/chart (1).png",
          title: "SMART TRADING",
          left: [
            "Trade CFDs on Forex, Indices & Commodities",
            "100% Credit Bonus",
            "100% Supercharged Bonus",
            "Ongoing Promotions",
          ],
          right: [
            "Free Account Funding",
            "Performance based competitions",
            "Award winning affiliate program",
            "Trading rewards loyalty program",
          ],
        },
        {
          img: "Images/AdvantagesImages/chart.png",
          title: "GREAT TRADING CONDITIONS",
          left: [
            "Tight Spreads from as low as 0.00 (EURUSD)",
            "MYTFX portal enables online account management",
            "Transparency - Rollover Policy",
          ],
          right: [
            "24/5 dedicated support",
            "EAS, Scalping, and Hedging allowed",
            "Flexible leverage up to 1:2000",
          ],
        },
        {
          img: "Images/AdvantagesImages/statistics.png",
          title: "Superior Trading Tools",
          left: [
            "T18 Trading Tools",
            "Trading Calculators and Economic Calendar",
            "Innovative TFX App for traders on the go",
            "Execute Trades directly with One Click Trading",
          ],
          right: [
            "Exclusive HC Finvest Analysis",
            "Breaking Market News and Analysis",
            "Free Educational Material and live expert webinars",
            "TFX SMS Service",
          ],
        },
        {
          img: "Images/AdvantagesImages/multiple-users.png",
          title: "Multiple Account Types",
          left: ["ECN Insta Account from only $50"],
          right: ["Ecn Max Account with zero commission"],
        },
        {
          img: "Images/AdvantagesImages/secure-payment.png",
          title: "SAFE AND SECURE TRADING",
          left: [
            "Incorporated in Saint Vincent & the Grenadines",
            "Member of TFX Group",
            "Only major banks are used",
            "Audited by PWC",
          ],
          right: [
            "Client funds are held in segregated accounts",
            "Full Transparency",
            "Award winning affiliate program",
            "Acknowledged for superior service with industry awards",
          ],
        },
      ].map((section, index) => (
        <Card
          key={index}
          sx={{
            borderRadius: 3,
            boxShadow: 2,
            p: { xs: 2, sm: 3 },
            mx: { xs: "5%", sm: "8%", md: "10%" },
            mb: "30px",
          }}
        >
          <CardContent>
            {/* Title + Icon Centered */}
            <Box
              sx={{
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 2,
              }}
            >
              <img
                src={section.img}
                style={{ height: "60px", maxWidth: "100%" }}
              />
              <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1 }}>
                {section.title}
              </Typography>
            </Box>

            {/* 50% / 50% on Desktop — Full width on Mobile */}
            <Grid container spacing={2} justifyContent="center">
              {/* LEFT COLUMN */}
              <Grid item xs={12} sm={6} display="flex" justifyContent="center">
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    alignItems: "flex-start",
                    justifyContent: "center",
                    width: "100%",
                    maxWidth: "400px",
                    margin: "0 auto",
                  }}
                >
                  {section.left.map((text, i) => (
                    <Box key={i} display="flex" alignItems="center">
                      <CheckIcon sx={{ color: "#0066ff", mr: 1 }} />
                      <Typography textAlign="left">{text}</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>

              {/* RIGHT COLUMN */}
              <Grid item xs={12} sm={6} display="flex" justifyContent="center">
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    alignItems: "flex-start",
                    justifyContent: "center",
                    width: "100%",
                    maxWidth: "400px",
                    margin: "0 auto",
                  }}
                >
                  {section.right.map((text, i) => (
                    <Box key={i} display="flex" alignItems="center">
                      <CheckIcon sx={{ color: "#0066ff", mr: 1 }} />
                      <Typography textAlign="left">{text}</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}

      <TradingDetailsBox />
    </Container>
    </>
  );
};

export default Advantages;
