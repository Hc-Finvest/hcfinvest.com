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

// ----------------- Main Component -----------------
const ContactUsData = () => {
  const [rows, setRows] = useState([]);

  // ⭐ Fetch Contacts — SAME PATTERN AS YOUR BLOG API
  const fetchContacts = async () => {
    try {
      const res = await axios.get("https://hcfinvest.onrender.com/api/contact");
      setRows(res.data); // backend returns array
      console.log(res.data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
      <>

        <Helmet>
          <link rel="canonical" href="https://www.hcfinvest.com/adminContactUsData" />
        </Helmet>

      <Container
      maxWidth={false}
      disableGutters
      sx={{ backgroundColor: "#fff", pt: 3 , maxWidth:'1200px' }}
    >
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableHead>
            <TableRow>
              <StyledTableCell>Full Name</StyledTableCell>
              <StyledTableCell>Contact No</StyledTableCell>
              <StyledTableCell>Email</StyledTableCell>
              <StyledTableCell>Country</StyledTableCell>
              <StyledTableCell>Subject</StyledTableCell>
              <StyledTableCell align="right">Message</StyledTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <StyledTableCell colSpan={6} align="center">
                  No contact records found.
                </StyledTableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <StyledTableRow key={row._id}>
                  <StyledTableCell>
                    {row.firstName + " " + row.lastName}
                  </StyledTableCell>
                  <StyledTableCell>{row.phone}</StyledTableCell>
                  <StyledTableCell>{row.email}</StyledTableCell>
                  <StyledTableCell>{row.country}</StyledTableCell>
                  <StyledTableCell>{row.subject}</StyledTableCell>
                  <StyledTableCell align="right">{row.message}</StyledTableCell>
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

export default ContactUsData;
