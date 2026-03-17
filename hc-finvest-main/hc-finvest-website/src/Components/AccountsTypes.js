import { Box, Container, Typography } from "@mui/material";
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import TradingBoxDetails from "./Utilities/TradingDetailsBox.js";
import { Helmet } from "react-helmet-async";



const cardData = [
  {
    title: "Starter",
    description:
      "Perfect for beginners — start trading with just $50 and zero commission.",
    details: [
      { label: "Min. Deposit:", value: "$50" },
      { label: "Spread Info:", value: "0.18 pips" },
      { label: "Commission:", value: "$0" },
      { label: "Leverage:", value: "Upto 1:2000" },
      { label: "Stop Out:", value: "30%" },
      { label: "Margin Call:", value: "40%" },
      { label: "Execution:", value: "Market" },
      { label: "Min. Trade Volume:", value: "0.01" },
      { label: "Currency:", value: "USD" },
      { label: "Swap:", value: "Yes" },
    ],
  },
  {
    title: "Pro Trader",
    description:
      "Tight spreads and smart tools designed for serious individual traders.",
    details: [
      { label: "Min. Deposit:", value: "$100" },
      { label: "Spread Info:", value: "0.10 pips" },
      { label: "Commission:", value: "$2/side" },
      { label: "Leverage:", value: "Upto 1:2000" },
      { label: "Stop Out:", value: "30%" },
      { label: "Margin Call:", value: "40%" },
      { label: "Execution:", value: "Market" },
      { label: "Min. Trade Volume:", value: "0.01" },
      { label: "Currency:", value: "USD" },
      { label: "Swap:", value: "Yes" },
    ],
  },
  {
    title: "Zero Spread",
    description:
      "Ideal for scalpers and fast movers — raw spreads from 0.0 pips.",
    details: [
      { label: "Min. Deposit:", value: "$500" },
      { label: "Spread Info:", value: "0.0 pips" },
      { label: "Commission:", value: "$3/side" },
      { label: "Leverage:", value: "Upto 1:2000" },
      { label: "Stop Out:", value: "30%" },
      { label: "Margin Call:", value: "40%" },
      { label: "Execution:", value: "Market" },
      { label: "Min. Trade Volume:", value: "0.01" },
      { label: "Currency:", value: "USD" },
      { label: "Swap:", value: "Yes" },
    ],
  },
  {
    title: "Elite",
    description: "Lower commissions, no swaps for high-volume traders.",
    details: [
      { label: "Min. Deposit:", value: "$5000" },
      { label: "Spread Info:", value: "0.0 pips" },
      { label: "Commission:", value: "$1.5/side" },
      { label: "Leverage:", value: "Upto 1:2000" },
      { label: "Stop Out:", value: "30%" },
      { label: "Margin Call:", value: "40%" },
      { label: "Execution:", value: "Market" },
      { label: "Min. Trade Volume:", value: "0.01" },
      { label: "Currency:", value: "USD" },
      { label: "Swap", value: "No Swap" },
    ],
  },
];


const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    padding: "20px",
    gap: "40px",
    flexWrap: "wrap",
    background: "#f8f9fa",
  },

  card: {
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow:
      "0px 4px 10px rgba(0, 0, 0, 0.1)",
    width: "350px",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#ff8c00", // orange color
    color: "white",
    fontWeight: "600",
    textAlign: "center",
    padding: "12px 0",
    borderTopLeftRadius: "10px",
    borderTopRightRadius: "10px",
    fontSize: "22px",
    height:'70px',
    display:'flex',
    justifyContent:'center',
    alignItems:'center'
  },
  description: {
    padding: "10px 15px",
    fontWeight: "600",
    fontSize: "15px",
    lineHeight: "1.3",
    color: "#1a1a1a",
  },
  detailRow: {
    border: "1.1px solid #bbb",
    borderRadius: "5px",
    margin: "6px 15px",
    padding: "8px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems:'center',
    fontSize: "13px",
    color: "#333",
    height:'50px'
  },
  label: {
    fontWeight: "500",
  },
  value: {
    fontWeight: "400",
  },
};

const AccountsTypes = () => {
  return (
    <>
     <Helmet>
      <link rel="canonical" href="https://www.hcfinvest.com/accountsTypesAccount" />
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
          backgroundImage: `url('Images/AccountsTypesImages/NewhedgecapitalsimageAccount types 1.jpg')`, // 👈 replace with your image path
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
          Discover Your Ideal Forex
        </h1>
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
          Trading Account
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
          Tailored Solutions For Every Trader's Journey
        </h3>
      </Box>

      <Typography
        variant="h2"
        sx={{ color: "#101828", fontWeight: "700", fontSize: "2.1rem" , marginBottom:'20px' }}
      >
        {" "}
        Trading Account Type{" "}
      </Typography>

    <div style={styles.container} >
      {cardData.map(({ title, description, details }) => (
        <div key={title} style={styles.card}>
          <div style={styles.header}>{title}</div>
          <div style={styles.description}>{description}</div>
          {details.map(({ label, value }) => (
            <div key={label} style={styles.detailRow}>
              <span style={styles.label}>{label}</span>
              <span style={styles.value}>{value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>

      <TradingBoxDetails/>

    </Container>
    </>
  );
};

export default AccountsTypes;
