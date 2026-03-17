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

const AddSwap = () => {
  const [marketType, setMarketType] = React.useState("");
  const [currencyPair, setCurrencyPair] = React.useState("");
  const [swapLong, setSwapLong] = React.useState("");
  const [swapShort, setSwapShort] = React.useState("");

  const handleSubmit = async () => {
    if (!marketType || !currencyPair || !swapLong || !swapShort) {
      alert("❗ Please fill all fields");
      return;
    }

    const data = {
      marketType,
      currencyPair, // ✅ Correct key
      swapLong: Number(swapLong),
      swapShort: Number(swapShort),
    };

    try {
      await axios.post("https://hcfinvest.onrender.com/api/swaps", data);
      alert("✅ Swap added successfully!");

      // Reset fields
      setMarketType("");
      setCurrencyPair("");
      setSwapLong("");
      setSwapShort("");
    } catch (error) {
      console.error("Error adding swap:", error);

      const msg =
        error?.response?.data?.message || "❌ Failed to add swap. Try again.";

      alert(msg);
    }
  };

  return (
      <>
        <Helmet>
          <link rel="canonical" href="https://www.hcfinvest.com/adminAddSwap" />
        </Helmet>

         <Container maxWidth="md" sx={{ backgroundColor: "#fff", py: 4 }}>
        <Box sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography
          variant="h2"
          sx={{ fontSize: "2rem", fontWeight: "700", mb: 3, color: "#ff8c00" }}
        >
          ADD SWAP
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Market Type */}
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

          {/* Currency Pair */}
          <TextField
            fullWidth
            label="Currency Pair"
            placeholder="Example: EURUSD, XAUUSD"
            value={currencyPair}
            onChange={(e) => setCurrencyPair(e.target.value.toUpperCase())}
          />

          {/* Swap Long */}
          <TextField
            fullWidth
            label="Swap Long"
            type="number"
            value={swapLong}
            onChange={(e) => setSwapLong(e.target.value)}
          />

          {/* Swap Short */}
          <TextField
            fullWidth
            label="Swap Short"
            type="number"
            value={swapShort}
            onChange={(e) => setSwapShort(e.target.value)}
          />

          {/* Submit */}
          <Box textAlign="right">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#0c1e49", px: 4, py: 1 }}
              onClick={handleSubmit}
            >
              Add Swap
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
      </>
  );
};

export default AddSwap;
