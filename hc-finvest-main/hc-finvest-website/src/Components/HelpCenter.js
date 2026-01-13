import { Box, Container, Grid, Typography } from "@mui/material";
import HelpCenterCard from "./Utilities/HelpCenterCard";
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import { Helmet } from "react-helmet-async";

const HelpCenter = () => {
  return (
    <>

    <Helmet>
      <link rel="canonical" href="https://www.hcfinvest.com/helpCenter" />
    </Helmet>
              <Container sx={{ backgroundColor: "#fff" }} maxWidth={false} disableGutters>
      <ScrollToTopButton/>
      <Box
        sx={{
          position: "relative",
          height: "475px",
          display: "flex",
          flexDirection: "column", // 👈 Stack text vertically
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          backgroundImage: `url('Images/HelpCenterImages/Newhedgecapitalsimage_Helpcenter 1.jpg')`, // 👈 replace with your image path
          backgroundSize: "cover",
          backgroundPosition: "center",
          marginBottom: "30px",
          textAlign: "center",
        }}
      >
        <h1
          variant="h3"
          component="h1"
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
          Your Trusted Resource For All Trading Support
        </h1>

        <h3
          variant="h5"
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
          Welcome to the HC Finvest Help Centre
        </h3>
      </Box>

<Grid
  container
  spacing={2}
  sx={{
    padding: { xs: "15px", sm: "30px" },
    display: "flex",
    justifyContent: "center",
    alignItems: "stretch", // ensures all cards have same height
  }}
>
  {[
    {
      title: "Account Creation & Management",
      sen1: "What documents are required to open a Forex trading account?",
      sen2: "Can I open a trading account without verification?",
      sen3: "How long does it take to open a Forex trading account?",
    },
    {
      title: "Deposits & Withdrawals",
      sen1: "How long does it take to receive money after making a withdrawal?",
      sen2: "What is the minimum amount I can withdraw?",
      sen3: "Which payment methods can I use to make deposits and withdrawals?",
    },
    {
      title: "Trading Accounts",
      sen1: "How to Open an Account with HC Finvest?",
      sen2: "What are the differences between a demo and a real account?",
      sen3: "What are the differences between a demo and a real account?",
    },
    {
      title: "Trading Conditions",
      sen1: "In the case of a losing trade, is my balance or bonus deducted first?",
      sen2: "What are the trading hours for Cryptocurrencies?",
      sen3: "Will I experience slippage when trading with you?",
    },
    {
      title: "Promotions",
      sen1: "Are the trading bonuses you offer withdrawable?",
      sen2: "What happens to my bonus when I make an internal transfer or a withdrawal?",
      sen3: "Is there a limit to the number of people I can refer?",
    },
    {
      title: "Copy Trading",
      sen1: "What is Copy Trading?",
      sen2: "Do I need to pay for copy trading?",
      sen3: "Is copy trading available on your platform?",
    },
    {
      title: "Introducing Broker",
      sen1: "What is an Introducing Broker (IB)?",
      sen2: "What should I do If I have an issue regarding the IB program?",
      sen3: "Can I become an IB without trading experience?",
    },
  ].map((card, index) => (
    <Grid
      key={index}
      item
      xs={12}
      sm={6}
      md={3.5}
      sx={{
        padding: { xs: "5px", sm: "10px" },
        display: "flex",        // Make grid item a flex container
      }}
    >
      <HelpCenterCard
        title={card.title}
        sen1={card.sen1}
        sen2={card.sen2}
        sen3={card.sen3}
        sx={{
          flex: 1,               // Card will fill the height of Grid item
          display: "flex",
          flexDirection: "column"
        }}
      />
    </Grid>
  ))}
</Grid>
    </Container>
    </>
  );
};

export default HelpCenter;
