import * as React from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  TextField,
} from "@mui/material";
import axios from "axios";
import { Helmet } from "react-helmet-async";

const AddSpread = () => {
  const [marketType, setMarketType] = React.useState("");
  const [accountType, setAccountType] = React.useState("");
  const [currencyPair, setCurrencyPair] = React.useState("");
  const [avgSpread, setAvgSpread] = React.useState("");
  const [lowSpread, setLowSpread] = React.useState("");
  const [leverageType, setLeverageType] = React.useState("");

  const handleSubmit = async () => {
    if (
      !marketType ||
      !accountType ||
      !currencyPair ||
      !avgSpread ||
      !lowSpread ||
      !leverageType
    ) {
      alert("❗ Please fill all fields");
      return;
    }

    const data = {
      marketType,
      accountType,
      currencyPair,
      avgSpread,
      lowSpread,
      leverageType,
    };

    try {
      await axios.post("https://hcfinvest.onrender.com/api/spreads/add", data);
      alert("✅ Spread added successfully!");

      setMarketType("");
      setAccountType("");
      setCurrencyPair("");
      setAvgSpread("");
      setLowSpread("");
      setLeverageType("");
    } catch (error) {
      console.error("Error adding spread:", error);
      alert("❌ Failed to add spread");
    }
  };

  return (
    <>
      <Helmet>
        <link rel="canonical" href="https://www.hcfinvest.com/adminAddSpread" />
      </Helmet>

      <Container maxWidth="md" sx={{ backgroundColor: "#fff", py: 4 }}>
      <Box
        sx={{
          width: "100%",
          background: "#fff",
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 2,
          boxShadow: 3,
          textAlign: "center",
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontSize: "2rem",
            fontWeight: "700",
            marginBottom: "1.5rem",
            color: "#ff8c00",
          }}
        >
          ADD SPREADS
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* MARKET TYPE */}
          <Box>
            <Typography mb={1} fontWeight="500" textAlign="left">
              Select Market Type
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Market Type</InputLabel>
              <Select
                value={marketType}
                onChange={(e) => setMarketType(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Forex">Forex</MenuItem>
                <MenuItem value="Metals">Metals</MenuItem>
                <MenuItem value="Indices">Indices</MenuItem>
                <MenuItem value="Stocks">Stocks</MenuItem>
                <MenuItem value="Commodities">Commodities</MenuItem>
                <MenuItem value="Cryptocurrencies">Cryptocurrencies</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* ACCOUNT TYPE */}
          <Box>
            <Typography mb={1} fontWeight="500" textAlign="left">
              Select Account Type
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Starter">Starter Account</MenuItem>
                <MenuItem value="ProTrader">Pro Trader Account</MenuItem>
                <MenuItem value="ZeroSpread">Zero Spread Account</MenuItem>
                <MenuItem value="Elite">Elite Account</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* CURRENCY PAIR */}
          <TextField
            label="Currency Pair"
            value={currencyPair}
            onChange={(e) => setCurrencyPair(e.target.value)}
            fullWidth
          />

          {/* AVG SPREAD */}
          <TextField
            label="Average Spread"
            type="number"
            value={avgSpread}
            onChange={(e) => setAvgSpread(e.target.value)}
            fullWidth
          />

          {/* LOW SPREAD */}
          <TextField
            label="Spread As Low As (Pips)"
            type="number"
            value={lowSpread}
            onChange={(e) => setLowSpread(e.target.value)}
            fullWidth
          />

          {/* LEVERAGE */}
          <FormControl fullWidth>
            <InputLabel>Leverage Type</InputLabel>
            <Select
              value={leverageType}
              onChange={(e) => setLeverageType(e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="1:100">1:100</MenuItem>
              <MenuItem value="1:2000">1:2000</MenuItem>
            </Select>
          </FormControl>

          <Box textAlign="right">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#0c1e49", px: 4 }}
              onClick={handleSubmit}
            >
              Add Spread
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
    </>
  );
};

export default AddSpread;
