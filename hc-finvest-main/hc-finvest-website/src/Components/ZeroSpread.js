import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import MainContentCard2 from "./Utilities/MainContentCard2";
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import TradingDetailsBox from "./Utilities/TradingDetailsBox";
import { Helmet } from "react-helmet-async";

const ZeroSpread = () => {
  // const details = [
  //   { label: "Minimum Deposit:", value: "$500" },
  //   { label: "Spreads Starts From:", value: "0 pips" },
  //   { label: "Commission:", value: "$3 per side" },
  //   { label: "Leverage:", value: "Up to 1:2000" },
  //   { label: "Stop Out:", value: "30%" },
  //   { label: "Margin Call:", value: "40%" },
  //   { label: "Execution:", value: "Market Execution" },
  //   { label: "Minimum Trade Volume:", value: "0.01" },
  //   { label: "Currency:", value: "USD" },
  //   { label: "Swap:", value: "Yes" },
  // ];

  return (
      <>

            <Helmet>
              <link rel="canonical" href="https://www.hcfinvest.com/zeroSpreadAccount" />
            </Helmet>

              <Container sx={{ backgroundColor: "#fff" }} maxWidth={false} disableGutters>
      <ScrollToTopButton />
      <Box
        sx={{
          position: "relative",
          height: "475px",
          display: "flex",
          flexDirection: "column", // 👈 Stack text vertically
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          backgroundImage: `url('Images/ZeroSpreadImages/Zero spreads Account.webp')`, // 👈 replace with your image path
          backgroundSize: "cover",
          backgroundPosition: "center",
          marginBottom: "30px",
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
          Zero Spread Account
        </h1>
        <h3
          // variant="h5"
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
          Enter The World of trading in the easiest and simplest way possible.
        </h3>
      </Box>

 <div className="container py-5">
      <div className="row align-items-start">

        {/* Left Side */}
        <div className="col-12 col-lg-5 mb-4">
          <div className="account-details">
            <div
              className="account-box p-3 mb-3"
              style={{
                borderRadius: "10px",
                backgroundColor: "#ff8c00",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                color:'white'
              }}
            >
              <Typography variant="h4" className="mb-1" style={{ fontWeight: 600, textAlign:'center' }}>Zero Spread</Typography>
              <Typography className="mb-0" style={{ fontSize: "0.95rem", textAlign:'center' }}>
                Ideal for scalpers and fast movers — experience raw spreads from 0.0 pips.
              </Typography>
            </div>

            <div className="table-responsive">
              <table className="table mb-0">
                <tbody>
                  <tr><td>Minimum Deposit:</td><td>$500</td></tr>
                  <tr><td>Spreads Starts From:</td><td>0.0 pips</td></tr>
                  <tr><td>Commission:</td><td>$3 per side</td></tr>
                  <tr><td>Leverage:</td><td>Up to 1:2000</td></tr>
                  <tr><td>Stop Out:</td><td>30%</td></tr>
                  <tr><td>Margin Call:</td><td>40%</td></tr>
                  <tr><td>Execution:</td><td>Market Execution</td></tr>
                  <tr><td>Minimum Trade Volume:</td><td>0.01</td></tr>
                  <tr><td>Currency:</td><td>USD</td></tr>
                  <tr><td>Swap:</td><td>Yes</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="col-12 col-lg-7">
          <Typography variant="h4" sx={{fontWeight:'600'}} className="mb-4">
            Why choose our <span style={{ color: "#ff8c00" }}>Zero Spread Account</span>
          </Typography>

          <Typography style={{ lineHeight: 1.6 }}>
            The Zero Spread Account is tailored for scalpers, high-frequency traders, and those who prioritize fast execution and raw market conditions. With a minimum deposit of $100, it delivers zero spreads starting from 0.0 pips, giving traders direct market pricing and maximum precision.
          </Typography>
          <Typography style={{ lineHeight: 1.6 }}>
            A $3 per side commission applies, supporting ultra-low spread trading strategies. Leverage up to 1:2000, a 30% stop-out level, and a 40% margin call create an ideal balance between flexibility and risk control.
          </Typography>
          <Typography style={{ lineHeight: 1.6 }}>
            Market execution and a low minimum trade volume of 0.01 lots make this account an excellent fit for experts and professional traders aiming to capture small price movements efficiently.
          </Typography>

          <div className="d-flex flex-column flex-sm-row justify-content-lg-end gap-2 mt-3">
            <a
              href="https://trade.hcfinvest.com/signup"
              className="btn mb-2 mb-sm-0" style={{ backgroundColor: "#ff8c00", color: "white", border: "none" }}
            >
              Create Live Account
            </a>
            <a
              href="https://trade.hcfinvest.com/signup"
              className="btn"
              style={{ backgroundColor: "#ff8c00", color: "white" }}
            >
              Create Demo Account
            </a>
          </div>
        </div>
      </div>
    </div>

      <Grid
        container
        size={12}
        sx={{
          backgroundColor: "#f8f9fa",
          padding: "60px 0",
          marginTop: "70px",
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontSize: "2rem",
            fontWeight: "700",
            marginBottom: "1.5rem",
            width: "100%",
          }}
        >
          Access some of the most{" "}
          <span style={{ color: "#ff8c00" }}> POPULAR INSTRUMENTS </span> of the
          Market
        </Typography>

        <MainContentCard2 />
      </Grid>
      <TradingDetailsBox />
    </Container>
      </>
  );
};

export default ZeroSpread;
