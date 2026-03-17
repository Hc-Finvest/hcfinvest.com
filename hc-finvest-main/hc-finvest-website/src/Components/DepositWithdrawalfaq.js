import React, { useState } from "react";
import {
  Typography,
  Collapse,
  IconButton,
  Card,
  CardContent,
  Box,
  Container,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import { Helmet } from "react-helmet-async";

const faqs = [
  {
    question: "What leverage do you offer?",
    answer:
      "We offer a wide range of leverage options to suit different trading strategies and risk appetites. The maximum leverage we provide is 1:2000, giving you the flexibility to trade with enhanced market exposure.",
  },
  {
    question: "What are your trading hours?",
    answer:
      "Our trading hours vary depending on the financial instruments you trade. Typically, our platform operates 24/5 from Monday to Friday, aligning with global market hours.",
  },
  {
    question: "Do you charge commission or extra fees?",
    answer:
      "We maintain a transparent pricing structure. Depending on the account type, you may be charged either a small commission or a spread-based fee. There are no hidden charges.",
  },
  {
    question: "Do you allow scalping?",
    answer:
      "Yes, we allow all trading strategies, including scalping and hedging, to provide flexibility and freedom to our traders.",
  },
  {
    question: "Do you allow scalping?",
    answer:
      "Yes, we allow all trading strategies, including scalping and hedging, to provide flexibility and freedom to our traders.",
  },
  {
    question: "Can I withdraw profit any time?",
    answer:
      "Yes, you can withdraw your profits at any time, as long as your account meets the minimum withdrawal amount and verification requirements.",
  },
  {
    question: "How do I rest my account password?",
    answer:
      "You can reset it through the broker’s website or app by clicking “Forgot Password” and following the instructions.",
  },
  {
    question: "Can I have multiple trading accounts?",
    answer:
      "Yes, we allow multiple accounts under the same user. However, ensure compliance with the broker’s terms.",
  },
  {
    question: "How do I close my account?",
    answer:
      "Contact your broker’s support team, ensure no open trades, withdraw remaining funds, and request account closure.",
  },
  {
    question: "Can I partially colse and open position?",
    answer:
      "Yes, you can partially close an open position across any of our account types. However, any position sized below the minimum volume can’t be partially closed and must be closed in its entirety.",
  },
  {
    question: "Does the average spread ever widen in forex trading?",
    answer:
      "Yes, spreads can widen during periods of high market volatility, low liquidity, or major economic events.",
  },
  {
    question: "What are the trading hours of the Cryptocurrencies?",
    answer:
      "Cryptocurrencies can be traded 24/7, you can buy, sell, and trade at any time—day or night. Unlike traditional markets, there are no opening or closing hours. They can even be traded on public holidays!",
  },
];

const DepositWithdrawalfaq = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
        <>
        <Helmet>
            <link rel="canonical" href="https://www.hcfinvest.com/copyTradingfaq" />
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
          backgroundImage: `url('Images/HelpCenterImages/Newhedgecapitalsimage_Helpcenter 1.jpg')`, // 👈 replace with your image path
          backgroundSize: "cover",
          backgroundPosition: "center",
          marginBottom: "30px",
          textAlign: "center",
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
          Deposits And Withdrawals
        </h1>

        <h3
          // variant="h5"
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
          Manage Your Funds with Ease and Confidence
        </h3>
      </Box>

      <Typography
        variant="h2"
        sx={{
          marginBottom: "50px",
          fontWeight: "600",
          fontSize: "2.5rem",
          color: "#101828",
        }}
      >
        FAQ
      </Typography>

      <Box sx={{ maxWidth: "1200px", margin: "40px auto" }}>
        {faqs.map((faq, index) => (
          <Card
            key={index}
            sx={{
              mb: 2,
              boxShadow: 2,
              borderRadius: 2,
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
            onClick={() => handleToggle(index)}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  {faq.question}
                </Typography>
                <IconButton>
                  <ExpandMoreIcon
                    sx={{
                      transform:
                        openIndex === index ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                  />
                </IconButton>
              </Box>

              <Collapse in={openIndex === index} timeout="auto" unmountOnExit>
                <Typography
                  variant="body1"
                  sx={{
                    mt: 2,
                    color: "text.secondary",
                    lineHeight: 1.7,
                    textAlign: "left",
                  }}
                >
                  {faq.answer}
                </Typography>
              </Collapse>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>

        </>
          );
};

export default DepositWithdrawalfaq;
