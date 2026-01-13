import {
  Box,
  Button,
  Container,
  Divider,
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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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
// import React, { useState, useEffect } from "react";

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
  createData("AUDCAD", 0.21, 0.18, "1:2000"),
  createData("AUDCHF", 0.2, 0.17, "1:2000"),
  createData("AUDJPY", 0.26, 0.24, "1:2000"),
  createData("AUDNZD", 0.36, 0.33, "1:2000"),
  createData("AUDUSD", 0.22, 0.2, "1:2000"),
  createData("CADCHF", 0.22, 0.2, "1:2000"),
  createData("CADJPY", 0.29, 0.26, "1:2000"),
  createData("CHFJPY", 0.3, 0.28, "1:2000"),
  createData("EURCAD", 0.26, 0.24, "1:2000"),
  createData("EURAUD", 0.23, 0.21, "1:2000"),
  createData("EURCHF", 0.25, 0.23, "1:2000"),
  createData("EURGBP", 0.22, 0.2, "1:2000"),
  createData("EURJPY", 0.24, 0.21, "1:2000"),
  createData("EURNZD", 0.35, 0.31, "1:2000"),
  createData("EURSGD", 0.25, 0.21, "1:2000"),
  createData("EURTRY", 70.2, 70.0, "1:2000"),
  createData("EURUSD", 0.15, 0.11, "1:2000"),
  createData(
    "GBPCAD",

    0.28,
    0.25,
    "1:2000"
  ),
  createData("GBPCHF", 0.35, 0.33, "1:2000"),
  createData("GBPJPY", 0.31, 0.27, "1:2000"),
  createData("GBPUSD", 0.18, 0.15, "1:2000"),
  createData("GBPAUD", 0.38, 0.36, "1:2000"),
  createData("GBPNZD", 0.29, 0.26, "1:2000"),
  createData("NZDCAD", 0.3, 0.28, "1:2000"),
  createData("NZDCHF", 0.24, 0.2, "1:2000"),
  createData("NZDJPY", 0.29, 0.27, "1:2000"),
  createData("NZDUSD", 0.23, 0.2, "1:2000"),
  createData("USDCAD", 0.22, 0.2, "1:2000"),
  createData("USDCHF", 0.27, 0.24, "1:2000"),
  createData("USDHKD", 0.3, 0.28, "1:2000"),
  createData("USDJPY", 0.22, 0.2, "1:2000"),
  createData("USDSGD", 0.31, 0.29, "1:2000"),
  createData("USDTRY", 4.9, 4.7, "1:2000"),
];

// ✅ Pro Trader Data
const ProTraderrows = [
  createData("AUDCAD", 0.11, 0.08, "1:2000"),
  createData("AUDCHF", 0.1, 0.07, "1:2000"),
  createData("AUDJPY", 0.15, 0.13, "1:2000"),
  createData("AUDNZD", 0.13, 0.1, "1:2000"),
  createData("AUDUSD", 0.08, 0.07, "1:2000"),
  createData("CADCHF", 0.1, 0.09, "1:2000"),
  createData("CADJPY", 0.11, 0.09, "1:2000"),
  createData("CHFJPY", 0.16, 0.14, "1:2000"),
  createData("EURAUD", 0.15, 0.13, "1:2000"),
  createData("EURCAD", 0.12, 0.09, "1:2000"),
  createData("EURCHF", 0.1, 0.08, "1:2000"),
  createData("EURGBP", 0.08, 0.07, "1:2000"),
  createData("EURJPY", 0.06, 0.05, "1:2000"),
  createData("EURNZD", 0.13, 0.11, "1:2000"),
  createData("EURSGD", 0.12, 0.09, "1:2000"),
  createData("EURTRY", 50.2, 50.0, "1:2000"),
  createData("EURUSD", 0.02, 0.01, "1:2000"),
  createData("GBPAUD", 0.14, 0.12, "1:2000"),
  createData("GBPCAD", 0.1, 0.08, "1:2000"),
  createData("GBPCHF", 0.13, 0.11, "1:2000"),
  createData("GBPJPY", 0.18, 0.15, "1:2000"),
  createData("GBPNZD", 0.22, 0.18, "1:2000"),
  createData("GBPUSD", 0.08, 0.06, "1:2000"),
  createData("NZDCAD", 0.13, 0.11, "1:2000"),
  createData("NZDCHF", 0.1, 0.08, "1:2000"),
  createData("NZDJPY", 0.1, 0.08, "1:2000"),
  createData("NZDUSD", 0.07, 0.05, "1:2000"),
  createData("USDCAD", 0.06, 0.04, "1:2000"),
  createData("USDCHF", 0.1, 0.08, "1:2000"),
  createData("USDHKD", 0.15, 0.13, "1:2000"),
  createData("USDJPY", 0.03, 0.02, "1:2000"),
  createData("USDSGD", 0.07, 0.05, "1:2000"),
  createData("USDTRY", 3.88, 3.7, "1:2000"),
];

