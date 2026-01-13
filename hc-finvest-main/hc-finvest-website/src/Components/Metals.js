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
import {
  faCoins,
  faTint,
  faPercent,
  faClock,
  faBalanceScale,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  createData("XAUUSD", 0.25, 0.23, "1:100"),
  createData("XAGUSD", 0.23, 0.2, "1:100"),
];

// ✅ Pro Trader Data
const ProTraderrows = [
  createData("XAUUSD", 0.13, 0.11, "1:100"),
  createData("XAGUSD", 0.13, 0.12, "1:100"),
];

// ✅ Elite Data
const Eliterows = [
  createData("XAUUSD", 0.1, 0.9, "1:100"),
  createData("XAGUSD", 0.13, 0.11, "1:100"),
];

const Metals = () => {
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
      <link rel="canonical" href="https://www.hcfinvest.com/metalsMarket" />
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
          backgroundImage: `url('Images/MetalsImages/NewhedgecapitalsimageMetals 2.jpg')`, // 👈 replace with your image path
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
          Trade Precious Metals With Expertise
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
          Strategic Forex Trading for Global Growth{" "}
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
              marginBottom:'10px'
            }}
          >
            What is Metals?
          </Typography>

          <Typography
            style={{
              // fontSize: "16px",
              // lineHeight: "32px",
              textAlign: "left",
              marginBottom:'10px'
            }}
          >
            At HC Finvest, our Forex Metal Trading division is dedicated to
            providing top-tier trading solutions for precious metals like gold
            and silver. Our expert team leverages advanced market analysis and
            cutting-edge technology to offer precise and strategic trading
            opportunities. Investing in metals can serve as a HC Finvest against
            economic instability, providing a reliable store of value.
          </Typography>
          <Typography
            style={{
              // fontSize: "16px",
              // lineHeight: "32px",
              textAlign: "left",
              marginBottom:'20px'
            }}
          >
            With HC Finvest, you gain access to comprehensive market insights,
            robust risk management practices, and a commitment to transparency
            and excellence. Explore the advantages of Forex Metal Trading with
            HC Finvest, and let us help you secure and grow your wealth
          </Typography>
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
                color: "#101828",
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
              The Metals market operates Monday – Friday 00:05 – 23:50 GMT+1
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

          <Box
            sx={{
              p: 4,
              maxWidth: "900px",
              mx: "auto",
              color: "#1a1a1a",
              textAlign: "left",
            }}
          >
            {/* Important Section */}
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", mb: 2, color: "black" }}
            >
              Important
            </Typography>

            <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.7 }}>
              1. Swaps values may be adjusted daily based on market conditions
              and rates provided by our Price Provider applicable to all open
              positions. Triple swaps are applied every Wednesday. Swaps for XAU
              and XAG swaps are expressed in pips per 1 lot.
            </Typography>

            <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.7 }}>
              Server Times: Winter: GMT+2 and Summer: GMT+3 (DST) (last Sunday
              of March and ends last Sunday of October).
            </Typography>

            <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7 }}>
              3. During the time period from 23:55 to 00:05 server time
              increased spreads and decreased liquidity can take place due to
              daily bank rollover. In case of inadequate liquidity/spreads
              during bank rollover, widened spreads and excessive slippage may
              occur. Therefore orders may not be executed during these times.
            </Typography>

            {/* Forex Margin Calculation Example */}
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", mb: 2, color: "black" }}
            >
              Calculating Forex Margin Requirements – Example
            </Typography>

            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <strong>Account base currency:</strong> USD
            </Typography>

            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <strong>Position:</strong> Open 10 lots BUY XAUUSA at 1,316.99
            </Typography>

            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <strong>1 Lot size:</strong> 100 Ounces
            </Typography>

            <Typography variant="body1">
              <strong>Margin required is:</strong> 0.5% of National Value{" "}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <strong>Notional value Calulation:</strong> 10 lots × 100 ounces ×
              1,316.99 = 1,316,990 USD
            </Typography>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <strong>Margin required Calculation:</strong> 0.5% of 1,316,990 =
              6,584.95 USD
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Grid>
        <div className="container" style={{ padding: "50px" , textAlign:'center' }}>
          <Typography variant="h4" className="benefits-title" style={{ color: "#ff8c00", fontWeight:'600' }}>
            Benefits of Forex Trading
          </Typography>
          <div
            className="row justify-content-center g-5"
            style={{ marginTop: "20px" }}
          >
            <div className="col-6 col-md-2 benefit-item">
              <FontAwesomeIcon icon={faCoins} className="benefit-icon" />
              <div className="benefit-text">Wide range of FX pairs</div>
            </div>

            <div className="col-6 col-md-2 benefit-item">
              <FontAwesomeIcon icon={faTint} className="benefit-icon" />
              <div className="benefit-text">High liquidity</div>
            </div>

            <div className="col-6 col-md-2 benefit-item">
              <FontAwesomeIcon icon={faPercent} className="benefit-icon" />
              <div className="benefit-text">Flexible leverage</div>
            </div>

            <div className="col-6 col-md-2 benefit-item">
              <FontAwesomeIcon icon={faClock} className="benefit-icon" />
              <div className="benefit-text">24-hour trading</div>
            </div>

            <div className="col-6 col-md-2 benefit-item">
              <FontAwesomeIcon icon={faBalanceScale} className="benefit-icon" />
              <div className="benefit-text">Low transaction costs</div>
            </div>
          </div>
        </div>
      </Grid>

      <TradingDetailsBox />
    </Container>
    </>
  );
};
export default Metals;
