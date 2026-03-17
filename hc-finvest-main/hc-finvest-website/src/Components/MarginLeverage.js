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

function createData(name, avg, low , leverage, commodity, crypto ) {
  return { name, avg, low , leverage, commodity, crypto  };
}

const starterRows = [
  createData("AUDCAD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("AUDCHF", 100000, 0.2, 0.01, 100, "1:2000"),
  createData("AUDJPY", 100000, 0.3, 0.01, 100, "1:2000"),
  createData("AUDNZD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("AUDUSD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("CADCHF", 100000, 0.2, 0.01, 100, "1:2000"),
  createData("CADJPY", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("CHFJPY", 100000, 0.1, 0.03, 100, "1:2000"),
  createData("EURAUD", 100000, 0.3, 0.01, 100, "1:2000"),
  createData("EURCAD", 100000, 0.5, 0.01, 100, "1:2000"),
  createData("EURCHF", 100000, 0.2, 0.01, 100, "1:2000"),
  createData("EURGBP", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("EURJPY", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("EURNZD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("EURSGD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("EURTRY", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("EURUSD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("GBPAUD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("GBPCAD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("GBPCHF", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("GBPJPY", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("GBPNZD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("GBPUSD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("NZDCAD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("NZDCHF", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("NZDUSD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("USDCAD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("USDCHF", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("USDHKD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("USDJPY", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("USDSGD", 100000, 0.1, 0.01, 100, "1:2000"),
  createData("USDTRY", 100000, 0.1, 0.01, 100, "1:2000"),
];

// ✅ Pro Trader Data
const ProTraderrows = [
  createData("XAUUSD", 100, 0.1, 0.01, 100, "1:100"),
  createData("XAGUSD", 5000, 0.1, 0.01, 100, "1:100"),
];

// ✅ Elite Data
const Eliterows = [
  createData("AUS200", 100, 1, 0.01, 100, "1:100"),
  createData("CHINA50", 100, 1, 0.01, 100, "1:100"),
  createData("FRA40", 100, 1, 0.01, 100, "1:100"),
  createData("ESP35", 100, 1, 0.01, 100, "1:100"),
  createData("HKG33", 10, 1, 0.01, 100, "1:100"),
  createData("JPN225", 100, 1, 0.01, 100, "1:100"),
  createData("NAS100", 1, 1, 0.01, 100, "1:100"),
  createData("SPX500", 10, 1, 0.01, 100, "1:100"),
  createData("UK100", 1, 1, 0.01, 100, "1:100"),
  createData("US2000", 1, 1, 0.01, 100, "1:100"),
  createData("US30", 1, 1, 0.01, 100, "1:100"),
  createData("USDX", 100, 1, 0.01, 100, "1:100"),
  createData("GER40", 1, 1, 0.01, 100, "1:100"),
];

const CommoditiesRow = [
  createData("UKOUSD", 100, 0.1, 0.01, 100, "1:100"),
  createData("USOUSD", 100, 0.1, 0.01, 100, "1:100"),
  createData("NATGAS", 10000, 0.1, 0.01, 100, "1:100"),
];

const CryptocurrencyRow = [
  createData("BTCUSD", 1, 0.5, 0.01, 50, "1:200"),
  createData("DOGEUSD", 10000, 2, 0.01, 10, "1:50"),
  createData("ETHUSD", 1, 0.5, 0.01, 50, "1:200"),
  createData("LTCUSD", 10, 2, 0.01, 10, "1:50"),
  createData("SOLUSD", 100, 2, 0.01, 100, "1:50"),
];

const MarginLeverage = () => {
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
            <link rel="canonical" href="https://www.hcfinvest.com/marginLeverage" />
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
          backgroundImage: `url('Images/MarginLeverageImages/hedgemarginlaverageimage(1).jpg')`, // 👈 replace with your image path
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
          Maximize Your Profits With Competitive
        </h1>

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
          Margin & Leverage
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
          Unlock Your Trading Potential With HC Finvest
        </h3>
      </Box>

      <Grid>
        <Grid sx={{ width: "80%", margin: "0 auto" }}>
          {/* <Typography
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
          </Typography> */}

          <Typography
            style={{
              fontSize: "17px",
              lineHeight: "32px",
              textAlign: "left",
              paddingTop: "50px",
            }}
          >
            "Discover the power of margin and leverage with HC Finvest. Our
            competitive margin rates and high leverage options are designed to
            help you maximize your trading potential and achieve your financial
            goals."
          </Typography>
          <Typography sx={{ marginTop: "10px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              Margin Trading :-
            </span>{" "}
            "Margin trading allows you to trade larger positions with a smaller
            amount of capital. By using borrowed funds from HC Finvest, you can
            amplify your trading power and potentially increase your profits."
          </Typography>
          <Typography sx={{ marginTop: "10px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              Leverage Options :-
            </span>{" "}
            "Leverage is a powerful tool that enables you to control larger
            positions with a smaller initial investment. At HC Finvest, we offer
            high leverage options, allowing you to take advantage of market
            opportunities and enhance your trading strategies."
          </Typography>

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
            Risk Management :-
          </Typography>

          <Typography sx={{ marginTop: "20px", textAlign: "left" }}>
            "While margin and leverage can significantly enhance your trading
            potential, it's important to manage your risks effectively. HC
            Finvest provides robust risk management tools and resources to help
            you navigate the markets with confidence."
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
              Check out the margin and leverage that we offer below :
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
                      <StyledTableCell>INSTRUMENTS</StyledTableCell>
                      <StyledTableCell align="center">
                        CONTRACT SIZE
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        MARGIN REQUIREMENT %
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        MIN VOLUME
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        MAX VOLUME
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
                          <StyledTableCell align="center">
                            {row.commodity}
                          </StyledTableCell>
                          <StyledTableCell align="center">
                            {row.crypto}
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

      <TradingDetailsBox />
    </Container>
      </>
  );
};

export default MarginLeverage;
