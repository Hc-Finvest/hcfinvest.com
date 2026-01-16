import React, { useState, useRef } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Collapse,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Link } from "react-router-dom";

import AboutUsBox from "./Navbar/AboutUsBox";
import SupportBox from "./Navbar/SupportBox";
import ResearchAndToolBox from "./Navbar/ResearchAndToolBox";
import PlatformBox from "./Navbar/PlatformBox";
import TradingBox from "./Navbar/TradingBox";
import "../Components/Styles/Navbar.css";

const Navbar = () => {
  const [hovered, setHovered] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const timer = useRef(null);

  const handleMouseEnter = (name) => {
    clearTimeout(timer.current);
    setHovered(name);
  };

  const handleMouseLeave = () => {
    timer.current = setTimeout(() => setHovered(null), 120);
  };

  const toggleDrawer = (open) => () => setMobileOpen(open);

  const toggleExpand = (name) =>
    setExpandedMenu(expandedMenu === name ? null : name);

  const linkStyle = {
    color: "#000",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: 500,
    padding: "8px 14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const menuItems = [
    { name: "ABOUT US", component: <AboutUsBox /> },
    { name: "TRADING", component: <TradingBox /> },
    { name: "PLATFORM", component: <PlatformBox /> },
    { name: "RESEARCH & TOOLS", component: <ResearchAndToolBox /> },
    { name: "SUPPORT", component: <SupportBox /> },
  ];

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: "#fff",
        height: "70px",
        display: "flex",
        justifyContent: "center",
        boxShadow: "0px 1px 4px rgba(0,0,0,0.16)",
        zIndex: 900,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* LOGO */}
          <Link to="/" style={{ display: "flex", alignItems: "center" }}>
            <img
              src="/hcfinvest_orange_logo.png"
              height="80px"
              alt="HCF Invest Logo"
              style={{ maxWidth: "280px", border: "0px solid red" }}
            />
          </Link>

          {/* DESKTOP NAV */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 2,
            }}
          >
            {menuItems.map((item) => (
              <Box
                key={item.name}
                sx={{ position: "relative" }}
                onMouseEnter={() => handleMouseEnter(item.name)}
                onMouseLeave={handleMouseLeave}
              >
                <Link to={item.to} style={linkStyle}>
                  {item.name}
                </Link>

                {/* ANIMATED CUSTOM DROPDOWN */}
                <Box
                  className={
                    hovered === item.name ? "dropdown-box show" : "dropdown-box"
                  }
                  onMouseEnter={() => handleMouseEnter(item.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  {item.component}
                </Box>
              </Box>
            ))}
          </Box>

          {/* RIGHT BUTTONS */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
            <Button
              variant="outlined"
              sx={{
                color: "#ff8c00",
                borderColor: "#ff8c00",
                "&:hover": {
                  backgroundColor: "#ff8c00",
                  color: "white",
                  borderColor: "#ff8c00",
                },
              }}
              href="https://trade.hcfinvest.com/user/login"
              target="_blank"
              rel="noopener noreferrer"
            >
              Login
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#ff8c00 !important",
                "&:hover": {
                  backgroundColor: "#e67300 !important",
                  color: "white",
                },
              }}
              href="https://trade.hcfinvest.com/user/signup"
              target="_blank"
              rel="noopener noreferrer"
            >
              Register
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "gray",
                "&:hover": {
                  backgroundColor: "#696969",
                  color: "white",
                },
              }}
              href="https://trade.hcfinvest.com/user/signup"
              target="_blank"
              rel="noopener noreferrer"
            >
              Demo Account
            </Button>
          </Box>

          {/* MOBILE MENU ICON */}
          <IconButton
            sx={{ display: { xs: "flex", md: "none" }, color: "black" }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>

        {/* MOBILE DRAWER */}
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={toggleDrawer(false)}
          PaperProps={{
            sx: { width: "80%", maxWidth: 330, backgroundColor: "#fff" },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              p: 2,
              borderBottom: "1px solid #ddd",
            }}
          >
            <Typography variant="h6" sx={{ color: "#ff8c00" }}>
              HC Finvest
            </Typography>
            <IconButton onClick={toggleDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <List>
            {menuItems.map((item) => (
              <Box key={item.name}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => toggleExpand(item.name)}>
                    <ListItemText
                      primary={item.name}
                      primaryTypographyProps={{
                        fontSize: 16,
                        fontWeight: 500,
                      }}
                    />
                    {expandedMenu === item.name ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </ListItemButton>
                </ListItem>

                {/* Mobile Dropdown */}
                <Collapse in={expandedMenu === item.name} timeout="auto">
                  <Box
                    sx={{
                      px: 3,
                      py: 1,
                      background: "#f5f5f5",
                      borderLeft: "3px solid #ff8c00",
                    }}
                  >
                    {item.component}
                  </Box>
                </Collapse>
              </Box>
            ))}

            {/* Bottom Buttons */}
            <Box sx={{ p: 2, pt: 0 }}>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  color: "#ff8c00",
                  borderColor: "#ff8c00",
                  mb: 1,
                  "&:hover": {
                    backgroundColor: "#ff8c00",
                    color: "white",
                    borderColor: "#ff8c00",
                  },
                }}
                href="https://trade.hcfinvest.com/user/login"
              target="_blank"
              rel="noopener noreferrer"
              >
                Login
              </Button>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  backgroundColor: "#ff8c00 !important",
                  mb: 1,
                  "&:hover": {
                    backgroundColor: "#e67300 !important",
                  },
                }}
                href="https://trade.hcfinvest.com/user/signup"
                target="_blank"
                rel="noopener noreferrer"
              >
                Register
              </Button>
              <Button
                variant="contained"
                fullWidth
                sx={{ backgroundColor: "gray" }}
                href="https://trade.hcfinvest.com/user/signup"
                target="_blank"
                rel="noopener noreferrer"
              >
                Demo Account
              </Button>
            </Box>
          </List>
        </Drawer>
      </Container>
    </AppBar>
  );
};

export default Navbar;