// ✅ Elite Data
const Eliterows = [
  createData("AUDCAD", 0.11, 0.08, "1:2000"),
  createData("AUDCHF", 0.1, 0.07, "1:2000"),
  createData("AUDJPY", 0.15, 0.13, "1:2000"),
  createData("AUDNZD", 0.13, 0.1, "1:2000"),
  createData("AUDUSD", 0.08, 0.07, "1:2000"),
  createData("CADCHF", 0.1, 0.09, "1:2000"),
  createData("CADJPY", 0.11, 0.09, "1:2000"),
  createData("CHFJPY", 0.16, 0.14, "1:2000"),
  createData("EURAUD", 0.15, 0.13, "1:2000"),
  createData("EURCAD", 0.12, 0.09, "1:2000"),
  createData("EURCHF", 0.1, 0.08, "1:2000"),
  createData("EURGBP", 0.08, 0.07, "1:2000"),
  createData("EURJPY", 0.06, 0.05, "1:2000"),
  createData("EURNZD", 0.13, 0.11, "1:2000"),
  createData("EURSGD", 0.12, 0.09, "1:2000"),
  createData("EURTRY", 50.2, 50.0, "1:2000"),
  createData("EURUSD", 0.02, 0.01, "1:2000"),
  createData("GBPAUD", 0.14, 0.12, "1:2000"),
  createData("GBPCAD", 0.1, 0.08, "1:2000"),
  createData("GBPCHF", 0.13, 0.11, "1:2000"),
  createData("GBPJPY", 0.18, 0.15, "1:2000"),
  createData("GBPNZD", 0.22, 0.18, "1:2000"),
  createData("GBPUSD", 0.08, 0.06, "1:2000"),
  createData("NZDCAD", 0.13, 0.11, "1:2000"),
  createData("NZDCHF", 0.1, 0.08, "1:2000"),
  createData("NZDJPY", 0.1, 0.08, "1:2000"),
  createData("NZDUSD", 0.07, 0.05, "1:2000"),
  createData("USDCAD", 0.06, 0.04, "1:2000"),
  createData("USDCHF", 0.1, 0.08, "1:2000"),
  createData("USDHKD", 0.15, 0.13, "1:2000"),
  createData("USDJPY", 0.03, 0.02, "1:2000"),
  createData("USDSGD", 0.07, 0.05, "1:2000"),
  createData("USDTRY", 3.88, 3.7, "1:2000"),
];

