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

// const StyledRow = styled(TableRow)(({ theme, index }) => ({
//   backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9f9f9",
// }));

// const comparisonData = [
//   { feature: "AUS200", mt5: "03:50–10:30, 11:10–24:00" },
//   { feature: "DE40", mt5: "02:05–04:00, 04:15–24:00" },
//   { feature: "US30", mt5: "02:00–24:00" },
//   { feature: "STOXX50", mt5: "02:05–04:00, 04:15–24:00" },
//   { feature: "FRANCE40", mt5: "10:00–00:00" },
//   { feature: "AFRICA40", mt5: "10:30–19:30" },
//   { feature: "ITALY40", mt5: "10:00–00:00" },
//   { feature: "UK100", mt5: "02:05–24:00" },
//   { feature: "HK50", mt5: "02:45–08:00, 09:00–12:30, 13:15–22:58" },
//   { feature: "SPAIN35", mt5: "10:00–22:00" },
//   { feature: "USTEC", mt5: "02:00–24:00" },
//   { feature: "JP225", mt5: "02:00–24:00" },
//   { feature: "US500", mt5: "02:00–24:00" },
//   { feature: "SWISS20", mt5: "10:00–00:00" },
//   { feature: "CHINA50", mt5: "04:00–11:29" },
//   { feature: "WIG20", mt5: "10:45–18:50" },
// ];

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

function createData(name, avg, low, leverage) {
  return { name, avg, low, leverage };
}

const starterRows = [
  createData("AUS200", 2.9, 2.5, "1:100"),
  createData("CHINA50", 7.5, 7.3, "1:100"),
  createData("FRA40", 3.5, 3.1, "1:100"),
  createData("ESP35", 5.5, 5.1, "1:100"),
  createData("HKG33", 0.4, 0.8, "1:100"),
  createData("JPN225", 0.14, 0.7, "1:100"),
  createData("NAS100", 0.7, 0.65, "1:100"),
  createData("SPX500", 0.45, 0.3, "1:100"),
  createData("UK100", 9.5, 9.1, "1:100"),
  createData("US2000", 1.3, 1.1, "1:100"),
  createData("US30", 5.4, 5.8, "1:100"),
  createData("USDX", 0.2, 0.5, "1:100"),
  createData("GER40", 4.8, 4.4, "1:100"),
];

// ✅ Pro Trader Data
const ProTraderrows = [
  createData("AUS200", 1.1, 1.0, "1:100"),
  createData("CHINA50", 0.6, 0.6, "1:100"),
  createData("FRA40", 0.9, 0.8, "1:100"),
  createData("ESP35", 5.5, 5.1, "1:100"),
  createData("HKG33", 0.5, 0.4, "1:100"),
  createData("JPN225", 5.7, 5.0, "1:100"),
  createData("NAS100", 0.7, 0.65, "1:100"),
  createData("SPX500", 0.45, 0.3, "1:100"),
  createData("UK100", 0.8, 0.6, "1:100"),
  createData("US2000", 0.45, 0.3, "1:100"),
  createData("US30", 1.5, 1.25, "1:100"),
  createData("USDX", 0.45, 0.35, "1:100"),
  createData("GER40", 0.6, 0.4, "1:100"),
];

// ✅ Elite Data
const Eliterows = [
  createData("AUS200", 1.1, 1.0, "1:100"),
  createData("CHINA50", 0.6, 0.6, "1:100"),
  createData("FRA40", 0.9, 0.8, "1:100"),
  createData("ESP35", 5.5, 5.1, "1:100"),
  createData("HKG33", 0.5, 0.4, "1:100"),
  createData("JPN225", 5.7, 5.0, "1:100"),
  createData("NAS100", 0.7, 0.65, "1:100"),
  createData("SPX500", 0.45, 0.3, "1:100"),
  createData("UK100", 0.8, 0.6, "1:100"),
  createData("US2000", 0.45, 0.3, "1:100"),
  createData("US30", 1.5, 1.25, "1:100"),
  createData("USDX", 0.45, 0.35, "1:100"),
  createData("GER40", 0.6, 0.4, "1:100"),
];

