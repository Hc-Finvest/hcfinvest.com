import {
  Box,
  Button,
  Container,
  Grid,
  TablePagination,
  Typography,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import "./Styles/Forex.css";
import TradingDetailsBox from "./Utilities/TradingDetailsBox";
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import { Helmet } from "react-helmet-async";


const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#ff8c00",
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

function createData(name, avg, low) {
  return { name, avg, low };
}

const starterRows = [
  createData("AUDCAD", -0.81, -0.18),
  createData("AUDCHF", 3.87, -8.64),
  createData("AUDJPY", 3.49, -12.94),
  createData("AUDNZD", -3.05, -1.88),
  createData("AUDUSD", 1.02, -5.7),
  createData("CADCHF", 2.36, -6.94),
  createData("CADJPY", 3.79, -10.35),
  createData("CHFJPY", -0.92, -4.52),
  createData("EURCAD", -3.05, 0.24),
  createData("EURUSD", -9.82, 0.94),
  createData("EURCHF", 3.24, -11.14),
  createData("EURGBP", -7.76, 1.12),
  createData("EURJPY", 4.4, -15.78),
  createData("EURMXN", -576.13, 113.79),
  createData("EURNZD", -11.66, 3.2),
  createData("EURHUF", -48.25, 8.73),
  createData("EURNOK", -70.25, 9.19),
  createData("EURSEK", -3.53, -42.14),
  createData("EURSGD", -4.31, -6.13),
  createData("EURTRY", -3806.79, 693.98),
  createData("EURZAR", -351.64, 59.38),
  createData("GBPCAD", 3.33, -15.95),
  createData("GBPCHF", 7.07, -21.73),
  createData("GBPJPY", 11.21, -29.82),
  createData("GBPAUD", -3.11, -9.58),
  createData("GBPUSD", 0.1, -1.05),
  createData("GBPNZD", -4.41, -9.56),
  createData("GBPNOK", -21, -56.2),
  createData("NZDCAD", 1.33, -5.54),
  createData("NZDCHF", 3.72, -8.03),
  createData("NZDJPY", 4.95, -12.09),
  createData("NZDUSD", -0.67, -1.44),
  createData("USDCAD", 1.45, -7.26),
  createData("USDCHF", 6.45, -14.21),
  createData("USDCNH", -0.22, -51.37),
  createData("USDHUF", -29.36, 0.53),
  createData("USDMXN", -460.36, 64.05),
  createData("USDNOK", -18.38, -18.66),
  createData("USDRUB", -2.95, -2.92),
  createData("USDSEK", 14.61, -85.2),
  createData("USDTRY", -2927.78, 521.63),
  createData("USDCLP", -11.32, -6.94),
  createData("USDCOP", -124.75, 0.16),
  createData("USDIDR", -56.4, -41),
  createData("USDKRW", -2.11, -14.54),
  createData("USDTWD", -8.21, -11.51),
  createData("USDINR", -15.03, -0.18),
  createData("USDBRL", -292.97, 12.41),
  createData("USDTHB", -459.8, -140.8),
];

// ✅ Pro Trader Data
const ProTraderrows = [
  createData("XAUUSD", 9.02, -23.97),
  createData("XAGUSD", -3.13, 1.76),
];

// ✅ Elite Data
const Eliterows = [
  createData("AUS200", -1.6936, 0.4726),
  createData("CHINA50", -2.6756, 0.775),
  createData("FRA40", -1.2444, 0.2141),
  createData("ESP35", -1.3015, 0.7309),
  createData("HKG33", -37.169, 9.234),
  createData("JPN225", -257.99, -200.64),
  createData("NAS100", -4.4248, 1.2816),
  createData("SPX500", -12.451, 3.606),
  createData("UK100", -1.8433, 0.5663),
  createData("US2000", -0.3495, 0.2077),
  createData("US30", -9.1839, 2.66),
  createData("USDX", -2.33, -2.55),
  createData("GER40", -3.4, 0.5851),
];

const CommoditiesRow = [
  createData("UKOUSD", 15.3517, -47.7633),
  createData("USOUSD", 22.1821, -54.9605),
  createData("NATGAS", 4.36, -14.84),
];

const CryptocurrencyRow = [
  createData("BTCUSD", -54.06, -27.04),
  createData("DOGEUSD", -5.14, -3.71),
  createData("ETHUSD", -10.52, -6.76),
  createData("LTCUSD", -5.36, -3.03),
  createData("SOLUSD", -4.09, -1.8),
];


const Swap = () => {
  const [active, setActive] = useState(1); // default: first button active

  const buttons = [
    { id: 1, label: "Forex" },
    { id: 2, label: "Metals" },
    { id: 3, label: "Indices" },
    { id: 4, label: "Commodities" },
    { id: 5, label: "Cryptocurrencies" },
  ];

  // ✅ Define rows first before using it anywhere
  const [rows, setRows] = useState(starterRows);

  useEffect(() => {
    if (active === 1) setRows(starterRows);
    else if (active === 2) setRows(ProTraderrows);
    else if (active === 3) setRows(Eliterows);
    else if (active === 4) setRows(CommoditiesRow);
    else if (active === 5) setRows(CryptocurrencyRow);
  }, [active]);

  // const [selectedRows, setSelectedRows] = useState(rows);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
      <>

              <Helmet>
                <link rel="canonical" href="https://www.hcfinvest.com/swapMarket" />
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
          backgroundImage: `url('Images/SwapImages/Newhedgecapitalsimage_swaps (1).jpg')`, // 👈 replace with your image path
          backgroundSize: "cover",
          backgroundPosition: "center",
          marginBottom: "30px",
          textAlign: "center",
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
          Understanding Swaps
        </h1>

        <h3
          // variant="h5"
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
          Earn or pay-know your Swaps
        </h3>
      </Box>

      <Grid>
        <Grid sx={{ width: "80%", margin: "0 auto" }}>
          <Typography
            variant="h2"
            align="left"
            sx={{
              color: "#ff8c00",
              fontSize: "35px",
              fontWeight: "700",
              paddingTop: "50px",
            }}
          >
            What is Swap?
          </Typography>

          <Typography
            style={{
              // fontSize: "16px",
              // lineHeight: "32px",
              textAlign: "left",
            }}
          >
            Swaps are interest fees charged or credited for holding a trade
            overnight. They depend on the interest rate difference between the
            two currencies in a pair.
          </Typography>

          <Typography
            variant="h2"
            align="left"
            sx={{
              color: "#ff8c00",
              fontSize: "22px",
                fontWeight: "600",
              paddingTop: "30px",
            }}
          >
            Key Points About Forex Swap :-
          </Typography>

          <Typography sx={{ marginTop: "20px", textAlign: "left" }}>
            A fee is deducted if the interest rate on the base currency is lower
            than the quote currency.
          </Typography>
          <Typography sx={{ marginTop: "10px", textAlign: "left" }}>
            A swap credit is added if the base currency has a higher interest
            rate than the quote currency.
          </Typography>
          <Typography sx={{ marginTop: "10px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              Positive Swap :-
            </span>{" "}
            You get paid for holding a trade overnight.
          </Typography>

          <Typography sx={{ marginTop: "10px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              Negative Swap :-
            </span>{" "}
            You pay a fee for holding a trade overnight.
          </Typography>
        </Grid>
        <Grid
          sx={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            marginTop: "50px",
          }}
        >
          <Box
            sx={{
              width: "80%",
              margin: "0 auto",
            }}
          >
            <Typography
              align="left"
              sx={{
                fontSize: "2rem",
                color: "#ff8c00",
                lineHeight: "1",
                fontWeight: "600",
              }}
            >
              {" "}
              Pick Your Pairs
            </Typography>
            <p
              style={{
                color: "var(--bs-secondary-color) !important",
                opacity: "1",
                textAlign: "left",
              }}
            >
              Check out the swaps that we offer below :
            </p>

<Box
  sx={{
    display: "flex",
    justifyContent: { xs: "center", sm: "left" }, // center on xs, left on sm+
    flexWrap: "wrap", // wrap buttons on small screens
    gap: { xs: 1, sm: 2 }, // smaller gap on xs, bigger on sm+
    mb: 2,
  }}
>
  {buttons.map((btn) => (
    <Button
      key={btn.id}
      variant="contained"
      onClick={() => setActive(btn.id)}
      sx={{
        backgroundColor: active === btn.id ? "#ff8c00" : "white",
        color: active === btn.id ? "white" : "#ff8c00",
        border: "1px solid #ff8c00",
        textTransform: "none",
        fontWeight: "bold",
        minWidth: { xs: "100%", sm: "auto" }, // full width on xs screens, auto on sm+
        "&:hover": {
          backgroundColor: active === btn.id ? "#ff8c00" : "#fff5e6",
        },
      }}
    >
      {btn.label}
    </Button>
  ))}
</Box>

            {/* Table */}
            <Paper sx={{ width: "100%", overflow: "hidden" }}>
              <TableContainer>
                <Table sx={{ minWidth: 700 }} aria-label="customized table">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>SYMBOLS</StyledTableCell>
                      <StyledTableCell align="center">
                        Swap Long
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        Swap Short
                      </StyledTableCell>

                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((row, index) => (
                        <StyledTableRow key={index}>
                          <StyledTableCell component="th" scope="row">
                            {row.name}
                          </StyledTableCell>
                          <StyledTableCell align="center">
                            {row.avg}
                          </StyledTableCell>
                          <StyledTableCell align="center">
                            {row.low}
                          </StyledTableCell>
                          {/* <StyledTableCell align="center">
                            {row.leverage}
                          </StyledTableCell> */}
                        </StyledTableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <TablePagination
                rowsPerPageOptions={[10, 20, 30]}
                component="div"
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          </Box>
        </Grid>
      </Grid>

      <TradingDetailsBox />
    </Container>
      </>
  );
};
export default Swap;
