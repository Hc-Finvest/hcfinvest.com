import { Box, Container, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import { styled } from "@mui/material/styles";
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import { Helmet } from "react-helmet-async";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: "bold",
  backgroundColor: "#f5f5f5",
  color: "#333",
}));

const StyledRow = styled(TableRow)(({ theme, index }) => ({
  backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9f9f9",
}));

const comparisonData = [
  { feature: "Order Execution Types", mt5: "4 Types", others: "4 Types" },
  { feature: "Pending Order Options", mt5: "6 Types", others: "4 Types" },
  { feature: "Tradable Instruments", mt5: "Unlimited", others: "Up to 1024" },
  {
    feature: "Built-in Indicators",
    mt5: "38 Indicators",
    others: "30 Indicators",
  },
  { feature: "Chart Timeframes", mt5: "21 Timeframes", others: "9 Timeframes" },
  {
    feature: "Drawing & Analysis Tools",
    mt5: "44 Objects",
    others: "31 Objects",
  },
  {
    feature: "Copy Trading",
    mt5: "Advanced Native Charting",
    others: "Native Charting",
  },
  { feature: "Trading Signals", mt5: "Enabled", others: "Enabled" },
  {
    feature: "Reporting Format",
    mt5: "Advanced Interactive Charts & Tables",
    others: "Basic Tables Only",
  },
  { feature: "Mobile Trading Apps", mt5: "Available", others: "Available" },
];

