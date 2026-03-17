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
import Autocomplete from "@mui/material/Autocomplete";
import axios from "axios";
import { Helmet } from "react-helmet-async";

const SpreadManagement = () => {
  const [marketType, setMarketType] = React.useState("");
  const [accountType, setAccountType] = React.useState("");
  const [currencyList, setCurrencyList] = React.useState([]);
  const [currency, setCurrency] = React.useState(null);
  const [avgSpread, setAvgSpread] = React.useState("");
  const [lowSpread, setLowSpread] = React.useState("");
  const [leverageType, setLeverageType] = React.useState("");

  // 🔥 Fetch pairs whenever both fields are chosen
const fetchPairs = async (market, account) => {
  if (!market || !account) return;

  try {
    const res = await axios.get(
      "https://hcfinvest.onrender.com/api/spreads/get-pairs",
      { params: { marketType: market, accountType: account } }
    );

    console.log("Fetched pairs:", res.data);

    // FIX: backend returns { currencyPairs: [ {currencyPair:"AUDCAD"} ] }
    const formatted = res.data.currencyPairs.map((item) => ({
      title: item.currencyPair,
    }));

    setCurrencyList(formatted);
  } catch (err) {
    console.error("Error fetching pairs:", err);
    setCurrencyList([]);
  }
};

  // When Market changes
  const handleMarketChange = (e) => {
    const value = e.target.value;
    setMarketType(value);
    setCurrency(null);
    fetchPairs(value, accountType);
  };

  // When Account changes
  const handleAccountChange = (e) => {
    const value = e.target.value;
    setAccountType(value);
    setCurrency(null);
    fetchPairs(marketType, value);
  };

  const handleUpdate = async () => {
    if (!marketType || !accountType || !currency || !avgSpread || !lowSpread) {
      alert("Please fill all fields");
      return;
    }

    const payload = {
      marketType,
      accountType,
      currencyPair: currency.title,
      avgSpread,
      lowSpread,
      leverageType,
    };

    try {
      const res = await axios.put(
        "https://hcfinvest.onrender.com/api/spreads/update",
        payload
      );
      alert(res.data.message);
    } catch (error) {
      alert("Update failed");
    }
  };

  // adminSpreadManagement

  return (
      <>
          <Helmet>
            <link rel="canonical" href="https://www.hcfinvest.com/adminSpreadManagement" />
          </Helmet>

      <Container maxWidth="md" sx={{ backgroundColor: "#fff", py: 4 }}>
      <Box sx={{ p: 4, background: "#fff", borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h4" fontWeight={700} mb={3} color="#ff8c00">
          Update Spread
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Market Type */}
          <FormControl fullWidth>
            <InputLabel>Market Type</InputLabel>
            <Select
              value={marketType}
              label="Market Type"
              onChange={handleMarketChange}
              sx={{textAlign:'left'}}
            >
              <MenuItem value="Forex">Forex</MenuItem>
              <MenuItem value="Metals">Metals</MenuItem>
              <MenuItem value="Indices">Indices</MenuItem>
              <MenuItem value="Stocks">Stocks</MenuItem>
              <MenuItem value="Commodities">Commodities</MenuItem>
              <MenuItem value="Cryptocurrencies">Cryptocurrencies</MenuItem>
            </Select>
          </FormControl>

          {/* Account Type */}
          <FormControl fullWidth>
            <InputLabel>Account Type</InputLabel>
            <Select
              value={accountType}
              label="Account Type"
              onChange={handleAccountChange}
              sx={{textAlign:'left'}}
            >
              <MenuItem value="Starter">Starter Account</MenuItem>
              <MenuItem value="ProTrader">Pro Trader Account</MenuItem>
              <MenuItem value="ZeroSpread">Zero Spread Account</MenuItem>
              <MenuItem value="Elite">Elite Account</MenuItem>
            </Select>
          </FormControl>

          {/* Currency Pair */}
          <Autocomplete
            fullWidth
            value={currency}
            onChange={(e, newValue) => setCurrency(newValue)}
            options={currencyList}
            getOptionLabel={(opt) => opt.title}
            renderInput={(params) => (
              <TextField {...params} label="Select Currency Pair" />
            )}
          />

          {/* Average Spread */}
          <TextField
            fullWidth
            label="Average Spread"
            type="number"
            value={avgSpread}
            onChange={(e) => setAvgSpread(e.target.value)}
          />

          {/* Low Spread */}
          <TextField
            fullWidth
            label="Spread As Low As (Pips)"
            type="number"
            value={lowSpread}
            onChange={(e) => setLowSpread(e.target.value)}
          />

          {/* Leverage Type */}
          <FormControl fullWidth>
            <InputLabel>Leverage Type</InputLabel>
            <Select
              value={leverageType}
              label="Leverage Type"
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
              onClick={handleUpdate}
            >
              Update
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
      </>
  );
};

export default SpreadManagement;
