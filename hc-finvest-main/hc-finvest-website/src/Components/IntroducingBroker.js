import { Box, Container, Typography } from "@mui/material"
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import "bootstrap/dist/css/bootstrap.min.css";
import { Helmet } from "react-helmet-async";

const IntroducingBroker = () => {
    return (
      <>

              <Helmet>
                <link rel="canonical" href="https://www.hcfinvest.com/introducingBroker" />
              </Helmet>
        <Container
        sx={{ backgroundColor: "#fff" }}
        maxWidth={false}
        disableGutters
      >
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
            backgroundImage: `url('Images/IntroducingBrokerImages/Newhedgecapitalsimage_Introducing broker.jpg')`, // 👈 replace with your image path
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
            Partner With HC Finvest
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
            And Grow Together
          </h1>
          <h3
            variant="h5"
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
            Become an Introducing Broker With HC Finvest
          </h3>
        </Box>

    <div>

      {/* FIRST SECTION – Image Left, Text Right */}
      <div className="container">
        <Typography
          className="text-muted mt-5"
          style={{
            lineHeight: "32px",
            fontWeight:'600',
            color:'gray',
            fontSize: "clamp(14px, 2vw, 16px)",
          }}
        >
          "At HC Finvest, we value strong partnerships and believe in
          growing together. As an introducing broker, you can leverage our expertise,
          resources, and industry-leading trading platforms to enhance your clients'
          trading experience while earning attractive commissions."
        </Typography>

        <div className="row mt-5 align-items-center">

          {/* Image Left */}
          <div className="col-12 col-md-5 p-3">
            <div
              style={{
                width: "100%",
                height: "280px",
                borderRadius: "12px",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundImage: "url('/Images/IntroducingBrokerImages/IB  (1) 1.jpg')",
              }}
            ></div>
          </div>

          {/* Text Right */}
          <div className="col-12 col-md-7 py-5 ps-lg-5">
            <Typography
            variant="h3"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2rem)",
                lineHeight: 1,
                fontWeight: 600,
                color: "#ff8c00",
              }}
            >
              Introducing Broker
            </Typography>

            <Typography
              className="text-muted"
              style={{
                lineHeight: "32px",
                fontSize: "clamp(14px, 2vw, 16px)",
              }}
            >
              Become an Introducing Broker (IB) and earn lifetime commissions by
              referring traders to "HC Finvest". Whether you're a trader, influencer,
              or affiliate, this is a great way to generate passive income.
            </Typography>
          </div>
        </div>
      </div>

      {/* SECOND SECTION – Image Right, Text Left */}
      <div className="container mt-4">
        <div className="row align-items-center">

          {/* Image Right */}
          <div className="col-12 col-md-5 p-3 order-md-2">
            <div
              style={{
                width: "100%",
                height: "280px",
                borderRadius: "12px",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundImage: "url('/Images/IntroducingBrokerImages/IB 33.png')",
              }}
            ></div>
          </div>

          {/* Text Left */}
          <div className="col-12 col-md-7 py-5 pe-lg-5 order-md-1">
            <Typography
            variant="h3"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2rem)",
                lineHeight: 1,
                fontWeight: 600,
                color: "#ff8c00",
              }}
            >
              What is a Multi-Tier Network?
            </Typography>

            <Typography
              className="text-muted"
              style={{
                lineHeight: "32px",
                fontSize: "clamp(14px, 2vw, 16px)",
              }}
            >
              In business or marketing, a multi-tier network refers to a system
              where you can expand your reach by leveraging the network of others.
              Essentially, you’re building a referral structure where individuals
              not only benefit from their own activities but also earn from the
              activities of those they refer.
              <br />
              <br />
              This structure is used in various business models:
              <br />
              1) Referral or affiliate programs. <br />
              2) Franchises with multiple layers of sub-franchises. <br />
              3) Introducing Broker networks (IB networks).
            </Typography>
          </div>
        </div>
      </div>

      {/* THIRD SECTION – How to Become IB */}
      <div className="container mt-4">
        <Typography
        variant="h3"
          style={{
            fontSize: "clamp(1.6rem, 3vw, 2rem)",
            lineHeight: 1,
            fontWeight: 600,
            color: "#ff8c00",
          }}
        >
          How to Become an Introducing Broker (IB)?
        </Typography>

        <ul style={{ paddingLeft: "20px", marginTop: "20px" }}>
          {[
            "Sign up as an Introducing Broker through the Member Login Area.",
            "After approval, you’ll receive a personal referral link.",
            "Share your IB link on social media, websites, blogs, Telegram, YouTube, and trading forums.",
            "Every time your referred traders open and close positions, you earn a percentage of the spread or commission.",
            "The more active traders you refer, the higher your earnings.",
          ].map((text, i) => (
            <Typography
              key={i}
              className="text-muted"
              style={{
                lineHeight: "32px",
                fontSize: "clamp(14px, 2vw, 16px)",
              }}
            >
              {text}
            </Typography>
          ))}
        </ul>
      </div>
    </div>

<div className="bg-light py-5">
      <section className="container">

        {/* Section Title */}
        <Typography
        variant="h3"
          className="text-center mb-5"
          style={{
            fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
            fontWeight: 600,
            color: "#ff8c00",
          }}
        >
          Partner With Us – Earn By Referring Traders
        </Typography>

        <div className="row align-items-center">

          {/* Left Column – Cards */}
          <div className="col-lg-8 mb-4 mb-lg-0">
            <div className="row g-4 align-items-stretch">

              {[
                {
                  icon: "bi-megaphone-fill",
                  title: "Promote",
                  text: "Leverage our professionally crafted marketing tools to reach and attract new traders.",
                },
                {
                  icon: "bi-people-fill",
                  title: "Refer",
                  text: "Share your unique referral link to direct traders to HC Finvest and get recognized for every signup.",
                },
                {
                  icon: "bi-cash-coin",
                  title: "Earn",
                  text: "Get rewarded in real-time — earn commissions on every trade your referrals make.",
                },
                {
                  icon: "bi-bar-chart-fill",
                  title: "Monitor",
                  text: "Easily manage and monitor your referrals and earnings through your secure IB Dashboard.",
                },
              ].map((card, idx) => (
                <div className="col-md-6" key={idx}>
                  <div
                    className="card text-center p-4 h-100"
                    style={{
                      borderRadius: "15px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
                    }}
                  >
                    <i
                      className={`bi ${card.icon}`}
                      style={{ fontSize: "2.5rem", color: "#ff8c00" }}
                    ></i>

                    <Typography
                    variant="h5"
                      style={{
                        marginTop: "15px",
                        fontSize: "clamp(1.1rem, 2vw, 1.3rem)",
                        fontWeight: 600,
                      }}
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      style={{
                        fontSize: "clamp(14px, 2vw, 16px)",
                        lineHeight: "26px",
                        color: "#6c757d",
                      }}
                    >
                      {card.text}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column – Image */}
          <div className="col-lg-4 text-center">
            <img
              src="/Images/IntroducingBrokerImages/Untitled designn.jpg"
              alt="Partner Program"
              className="img-fluid rounded shadow-sm"
              style={{
                maxHeight: "360px",
                objectFit: "cover",
                borderRadius: "12px",
              }}
            />
          </div>
        </div>
      </section>
    </div>
      </Container>
      </>
    );
}

export default IntroducingBroker;