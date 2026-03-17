import { Box, Container, Grid, Typography } from "@mui/material"
import SecurityIcon from "@mui/icons-material/Security";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import UmbrellaIcon from "@mui/icons-material/Umbrella";
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import TradingDetailsBox from "./Utilities/TradingDetailsBox";
import { Helmet } from "react-helmet-async";

  const items = [
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: "#ff8c00" }} />,
      title: "Market Leading Insurance",
      description:
        "The Company has made further efforts to safeguard its liabilities against Clients and other third parties with a Civil Liability insurance program for a limit of €5,000,000, which includes market leading coverage against errors, omissions, negligence, fraud and various other risks that may lead to financial loss.",
    },
    {
      icon: <PublicIcon sx={{ fontSize: 40, color: "#ff8c00" }} />,
      title: "Industry leader; leading financial safety",
      description:
        "The HC Finvest brand has become a global leader in online trading, specializing in forex, derivatives on US and UK stocks, commodities, spot metals, and indices. Client fund security has been a part of our philosophy alongside unmatched trading conditions and customer support.",
    },
    {
      icon: <AccountBalanceIcon sx={{ fontSize: 40, color: "#ff8c00" }} />,
      title: "Accounts with major banks",
      description:
        "HC Finvest made the decision to only use major global banks. The strength and international standing of the HC Finvest brand enables the company to provide liquidity through major banks.",
    },
    {
      icon: <LockIcon sx={{ fontSize: 40, color: "#ff8c00" }} />,
      title: "Segregation of funds",
      description:
        "Clients’ funds are received into bank accounts separate from those used by the company. These funds are off the balance sheet and cannot be used to pay back creditors in the unlikely event of the company’s default.",
    },
    {
      icon: <ShowChartIcon sx={{ fontSize: 40, color: "#ff8c00" }} />,
      title: "Negative balance protection",
      description:
        "Volatility often occurs in the market. HC Finvest policy of negative balance protection means that even under highly volatile conditions, no client is responsible for paying back a negative balance.",
    },
    {
      icon: <UmbrellaIcon sx={{ fontSize: 40, color: "#ff8c00" }} />,
      title: "Risk management",
      description:
        "The Company continually identifies, assesses, and monitors each type of risk associated with its operations. This ensures effective policies, procedures, and arrangements to meet financial and capital requirements at any time.",
    },
  ];


const SecurityOfFunds = () => {
    return (
        <>

            <Helmet>
              <link rel="canonical" href="https://www.hcfinvest.com/securityOfFunds" />
            </Helmet>

                <Container
        sx={{ backgroundColor: "#fff" }}
        maxWidth={false}
        disableGutters
      >
        <ScrollToTopButton/>
        {/* Bannner Box Start */}

        <Box
          sx={{
            position: "relative",
            height: "475px",
            display: "flex",
            flexDirection: "column", // 👈 Stack text vertically
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            backgroundImage: `url('Images/FundSecurityImages/Newhedgecapitalsimage_security of funds.jpg')`,
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
            Security Of Funds
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
            Your Fund's Security is Our Top Priority
          </h3>
        </Box>

        {/* Banner Box End */}

        <Box sx={{ py: 6, backgroundColor: "#f9fafc" }}>
          <Container maxWidth="lg">
            <Grid container spacing={6}>
              {items.map((item, index) => (
                <Grid item size={6} sm={6} key={index}>
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    {item.icon}
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", color: "#ff8c00" }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "#333", lineHeight: 1.6, mt: 0.5 }}
                      >
                        {item.description}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        
        <TradingDetailsBox/>
      </Container>
        </>
    );

}
export default SecurityOfFunds;