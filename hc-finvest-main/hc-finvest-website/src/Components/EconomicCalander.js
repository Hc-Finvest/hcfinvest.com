import { Box, Container, Typography } from "@mui/material"
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import { Helmet } from "react-helmet-async";

const EconomicCalander = () => {
    return (
        <>
            <Helmet>
              <link rel="canonical" href="https://www.hcfinvest.com/economicCalander" />
            </Helmet>

        <Container
        sx={{ backgroundColor: "#fff" }}
        maxWidth={false}
        disableGutters
      >
        <ScrollToTopButton/>
        <Typography
          sx={{
            fontSize: "3rem",
            textAlign: "center",
            fontWeight: "600",
            lineHeight: "1",
            color: "#101828",
            marginTop:'50px',
            fontWeight:'600'
          }}
        >
          Economic Calendar
        </Typography>

        <Box>
          <iframe
            src="https://widget.myfxbook.com/widget/calendar.html?lang=en&amp;impacts=0,1,2,3&amp;symbols=AUD,CAD,CHF,CNY,EUR,GBP,JPY,NZD,USD"
            style={{ border: "0", width: "100%", height: "50rem" }}
          ></iframe>
        </Box>
      </Container>
        </>
    );
}

export default EconomicCalander;