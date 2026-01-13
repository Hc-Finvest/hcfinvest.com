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

const SwapManagement = () => {
  const [value, setValue] = React.useState(null);
  const [marketType, setMarketType] = React.useState("");
  const [currencyOptions, setCurrencyOptions] = React.useState([]);
  const [swapLong, setSwapLong] = React.useState("");
  const [swapShort, setSwapShort] = React.useState("");

  const handleChange = async (event) => {
    const selectedMarket = event.target.value;
    setMarketType(selectedMarket);
    setValue(null);
    setSwapLong("");
    setSwapShort("");

    if (!selectedMarket) return;

    try {
      const res = await axios.get(
        `https://hcfinvest.onrender.com/api/swaps/currencyPairs/${selectedMarket}`
      );

      const formattedPairs = res.data.map((pair) => ({
        title: pair,
      }));

      setCurrencyOptions(formattedPairs);
    } catch (error) {
      console.error("Error fetching pairs:", error);
    }
  };

  // 🟩 UPDATE SWAP ON BUTTON CLICK
  const handleUpdate = async () => {
    if (!marketType || !value || !swapLong || !swapShort) {
      return alert("Please fill all fields");
    }

    const payload = {
      marketType,
      currencyPair: value.title,
      swapLong,
      swapShort,
    };

    try {
      const res = await axios.put(
        "https://hcfinvest.onrender.com/api/swaps/update",
        payload
      );
      alert(res.data.message);
    } catch (err) {
      alert("Update failed");
    }
  };

  // adminSwapManagement
  return (
        <>
              <Helmet>
                 <link rel="canonical" href="https://www.hcfinvest.comm/adminSwapManagement" />
              </Helmet>

      <Container maxWidth="md" sx={{ backgroundColor: "#fff", py: 4 }}>
      <Box sx={{ p: 4, background: "#fff", borderRadius: 2, boxShadow: 3 }}>
        <Typography
          variant="h2"
          sx={{
            fontSize: "2rem",
            fontWeight: "700",
            mb: 3,
            color: "#ff8c00",
            textAlign: "center",
          }}
        >
          UPDATE SWAPS
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Market Type */}
          <FormControl fullWidth>
            <InputLabel>Market Type</InputLabel>
            <Select
              value={marketType}
              label="Market Type"
              onChange={handleChange}
              sx={{textAlign:'left'}}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="Forex">Forex</MenuItem>
              <MenuItem value="Metals">Metals</MenuItem>
              <MenuItem value="Indices">Indices</MenuItem>
              <MenuItem value="Stocks">Stocks</MenuItem>
              <MenuItem value="Commodities">Commodities</MenuItem>
              <MenuItem value="Cryptocurrencies">Cryptocurrencies</MenuItem>
            </Select>
          </FormControl>

          {/* Currency Pair */}
          <Autocomplete
            fullWidth
            value={value}
            onChange={(e, newValue) => setValue(newValue)}
            options={currencyOptions}
            getOptionLabel={(opt) => opt.title}
            renderInput={(params) => (
              <TextField {...params} label="Select Currency Pair" />
            )}
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

          {/* UPDATE BUTTON */}
          <Box textAlign="right">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#0c1e49", px: 4, py: 1 }}
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

export default SwapManagement;
