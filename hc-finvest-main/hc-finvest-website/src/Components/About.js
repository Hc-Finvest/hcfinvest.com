import {
  Box,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import "../Components/Styles/AboutStyle.css";
import {
  FaHome,
  FaGlobe,
  FaBullhorn,
  FaShieldAlt,
  FaClock,
} from "react-icons/fa";
import TradingDetailsBox from "./Utilities/TradingDetailsBox";
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
const features = [
  { icon: <FaHome />, title: "Real", subtitle: "ECN / STP" },
  { icon: <FaGlobe />, title: "Globally", subtitle: "Licensed" },
  { icon: <FaBullhorn />, title: "Regular", subtitle: "Promotions" },
  { icon: <FaShieldAlt />, title: "Protection", subtitle: "of Funds" },
  { icon: <FaClock />, title: "24/5", subtitle: "Support" },
];

// const panels = [
//   {
//     title: "Experienced & Trusted Since 2010",
//     content:
//       "At HC Finvest, we've supported traders since 2010, combining deep expertise, 24/5 support, and a low-cost trading environment. Trust us to help you achieve your investment goals with confidence.",
//   },
//   {
//     title: "True STP Execution for Transparent Trading",
//     content:
//       "At HC Finvest, we guarantee real-time STP (Straight Through Processing) execution within a secure ECN environment. Trade forex instantly with live streaming prices, best execution, and immediate confirmations. No re-quoting, no dealing desk intervention, no re-quotes, and a transparent trading experience.",
//   },
//   {
//     title: "Customer-Centric, Zero-Cost Trading at HC Finvest",
//     content:
//       "Focused on maximizing your trading potential and minimizing costs, HC Finvest ECN PRIME (ZERO Account) offers spreads from 0.0 pips, zero commissions, zero swaps, zero markups, and zero deposit fees. Enjoy competitive pricing, a transparent trading process, and the lowest-cost environment in the retail forex market.",
//   },
// ];

const About = () => {
  return (
    <>
     <Helmet>
       <link rel="canonical" href="https://www.hcfinvest.com/about" />
     </Helmet>

       <Container sx={{ backgroundColor: "#fff" }} maxWidth={false} disableGutters>
      <ScrollToTopButton />
      <Box
        sx={{
          position: "relative",
          height: "475px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          backgroundImage: `url('Images/AboutUsImages/Newhedgecapitalsimage_why us (1).jpg')`, // 👈 replace with your image path
          backgroundSize: "cover",
          backgroundPosition: "center",
          marginBottom: "30px",
        }}
      >
        {/* <Typography
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
          About HC Finvest
        </Typography> */}

        <h1 style={{
            zIndex: 2,
            fontWeight: 600,
            textAlign: "center",
            px: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            }}>
                About HC Finvest

        </h1>
      </Box>

      <div className="features-section">
        <div className="features-container">
          {features.map((f, index) => (
            <div className="feature-item" key={index}>
              <div className="icon">{f.icon}</div>
              <div className="text">
                <h4>{f.title}</h4>
                <p>{f.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/*First Box   */}
<section className="py-3 py-md-5" style={{ fontFamily: "Poppins" }}>
        <div className="container">
          <div className="row gy-4 align-items-lg-center">

            {/* Image */}
            <div className="col-12 col-lg-6 col-xl-5">
              <img
                src="/Images/AboutUsImages/SubAboutimage.jpg"
                alt="Confident forex trader analyzing financial growth charts"
                loading="lazy"
                className="img-fluid rounded w-100"
              />
            </div>

            {/* Text Content */}
            <div className="col-12 col-lg-6 col-xl-7">
              <Typography
              variant="h3"
                className="mb-1 fw-bold"
                style={{ fontSize: "2rem", color: "#ff8c00" }}
              >
                About HC Finvest :-
              </Typography>

              <Typography className="fs-4" style={{ color: "#ff8c00" }}>
                Your Partner in Strategic Investment and Financial Growth
              </Typography>

              <Typography
                className="text-muted"
                style={{ fontSize: "16px", lineHeight: "32px" }}
              >
                At <b className="text-black">HC Finvest</b>, we are committed to helping individuals and organizations 
                achieve their <b className="text-black">financial goals</b> through 
                <b className="text-black"> strategic investments, asset management,</b> and 
                <b className="text-black"> personalized financial solutions</b>. Our experts bring deep knowledge in 
                <b className="text-black"> forex trading, planning,</b> and 
                <b className="text-black"> market analysis</b>, helping you navigate global markets confidently.
                <br /><br />
                Founded on <b className="text-black">integrity, innovation,</b> and 
                <b className="text-black"> excellence</b>, HC Finvest has become a 
                <b className="text-black"> leading forex broker</b> recognized for exceptional results and 
                <b className="text-black"> client service</b>. Our approach is 
                <b className="text-black"> client-centric</b> — strategies designed around your finances.
                <br /><br />
                We believe in <b className="text-black">transparency, accountability,</b> and 
                <b className="text-black"> long-term partnerships</b>, building relationships based on 
                <b className="text-black"> trust and success</b>. Whether you want to 
                <b className="text-black"> grow wealth, protect assets,</b> or 
                <b className="text-black"> plan ahead</b>, HC Finvest is here for every step.
              </Typography>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2*/}
      <section className="py-4" style={{ fontFamily: "Poppins" }}>
        <div className="container">
          <div className="row gy-4 align-items-center">

            {/* Text */}
            <div className="col-lg-8 text-muted" style={{ fontSize: "16px", lineHeight: "32px" }}>
              <Typography variant="h3" className="fw-semibold mb-4" style={{ color: "#ff8c00" , fontSize:'2rem' }}>
                Trustworthy, Transparent, and Fair Trading with{" "}
                <span className="fw-bold">HC Finvest</span>.
              </Typography>

              <Typography>
                At <b className="text-black">HC Finvest</b>, we offer a 
                <b className="text-black"> True ECN/STP trading model</b> that gives professionals and investors 
                access to <b className="text-black">real-time prices</b> from top-tier liquidity providers.
              </Typography>

              <Typography>
                Our <b className="text-black">ECN/STP model</b> ensures <b className="text-black">transparent pricing, 
                ultra-fast execution,</b> and <b className="text-black">no manipulation</b>. With 
                <b className="text-black"> STP routing</b>, all trades go directly to financial institutions, with 
                <b className="text-black"> no markups</b>.
              </Typography>

              <Typography>
                The <b className="text-black">No Dealing Desk (NDD)</b> structure ensures 
                <b className="text-black"> no intervention</b> or re-quotes. Our 
                <b className="text-black">Price Aggregator</b> scans liquidity providers to ensure 
                <b className="text-black"> the best Bid/Ask prices</b> every time.
              </Typography>

              <Typography>
                Experience <b className="text-black">fast, fair, and effective trading</b> with HC Finvest.
              </Typography>
            </div>

            {/* Image */}
            <div className="col-lg-4 text-center">
              <img
                src="/Images/AboutUsImages/Subsheild electronsiamge.jpg"
                loading="lazy"
                alt="Safe encrypted trading technology"
                className="img-fluid rounded"
                style={{ maxHeight: "330px", objectFit: "cover" }}
              />
            </div>

          </div>
        </div>
      </section>

      {/*  */}
      {/* <Box
        sx={{
          backgroundImage: `url('	https://t4.ftcdn.net/jpg/05/22/93/63/360_F_522936327_P22aM6GXgGv31aiSyzToTbtClbxlRrZC.jpg')`, // 👈 replace with your image path
          backgroundSize: "cover", // 👈 ensures the image covers the whole box
          backgroundPosition: "center", // 👈 centers the image nicely
          backgroundRepeat: "no-repeat", // 👈 prevents image repetition
          height: "600px",
          width: "100%", // 👈 optional, ensures full width
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Grid
          container
          spacing={3}
          display="flex"
          justifyContent="center"
          alignItems="center"
          size={12}
          sx={{ border: "0px solid red" }}
        >
          <Grid item size={3.5} sx={{ border: "0px solid Yellow" }}>
            <Card
              sx={{
                opacity: "97%",
                height: "400px",
                padding: "30px",
                color: "#fff",
                borderRadius: "12px",
                boxShadow: " 0 0 15px #ffffff1a",
                transition: "background-color .3s ease, transform .3s ease",
                cursor: " pointer",
                backgroundColor: "#000000bf",
              }}
            >
              <Typography> </Typography>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: "700" }}>
                Experienced & Trusted Since 2010
              </Typography>

              <Divider sx={{ my: 4, borderColor: "rgba(255,255,255)" }} />
              <p style={{ textAlign: "left", fontSize: "19px" }}>
                At we’ve supported traders since 2010, combining deep expertise,
                24/5 support, and a low-cost trading environment. Trust us to
                help you achieve your investment goals with confidence.
              </p>
            </Card>
          </Grid>
          <Grid item size={3.5} sx={{ border: "0px solid green" }}>
            <Card
              sx={{
                opacity: "97%",
                height: "400px",
                padding: "30px",
                color: "#fff",
                borderRadius: "12px",
                boxShadow: " 0 0 15px #ffffff1a",
                transition: "background-color .3s ease, transform .3s ease",
                cursor: " pointer",
                backgroundColor: "#082f59e6",
              }}
            >
              <Typography sx={{ fontSize: "1.25rem", fontWeight: "700" }}>
                True STP Execution for Transparent Trading
              </Typography>

              <Divider sx={{ my: 2, borderColor: "rgba(255,255,255)" }} />
              <p style={{ textAlign: "left", fontSize: "19px" }}>
                At HC Finvest, we guarantee real-time STP (Straight Through
                Processing) execution within a secure ECN environment. Trade
                forex instantly with live streaming prices, best execution, and
                immediate confirmations. Experience no dealing desk
                intervention, no re-quotes, and a transparent trading
                experience.
              </p>
            </Card>
          </Grid>
          <Grid item size={3.5} sx={{ border: "0px solid Blue" }}>
            <Card
              sx={{
                opacity: "97%",
                height: "400px",
                padding: "30px",
                color: "#fff",
                borderRadius: "12px",
                boxShadow: " 0 0 15px #ffffff1a",
                transition: "background-color .3s ease, transform .3s ease",
                cursor: " pointer",
                backgroundColor: "#000000bf",
              }}
            >
              <Typography sx={{ fontSize: "1.25rem", fontWeight: "700" }}>
                Customer-Centric, Zero-Cost Trading at HC Finvest
              </Typography>

              <Divider sx={{ my: 2, borderColor: "rgba(255,255,255)" }} />
              <p style={{ textAlign: "left", fontSize: "19px" }}>
                Focused on maximizing your trading potential and minimizing
                costs, HC Finvest ECN PRIME (ZERO Account) offers spreads from
                0.0 pips, zero commissions, zero swaps, zero markups, and zero
                deposit fees. Enjoy competitive pricing, a transparent trading
                process, and the lowest-cost trading environment in the retail
                forex market.
              </p>
            </Card>
          </Grid>
        </Grid>
      </Box> */}

      <Grid>
        <div className="overlayy py-5">
          <div className="container">
            <div className="row g-4 align-items-stretch">
              {/* Box 1 */}
              <div className="col-md-4">
                <div className="info-box">
                  <div className="info-title">
                    Experienced & Trusted Since 2010
                  </div>
                  <div className="divider my-3"></div>
                  <p style={{ fontSize: "19px" }}>
                    At HC Finvest, we’ve supported traders since 2010, combining deep
                    expertise, 24/5 support, and a low-cost trading environment.
                    Trust us to help you achieve your investment goals with
                    confidence.
                  </p>
                </div>
              </div>

              {/* Box 2 */}
              <div className="col-md-4">
                <div className="info-box blue-box">
                  <div className="info-title">
                    True STP Execution for Transparent Trading
                  </div>
                  <div className="divider my-3"></div>
                  <p style={{ fontSize: "19px" }}>
                    At HC Finvest, we guarantee real-time STP (Straight Through
                    Processing) execution within a secure ECN environment. Trade
                    forex instantly with live streaming prices, best execution,
                    and immediate confirmations. Experience no dealing desk
                    intervention, no re-quotes, and a transparent trading
                    experience.
                  </p>
                </div>
              </div>

              {/* Box 3 */}
              <div className="col-md-4">
                <div className="info-box">
                  <div className="info-title">
                    Customer-Centric, Zero-Cost Trading at HC Finvest
                  </div>
                  <div className="divider my-3"></div>
                  <p style={{ fontSize: "19px" }}>
                    Focused on maximizing your trading potential and minimizing
                    costs, HC Finvest ECN PRIME (ZERO Account) offers spreads
                    from 0.0 pips, zero commissions, zero swaps, zero markups,
                    and zero deposit fees. Enjoy competitive pricing, a
                    transparent trading process, and the lowest-cost trading
                    environment in the retail forex market.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Grid>

      <TradingDetailsBox />
    </Container>
    </>
 
  );
};

export default About;
