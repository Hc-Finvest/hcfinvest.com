import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import MainContentCard2 from "./Utilities/MainContentCard2";
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import { Helmet } from "react-helmet-async";

const Starter = () => {
  // const details = [
  //   { label: "Minimum Deposit:", value: "$50" },
  //   { label: "Spreads Starts From:", value: "0.18 pips" },
  //   { label: "Commission:", value: "$0" },
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
          <link rel="canonical" href="https://www.hcfinvest.com/starterAccount" />
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
          backgroundImage: `url('Images/StarterImages/NewhedgecapitalsimageStandard acc1.jpg')`, // 👈 replace with your image path
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
          Starter Account
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
                color:'#fff'
              }}
            >
              <Typography variant="h4" className="mb-1" style={{ fontWeight: 600, textAlign:'center' }}>Starter</Typography>
              <Typography className="mb-0" style={{ fontSize: "0.95rem" , textAlign:'center' }}>
                Perfect for beginners — start trading with just $50 and zero commission.
              </Typography>
            </div>

            <div className="table-responsive">
              <table className="table mb-0">
                <tbody>
                  <tr><td>Minimum Deposit:</td><td>$50</td></tr>
                  <tr><td>Spreads Starts From:</td><td>0.18 pips</td></tr>
                  <tr><td>Commission:</td><td>$0</td></tr>
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
            Why choose our{" "}
            <span style={{ color: "#ff8c00" }}>Starter Account</span>
          </Typography>

          <Typography style={{ lineHeight: 1.6 }}>
            The Starter Account is perfect for beginners who want to enter the world of trading with minimal risk and investment. With a minimum deposit of just $50, it offers commission-free trading and competitive spreads starting from 0.18 pips.
          </Typography>
          <Typography style={{ lineHeight: 1.6 }}>
            Traders can access high leverage of up to 1:2000, allowing for flexible position sizes even with small capital.
          </Typography>
          <Typography style={{ lineHeight: 1.6 }}>
            The account features a 30% stop-out level and 40% margin call, ensuring controlled risk management. With market execution, a low minimum trade volume of 0.01 lots, and USD as the base currency, the Starter Account provides a simple yet powerful setup for learning and growing in the financial markets.
          </Typography>

          <div className="d-flex flex-column flex-sm-row justify-content-lg-end gap-2 mt-3">
            <a
              href="https://www.heddgecapitals.com/signup"
              className="btn mb-2 mb-sm-0" style={{ backgroundColor: "#ff8c00", color: "white", border: "none" }}
            >
              Create Live Account
            </a>
            <a
              href="https://www.heddgecapitals.com/signup"
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
    </Container>
    </>
  );
};
export default Starter;
