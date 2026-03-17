import React, { useEffect, useState } from "react";
import { Container } from "@mui/material";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import axios from "axios";
import { Helmet } from "react-helmet-async";

// ----------------- Styled Components -----------------
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
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
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

// ----------------- MAIN COMPONENT -----------------
const EnquiryData = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ Fetch all registrations
  const fetchRegistrations = async () => {
    try {
      const res = await axios.get(
        "https://hcfinvest.onrender.com/api/register"
      );

      console.log("API RESPONSE:", res.data);

      // ⭐ SAFETY: Ensure response is an array
      const data = Array.isArray(res.data) ? res.data : [];

      setRows(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setRows([]); // Avoid map error
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // adminEnquiryData

  return (
      <>
        <Helmet>
          <link rel="canonical" href="https://www.hcfinvest.com/adminEnquiryData" />
        </Helmet>


      <Container sx={{ backgroundColor: "#fff", pt: 3 }}>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableHead>
            <TableRow>
              <StyledTableCell>Full Name</StyledTableCell>
              <StyledTableCell>Phone Number</StyledTableCell>
              <StyledTableCell>Email</StyledTableCell>
              <StyledTableCell align="right">Date & Time</StyledTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <StyledTableCell colSpan={4} align="center">
                  Loading...
                </StyledTableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <StyledTableCell colSpan={4} align="center">
                  No registrations found.
                </StyledTableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <StyledTableRow key={row._id}>
                  <StyledTableCell>{row.fullName}</StyledTableCell>
                  <StyledTableCell>{row.phoneNumber}</StyledTableCell>
                  <StyledTableCell>{row.email}</StyledTableCell>
                  <StyledTableCell align="right">
                    {new Date(row.createdAt).toLocaleString()}
                  </StyledTableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
      </>
  );
};

export default EnquiryData;