const Forex = () => {
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
      <link rel="canonical" href="https://www.hcfinvest.com/forexMarket" />
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
          backgroundImage: `url('Images/ForexImages/NewhedgecapitalsimageForex.jpg')`, // 👈 replace with your image path
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
          Empower Your Investment With
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
          HC Finvest Forex
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

      <Grid sx={{ width: "80%", margin: "0 auto" }}>
        <Typography
          variant="h2"
          align="left"
          sx={{
            color: "#ff8c00",
            fontSize: "35px",
            fontWeight: "700",
            paddingTop: "50px",
            marginBottom: "10px",
          }}
        >
          What is Forex Trading?
        </Typography>
        <Typography style={{ textAlign: "left", marginBottom: "10px" }}>
          Foreign exchange, commonly known as Forex, is a global marketplace
          where currencies are traded, when one currency is sold, another is
          bought in exchange. The key factor in Forex trading is the exchange
          rate between two currencies, which constantly fluctuates. These
          fluctuations create opportunities for traders to profit from market
          movements.
        </Typography>
        <Typography style={{ textAlign: "left", marginBottom: "10px" }}>
          With a staggering daily trading volume of $6.5 trillion, the Forex
          market surpasses even the New York Stock Exchange (NYSE), which sees a
          comparatively smaller daily volume of $22.4 billion.
        </Typography>
        <Typography style={{ textAlign: "left", marginBottom: "20px" }}>
          The vast scale of the Forex market attracts a diverse group of
          participants, including central banks, investment managers, HC Finvest
          funds, corporations, brokers, and retail traders. Notably, around 90%
          of market participants engage in Forex trading primarily for
          speculation.
        </Typography>
      </Grid>
      <Grid sx={{ width: "80%", margin: "0 auto" }}>
        <Typography
          variant="h2"
          align="left"
          sx={{
            color: "#ff8c00",
            fontSize: "35px",
            fontWeight: "700",
            marginBottom: "10px",
            marginTop: "10px",
          }}
        >
          Why Trade Forex?
        </Typography>

        <Typography align="left">
          <span style={{ color: "#ff8c00" }}>Accessibility :- </span>
          The forex market is accessible to retail traders, with many online
          platforms available.
        </Typography>
        <Typography align="left">
          <span style={{ color: "#ff8c00" }}>Flexibility :- </span>
          The 24-hour nature of the market allows for trading at convenient
          times.
        </Typography>
        <Typography align="left">
          <span style={{ color: "#ff8c00" }}>Diverse Opportunities :- </span>
          With many currency pairs available, there are numerous opportunities
          to trade based on global economic events.
        </Typography>
        <Typography
          style={{
            fontSize: "20px",
            textAlign: "left",
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          Forex trading requires a good understanding of market dynamics and a
          well-thought-out strategy. It's important to manage risks and stay
          informed about global events that can impact currency values.
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
          <Typography
            style={{
              color: "var(--bs-secondary-color) !important",
              opacity: "1",
              textAlign: "left",
            }}
          >
            The Forex market operates Monday – Friday 00:05 – 23:50 GMT+1
          </Typography>

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
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
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
            1. Swaps values may be adjusted daily based on market conditions and
            rates provided by our Price Provider applicable to all open
            positions. Triple swaps are applied every Wednesday.
          </Typography>

          <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.7 }}>
            2. Server Times: Winter: <strong>GMT+2</strong> and Summer:{" "}
            <strong>GMT+3 (DST)</strong> (last Sunday of March and ends last
            Sunday of October).
          </Typography>

          <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7 }}>
            3. During the time period from{" "}
            <strong>23:55 to 00:05 server time</strong>, increased spreads and
            decreased liquidity can take place due to daily bank rollover. In
            case of inadequate liquidity/spreads during bank rollover, widened
            spreads and excessive slippage may occur. Therefore, orders may not
            be executed during these times.
          </Typography>

          {/* Forex Margin Calculation Example */}
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", mb: 2, color: "black" }}
          >
            Calculating Forex Margin Requirements – Example
          </Typography>

          <Typography variant="body1" sx={{ mb: 1.5 }}>
            <strong>Account Leverage:</strong> 1:400
          </Typography>

          <Typography variant="body1" sx={{ mb: 1.5 }}>
            <strong>Account base currency:</strong> USD
          </Typography>

          <Typography variant="body1" sx={{ mb: 1.5 }}>
            <strong>Position:</strong> Open 10 lots BUY EURUSD at 1.21745
          </Typography>

          <Typography variant="body1" sx={{ mb: 1.5 }}>
            <strong>1 Lot size:</strong> 100,000 units
          </Typography>

          <Typography variant="body1" sx={{ mb: 1.5 }}>
            <strong>Notional value:</strong> 10 × 100,000 × 1.21745 = 1,217,450
            USD
          </Typography>

          <Typography variant="body1">
            <strong>Margin required is:</strong> 1,217,450 USD ÷ 400 ={" "}
            <strong>3,043.63 USD</strong>
          </Typography>
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
          {/* --- Section 1: Traded in Pairs --- */}
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
            In the forex market, currencies are <strong>traded in pairs</strong>{" "}
            — you’re buying one and simultaneously selling another.
            <br />
            For example, in the <strong>EUR/USD</strong> pair:
          </Typography>

          <ul
            style={{ marginTop: 0, marginBottom: "16px", paddingLeft: "20px" }}
          >
            <li>
              <Typography>
                {" "}
                <strong>EUR</strong> is the <strong>Base Currency</strong>
              </Typography>
            </li>
            <li>
              <Typography>
                {" "}
                <strong>USD</strong> is the{" "}
                <strong>Quote (Counter) Currency</strong>
              </Typography>
            </li>
          </ul>

          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
            The base currency always comes <strong>first</strong>, and the quote
            currency comes <strong>second</strong>.
          </Typography>

          <Divider sx={{ mb: 3, borderColor: "#ddd" }} />

          {/* --- Section 2: Bid vs Ask --- */}
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            Bid vs Ask Price
          </Typography>

          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
            When placing a trade, you'll see two prices:
          </Typography>

          <ul
            style={{ marginTop: 0, marginBottom: "16px", paddingLeft: "20px" }}
          >
            <li>
              <Typography>
                <strong>1.2005 → Bid Price</strong> (Sell EUR, Buy USD)
              </Typography>
            </li>
            <li>
              <Typography>
                <strong>1.2008 → Ask Price</strong> (Buy EUR, Sell USD)
              </Typography>
            </li>
          </ul>

          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
            The difference between these two prices is called the{" "}
            <strong>spread</strong>, which represents the broker’s fee.
          </Typography>

          <Divider sx={{ mb: 3, borderColor: "#ddd" }} />

          {/* --- Section 3: Forex Fact --- */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <CheckCircleIcon sx={{ color: "green", mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Forex Fact
            </Typography>
          </Box>

          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            When you click “Buy” or “Sell,” you’re always acting on the{" "}
            <strong>base currency</strong> in the pair.
          </Typography>
        </Box>
      </Grid>

      <Grid>
        <div className="container" style={{ padding: "50px" }}>
          <Typography
          variant="h4"
            className="benefits-title"
            style={{ color: "#ff8c00", textAlign: "center" , fontWeight:'600' }}
          >
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
export default Forex;