const Stocks = () => {
  const [active, setActive] = useState(1); // default: first button active

  const buttons = [
    { id: 1, label: "Starter" },
    { id: 2, label: "ProTrader" },
    { id: 3, label: "Elite" },
  ];

  // ✅ Define rows first before using it anywhere
  const [rows, setRows] = useState(starterRows);

  useEffect(() => {
    if (active === 1) setRows(starterRows);
    else if (active === 2) setRows(ProTraderrows);
    else if (active === 3) setRows(Eliterows);
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
              <link rel="canonical" href="https://www.hcfinvest.com/stocksMarket" />
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
          backgroundImage: `url('Images/StocksImages/NewhedgecapitalsimageStocks 2.jpg')`,
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
          Empower Your Investments With
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
          Stock Trading
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
          Trade With Confidence, Invest With Precision
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
            What is Stock?
          </Typography>

          <p
            style={{
              fontSize: "16px",
              lineHeight: "32px",
              textAlign: "left",
            }}
          >
            Stocks, also known as shares or equities, represent ownership in a
            company. When you buy a stock, you purchase a piece of that company
            and become a shareholder. This ownership entitles you to a portion
            of the company's assets and earnings, as well as voting rights on
            important company matters, depending on the type of stock you hold.
          </p>
        </Grid>

        <Grid sx={{ backgroundColor: "#f8f9fa", padding: "20px" }}>
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
              The Stock market operates Monday – Friday 00:05 – 23:50 GMT+1{" "}
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
                        AVERAGE SPREAD
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        SPREAD AS LOW AS (PIPS)
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        MAX LEVERAGE
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
                          <StyledTableCell align="center">
                            {row.leverage}
                          </StyledTableCell>
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

      <Grid sx={{ width: "80%", margin: "0 auto" }}>
        <Typography
          variant="h2"
          align="left"
          sx={{
            color: "#ff8c00",
            fontSize: "35px",
            fontWeight: "700",
            paddingTop: "50px",
            marginBottom:'20px'
          }}
        >
          What Are Dividends?
        </Typography>

        <Typography
          style={{
            // fontSize: "16px",
            // lineHeight: "32px",
            textAlign: "left",
            marginBottom:'10px'
          }}
        >
          Dividends are a portion of a company’s earnings distributed to
          shareholders as a reward for their investment. While traditional
          shareholders receive these directly, CFD traders experience
          adjustments to their positions based on corporate actions. These
          adjustments reflect price movements around the ex-dividend date,
          ensuring fairness in long and short positions. Rather than being fixed
          cash payouts, they are strategic value offsets influenced by market
          behavior. Dividend yield is typically expressed as a percentage of a
          stock’s price, helping traders evaluate potential returns relative to
          share value.
        </Typography>
      </Grid>

      <Grid
        container
        size={12}
        spacing={2}
        sx={{ width: "80%", margin: "0 auto" }}
      >
        <Grid item size={5}>
          <img
            src="Images/StocksImages/Stocks 3.jpg"
            style={{ width: "100%" }}
            alt="Stock market performance chart"
          />
        </Grid>
        <Grid item size={7}>
          <Typography
            variant="h2"
            align="left"
            sx={{
              color: "#ff8c00",
              fontSize: "35px",
              fontWeight: "700",
              paddingTop: "50px",
              marginBottom:'20px'
            }}
          >
            Ex-Dividend
          </Typography>

          <Typography
            style={{
              // fontSize: "16px",
              // lineHeight: "32px",
              textAlign: "left",
              marginBottom:'10px'
            }}
          >
            The ex-dividend date marks the cutoff for eligibility to receive the
            next dividend payout. Investors holding shares before this date
            qualify, while new buyers after the date do not.
          </Typography>
          <Typography
            style={{
              // fontSize: "16px",
              // lineHeight: "32px",
              textAlign: "left",
              marginBottom:'10px'
            }}
          >
            For CFD holders, adjustments are made to reflect the dividend's
            impact. Long positions may receive a positive balance adjustment,
            while short positions might see a deduction.
          </Typography>
          <Typography
            style={{
              // fontSize: "16px",
              // lineHeight: "32px",
              textAlign: "left",
              marginBottom:'10px'
            }}
          >
            Note: During high volatility or corporate events, leverage and
            dividend handling may be affected to mitigate risk.
          </Typography>
        </Grid>
      </Grid>

      <TradingDetailsBox />
    </Container>
      </>
  );
};
export default Stocks;
