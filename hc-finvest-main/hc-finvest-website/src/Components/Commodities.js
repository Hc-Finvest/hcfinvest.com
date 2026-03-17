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

function createData(name, avg, low, leverage) {
  return { name, avg, low, leverage };
}

const starterRows = [
  createData("UKOUSD", 0.2, 0.18, "1:100"),
  createData("USOUSD", 0.2, 0.18, "1:100"),
  createData("NATGAS", 0.18, 0.17, "1:100"),
];

// ✅ Pro Trader Data
const ProTraderrows = [
  createData("UKOUSD", 0.15, 0.13, "1:100"),
  createData("USOUSD", 0.15, 0.13, "1:100"),
  createData("NATGAS", 0.13, 0.12, "1:100"),
];

// ✅ Elite Data
const Eliterows = [
  createData("UKOUSD", 0.15, 0.13, "1:100"),
  createData("USOUSD", 0.15, 0.13, "1:100"),
  createData("NATGAS", 0.13, 0.12, "1:100"),
];

const Commodities = () => {
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
        <link rel="canonical" href="https://www.hcfinvest.com/commoditiesMarket" />
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
          backgroundImage: `url('Images/CommoditiesImages/Newhedgecapitalsimagecommodity (2) 11.jpg')`, // 👈 replace with your image path
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
          Trade Commodities With
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
          Forex Precision
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
          Trade Unlock the Potential of Global Markets With HC Finvest
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
              paddingTop: "20px",
            }}
          >
            What is Commodities?
          </Typography>

          <Typography
            style={{
              // fontSize: "16px",
              // lineHeight: "32px",
              textAlign: "left",
              marginBottom: "10px",
            }}
          >
            Commodities are raw materials or primary agricultural products that
            can be bought and sold, such as metals, oil, grain, and livestock.
            They are often traded on exchanges and can be an essential part of
            forex trading. Here’s a bit more about them:
          </Typography>

          <Typography
            variant="h2"
            align="left"
            sx={{
              color: "#ff8c00",
              fontSize: "35px",
              //   fontWeight: "700",
              paddingTop: "20px",
              fontWeight: "700",
            }}
          >
            Why Trade Commodities?
          </Typography>

          <Typography sx={{ marginTop: "20px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              Diversification :-
            </span>{" "}
            Adding commodities to a portfolio can help diversify investments and
            reduce risk.
          </Typography>
          <Typography sx={{ marginTop: "10px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              Inflation Hedge :-
            </span>{" "}
            Commodities often retain their value during inflationary periods,
            making them a hedge against inflation.
          </Typography>
          <Typography sx={{ marginTop: "10px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              High Volatility :-
            </span>{" "}
            Commodities can experience significant price movements, providing
            trading opportunities.
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
              The Commodities market operates Monday – Friday 00:05 – 23:50
              GMT+1
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

        <Grid sx={{ width: "80%", margin: "0 auto" }}>
          <Typography
            variant="h2"
            //   align="left"
            sx={{
              color: "#ff8c00",
              fontSize: "35px",
              fontWeight: "700",
              paddingTop: "50px",
            }}
          >
            Commodities Market Characteristics
          </Typography>

          <Typography
            style={{
              fontSize: "16px",
              lineHeight: "32px",
              textAlign: "left",
              marginTop: "30px",
            }}
          >
            Commodities are raw materials or primary agricultural products that
            can be bought and sold, such as metals, oil, grain, and livestock.
            They are often traded on exchanges and can be an essential part of
            forex trading. Here’s a bit more about them:
          </Typography>
          <Typography
            style={{
              fontSize: "16px",
              lineHeight: "32px",
              textAlign: "left",
            }}
          >
            Commodity prices are influenced by economic, political, and
            environmental factors such as:
          </Typography>

          <Typography sx={{ marginTop: "20px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              Supply and Demand :
            </span>{" "}
            Prices are largely determined by shifts in supply and demand.
          </Typography>
          <Typography sx={{ marginTop: "20px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              Technological Advances :
            </span>{" "}
            New technology impacts how commodities are sourced and processed.
          </Typography>
          <Typography sx={{ marginTop: "20px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              Geopolitical Tensions :
            </span>{" "}
            Political instability can lead to fluctuations in commodity prices.
          </Typography>
          <Typography sx={{ marginTop: "20px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              Weather Conditions & Natural Disasters :
            </span>{" "}
            Severe weather and disasters can disrupt supply chains.
          </Typography>

          <Typography
            style={{
              fontSize: "16px",
              lineHeight: "32px",
              marginTop: "30px",
              textAlign: "left",
            }}
          >
            Commodities can be an important means for investors to diversify
            their portfolio. HC Finvest offers traders and investors the
            opportunity to participate in the commodity markets by trading
            derivatives on a range of metals, energies, and soft commodities
            with low margin requirements and hedging strategies allowed to
            manage their price exposure.
          </Typography>

          <Typography sx={{ marginTop: "20px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              Diversification :
            </span>{" "}
            Commodities offer a valuable tool for portfolio diversification.
          </Typography>

          <Typography sx={{ marginTop: "20px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              Low Margin & Hedging :
            </span>{" "}
            HC Finvest offers low margin requirements and hedging strategies for
            price exposure management.
          </Typography>
          <Typography sx={{ marginTop: "20px", textAlign: "left" }}>
            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
              Award-winning Broker :
            </span>{" "}
            Trade with confidence through HC Finvest, an awarded multi-asset
            broker.
          </Typography>

          <Typography
            style={{
              fontSize: "17px",
              lineHeight: "32px",
              fontWeight: "600",
              marginTop: "30px",
              textAlign: "left",
            }}
          >
            Get the confidence of trading with an awarded multi-asset broker.
            Start trading derivatives on Commodities with HC Finvest!
          </Typography>
        </Grid>

<div className="container py-5">
      <div className="row align-items-center">
        
        {/* Text Section */}
        <div className="col-lg-6 mb-4 mb-lg-0">
          <Typography variant="h4" className="fw-bold" style={{ fontWeight:'600', color: "#ff8c00" }}>
            Getting Started with Commodity Trading
          </Typography>

          <Typography
            style={{
              fontSize: "16px",
              lineHeight: "1.6",
              marginBottom: "20px",
              color: "#555"
            }}
          >
            Commodity trading lets you speculate on price movements without owning the
            physical asset. You can take advantage of price rises or drops using CFDs
            (Contracts for Difference).
          </Typography>

          <Typography
            style={{
              fontSize: "16px",
              lineHeight: "1.6",
              marginBottom: "20px",
              color: "#555",
            }}
          >
            Prices are influenced by global supply and demand. For example, if the
            supply of oil increases due to better production, prices may fall. If
            supply is disrupted, prices might spike.
          </Typography>

          <Typography
            style={{
              fontSize: "16px",
              lineHeight: "1.6",
              marginBottom: "20px",
              color: "#555",
            }}
          >
            Other factors such as natural disasters, political events, and market news
            also impact commodity prices. Traders use this volatility to seek profit
            opportunities.
          </Typography>
        </div>

        {/* Image Section */}
        <div className="col-lg-6 text-center">
          <img
            src="/Images/CommoditiesImages/Commodity 2.jpg"
            alt="Commodity Trading Graph"
            className="img-fluid rounded"
            loading="lazy"
          />
        </div>

      </div>
    </div>
      </Grid>
      <TradingDetailsBox />
    </Container>
    </>
  );
};
export default Commodities;