const MetaTrader5Pc = () => {
    return (
      <>
          <Helmet>
            <link rel="canonical" href="https://www.hcfinvest.com/metaTrade5forPc" />
          </Helmet>

              <Container
        sx={{ backgroundColor: "#fff" }}
        maxWidth={false}
        disableGutters
      >
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
            backgroundImage: `url('Images/ContactUsImages/Newhedgecapitalsimage_contact us (2).jpg')`, // 👈 replace with your image path
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
            Your Trusted Resource For All Trading Support
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
            Welcome to the HC Finvest Help Centre
          </h3>
        </Box>

        <Typography
          sx={{
            fontSize: "17px",
            lineHeight: "32px",
            color: "var(--bs-secondary-color) !important",
            paddingRight: "100px",
            paddingLeft: "100px",
            marginTop: "70px",
            marginBottom: "50px",
            textAlign: "left",
            fontWeight: "600",
          }}
        >
          "Transform your trading experience with HC Finvest MetaTrader 5.
          Designed for both novice and experienced traders, our app combines
          advanced features with a user-friendly interface, empowering you to
          trade smarter and faster."
        </Typography>

  <section className="expandd py-5">
      <div className="container">
        <div className="row align-items-center">

          {/* LEFT SIDE — TEXT */}
          <div className="col-12 col-lg-6 mb-4 mb-lg-0">
            <div className="text-dark" style={{ fontFamily: "Poppins" }}>

              <p
                className="text-muted"
                style={{
                  fontFamily: "Poppins",
                  lineHeight: "32px",
                  fontSize: "clamp(14px, 2vw, 17px)",
                }}
              >
                <span className="fw-bold" style={{ color: "#ff8c00" }}>
                  Real-Time Market Data :-
                </span>{" "}
                Access live market data and updates to stay ahead of the trading
                curve.
                <br />
                <span className="fw-bold" style={{ color: "#ff8c00" }}>
                  Advanced Charting Tools :-
                </span>{" "}
                Utilize comprehensive charting tools and indicators to analyze
                market trends and make informed trading decisions.
                <br />
                <span className="fw-bold" style={{ color: "#ff8c00" }}>
                  Customizable Interface :-
                </span>{" "}
                Personalize your trading workspace with customizable layouts and
                settings to suit your trading style.
                <br />
                <span className="fw-bold" style={{ color: "#ff8c00" }}>
                  Seamless Execution :-
                </span>{" "}
                Enjoy lightning-fast order execution to ensure you never miss an
                opportunity.
              </p>

              {/* DOWNLOAD BUTTON */}
              <div className="mt-4">
                <a
                  className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded text-white text-decoration-none"
                  style={{ backgroundColor: "#ff8c00" }}
                  href="https://download.mql5.com/cdn/web/metaquotes.ltd/mt5/mt5setup.exe?utm_source=www.metatrader5.com&utm_campaign=download"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    loading="lazy"
                    width="24"
                    height="24"
                    src="/Images/Metatrade5Pc/description-perspective-button-windows-icon-png-22.png"
                    alt="Windows Icon"
                  />
                  <i className="bi bi-download"></i>
                  Download for Windows
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE — IMAGE */}
          <div className="col-12 col-lg-6 text-center">
            <img
              src="/Images/Metatrade5Pc/Desktop-website-transformed.jpeg"
              alt="Professional trading platform"
              className="img-fluid rounded"
              style={{
                maxHeight: "420px",
                objectFit: "contain",
                width: "100%",
              }}
            />
          </div>

        </div>
      </div>
    </section>

        <Typography variant="h3" fontWeight="bold" fontSize="35px">
          Experience the Future of Trading –{" "}
          <span style={{ color: "#ff8c00" }}>MetaTrader 5</span> Reinvented.
        </Typography>
        <Typography sx={{ marginTop: 3 }}>
          Give Your Trades Speed, Intelligence, and Control
        </Typography>

        <TableContainer
          component={Paper}
          elevation={4}
          sx={{
            maxWidth: 1200,
            margin: "auto",

            mt: 4,
            boxShadow: "0 0 20px #00000014;",
            // display:'flex',
            // justifyContent:'center',
            // alignItems:'center'
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell
                  sx={{ color: "white", backgroundColor: "#ff8c00" }}
                >
                  Feature
                </StyledTableCell>
                <StyledTableCell
                  sx={{ color: "white", backgroundColor: "#ff8c00" }}
                >
                  MetaTrader 5
                </StyledTableCell>
                <StyledTableCell
                  sx={{ color: "white", backgroundColor: "#ff8c00" }}
                >
                  Other Platforms
                </StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comparisonData.map((row, index) => (
                <StyledRow key={index} index={index}>
                  <TableCell>{row.feature}</TableCell>
                  <TableCell>{row.mt5}</TableCell>
                  <TableCell>{row.others}</TableCell>
                </StyledRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Grid
          container
          sx={{
            position: "relative",
            height: "300px",
            backgroundImage:
              'url("/Images/MainContentImages/New CTA (1).webp")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            overflow: "hidden",
          }}
        >
          {/* Optional dark overlay for better text contrast */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              // backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1,
            }}
          />

          {/* Text Content */}
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              color: "black",
              zIndex: 2,
            }}
          >
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
              Start Trading today with{" "}
              <span style={{ color: "#ff8c00" }}>HC Finvest</span>
            </Typography>
            <Typography variant="body1">
              Ready to assist you in every step of your trading experience, 24/5
              multilingual customer
            </Typography>
            <Typography variant="body1">
              support with Dedicated Account Managers.
            </Typography>

            <Grid
              container
              size={12}
              spacing={5}
              sx={{
                border: "0px solid green",
                marginTop: "20px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Grid item size={2} sx={{ border: "0px solid red" }}>
                <a
                  _ngcontent-ng-c673006511=""
                  // href="/contact-us"
                  class="text-white text-decoration-none"
                >
                  <svg
                    _ngcontent-ng-c673006511=""
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    height="35px"
                    style={{ fill: "#ff8c00" }}
                  >
                    <path
                      _ngcontent-ng-c673006511=""
                      d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z"
                    ></path>
                  </svg>
                </a>
              </Grid>
              <Grid item size={2} sx={{ border: "0px solid red" }}>
                <a
                  _ngcontent-ng-c673006511=""
                  // href="https://wa.me/447441395542"
                  target="_blank"
                  class="text-white text-decoration-none"
                >
                  <svg
                    _ngcontent-ng-c673006511=""
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    height="35px"
                    style={{ fill: "#ff8c00" }}
                  >
                    <path
                      _ngcontent-ng-c673006511=""
                      d="M512 240c0 114.9-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4c0 0 0 0 0 0s0 0 0 0s0 0 0 0c0 0 0 0 0 0l.3-.3c.3-.3 .7-.7 1.3-1.4c1.1-1.2 2.8-3.1 4.9-5.7c4.1-5 9.6-12.4 15.2-21.6c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208z"
                    ></path>
                  </svg>
                </a>
              </Grid>
              <Grid item size={2} sx={{ border: "0px solid red" }}>
                <a
                  _ngcontent-ng-c673006511=""
                  // href="mailto:support@hcfinvest.com"
                  class="text-white text-decoration-none"
                >
                  <svg
                    _ngcontent-ng-c673006511=""
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    height="35px"
                    style={{ fill: "#ff8c00" }}
                  >
                    <path
                      _ngcontent-ng-c673006511=""
                      d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM0 176L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-208L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"
                    ></path>
                  </svg>
                </a>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Container>
      </>
    );
}
export default MetaTrader5Pc;