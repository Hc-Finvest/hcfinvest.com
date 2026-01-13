import React, { useState, useEffect } from "react";
import { Nav, VStack } from "rsuite";
import { useNavigate, Outlet } from "react-router-dom";
import "rsuite/dist/rsuite.min.css";

const buttonsStyle = {
  color: "#000",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 500,
  padding: "8px 14px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  width: "180px",
};

// ⭐ Renamed from Navbar → AdminNavbar
const AdminNavbar = ({ active, onSelect, ...props }) => {
  return (
    <Nav {...props} activeKey={active} onSelect={onSelect}>
      <Nav.Item style={buttonsStyle} eventKey={1}>
        Blog
      </Nav.Item>
      <Nav.Item style={buttonsStyle} eventKey={2}>
        Enquiry Data
      </Nav.Item>
      <Nav.Item style={buttonsStyle} eventKey={3}>
        ContactUs Data
      </Nav.Item>
      <Nav.Item style={buttonsStyle} eventKey={4}>
        Swaps
      </Nav.Item>
      <Nav.Item style={buttonsStyle} eventKey={5}>
        Spreads
      </Nav.Item>
    </Nav>
  );
};

const AdminPanel = () => {
  const [active, setActive] = useState(1);
   const navigate = useNavigate();

  useEffect(() => {
    const paths = {
      1: "adminBlogManagement",
      2: "adminEnquiryData",
      3: "adminContactUsData",
      4: "adminSwapManagement",
      5: "adminSpreadManagement",
    };

    navigate(paths[active]);
  }, [active, navigate]);

  return (
    <div>
      <VStack spacing={30}>
        {/* ⭐ Appearance works now */}
        <AdminNavbar
          style={{ width: "100%" }}
          appearance="pills"
          active={active}
          onSelect={setActive}
        />
      </VStack>

      <div style={{ padding: "20px" }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminPanel;
