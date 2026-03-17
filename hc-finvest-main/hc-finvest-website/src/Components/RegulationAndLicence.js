import { Box, Container, Typography } from "@mui/material";
import TradingDetailsBox from "./Utilities/TradingDetailsBox";
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import { Helmet } from "react-helmet-async";

const RegulationAndLicence = () => {
  return (
      <>

      <Helmet>
        <link rel="canonical" href="https://www.hcfinvest.com/regulationAndLicence" />
      </Helmet>

              <Container sx={{ backgroundColor: "#fff" }} maxWidth={false} disableGutters>
      <ScrollToTopButton />

      {/* Banner */}
      <Box
        sx={{
          position: "relative",
          height: { xs: "280px", sm: "350px", md: "475px" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          backgroundImage: `url('Images/RegulationsImages/Newhedgecapitalsimage_regulations.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          marginBottom: "30px",
          textAlign: "center",
          px: 2,
        }}
      >
        <h1
          variant="h3"
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
          HC Finvest Lincence & Regulation
        </h1>
      </Box>

      {/* MAIN SECTION */}
 <section className="py-5 bg-light">
      <div className="container">
        
        {/* Heading */}
        <div className="text-center mb-5 py-4" style={{ backgroundColor: "#ff8c00" }}>
          <Typography variant="h3" className="text-white fw-bold mb-0">Group Licenses</Typography>
        </div>

        {/* License Row */}
        <div className="row justify-content-center align-items-start">
          
          {/* Image */}
          <div className="col-md-2 text-center mb-4 mb-md-0">
            <img
              src="\Images\RegulationsImages\Saint-Vincent-Grenadines-flag.webp"
              alt="SVG Flag"
              className="img-fluid rounded"
              style={{ height: "200px", width: "auto" }}
            />
          </div>

          {/* Content */}
          <div className="col-md-8 text-center text-md-start">
            <Typography className="mb-2">
              <strong>Financial Services Authority (SVG)</strong>
            </Typography>

            <Typography className="mb-2">
              <strong>Heddge Capitals Wealth Management LLC, operating under the brand name HC Finvest </strong> 
              is a legally registered company under the Financial Services Authority (FSA) in St. Vincent 
              and the Grenadines with registration number 3970, in accordance with the Companies Act, 
              Chapter 151 of the Revised Laws of St. Vincent and the Grenadines, 2001. As a registered entity, 
              we are authorized to provide forex trading services globally, ensuring compliance with the laws 
              governing international financial services.
            </Typography>

            <Typography className="mb-2">
              <strong>Registration number:</strong> 3970
            </Typography>

            <Typography className="mb-0">
              The objects of the Company are all subject matters not forbidden by the International Business 
              Companies (Amendment and Consolidation) Act, Chapter 149 of the Revised Laws of Saint Vincent 
              and Grenadines, 2009. These include, but are not limited to, commercial, financial, lending, 
              borrowing, trading, service activities, participation in other enterprises, and the provision 
              of brokerage, training, and managed account services in currencies, commodities, indexes, CFDs, 
              and leveraged financial instruments.
            </Typography>
          </div>

        </div>
      </div>
    </section>

      <TradingDetailsBox />
    </Container>
      </>
  );
};

export default RegulationAndLicence;
