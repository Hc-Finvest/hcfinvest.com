import { Box, Button, Container, Grid, TextField, Typography } from "@mui/material";
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import { useState } from "react";
import axios from "axios";
import { Helmet } from "react-helmet-async";

const ContactUs = () => {
  // form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    phone: "",
    subject: "",
    message: "",
  });

  // update input values
  const handleChange = (e) => {
    // setFormData({ ...formData, [e.target.name]: e.target.value });
    console.log(setFormData({ ...formData, [e.target.name]: e.target.value }));
  };

  // submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://hcfinvest.onrender.com/api/contact", formData);
      alert("Your message has been sent successfully!");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        country: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error(error);
      alert("Failed to send message. Please try again later.");
    }
  };

  return (
    <>
       <Helmet>
        <link rel="canonical" href="https://www.hcfinvest.com/contactUs" />
       </Helmet>
      <Container sx={{ backgroundColor: "#fff" }} maxWidth={false} disableGutters>
      <ScrollToTopButton />
      {/* Banner Box Start */}
      <Box
        sx={{
          position: "relative",
          height: "475px",
          display: "flex",
          flexDirection: "column", // 👈 Stack text vertically
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          backgroundImage: `url('Images/ContactUsImages/Newhedgecapitalsimage_contact us (2).jpg')`, // 
          backgroundSize: "cover",
          backgroundPosition: "center",
          marginBottom: "30px",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.4) 100%)",
            zIndex: 1,
          }
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
          Get In Touch With Us
        </h1>
        <h3
          variant="h5"
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
          Your Financial Partners, Always Within Reach
        </h3>
      </Box>
      {/* Banner Box End */}

 <section className="py-5" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="container">

        {/* Contact Info Row */}
        <div className="row">
          {/* Address */}
          <div className="col-md-4 mb-4">
  <div className="contact-info p-4 rounded h-100 text-center" style={{ backgroundColor: "#ffffff", border: "1px solid #f0f0f0", boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)" }}>
    {/* Image on top */}
    <div className="contact-info-icon mb-3">
      <svg
        width="50"
        height="50"
        viewBox="0 0 24 24"
        fill="none"
        style={{ color: "#ff8c00" }}
      >
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
          fill="currentColor"
        />
      </svg>
    </div>

    {/* Text below image */}
    <div className="contact-info-text">
      <Typography
        variant="h5"
        sx={{ fontWeight: "600", mb: 1, color: "#ff8c00" }}
      >
        Address
      </Typography>
      <Typography sx={{ mb: 1, color: "#555" }}>
        Office 2027NP 182-184 High Street North, Area 1/1, East Ham London United Kingdom E6 2JA
      </Typography>

      <Typography
        variant="h6"
        sx={{ fontWeight: "600", mt: 2, mb: 1, color: "#ff8c00" }}
      >
        (Registered Address)
      </Typography>
      <Typography sx={{ color: "#555" }}>
        Suite 305, Griffith Corporate Centre, Beachmont, Kingstown, St. Vincent And The Grenadines P.O. Box 1510
      </Typography>
    </div>
  </div>
          </div>

          {/* Office Time */}
          <div className="col-md-4 mb-4">
  <div className="contact-info p-4 rounded h-100 text-center" style={{ backgroundColor: "#ffffff", border: "1px solid #f0f0f0", boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)" }}>
    {/* Image on top */}
    <div className="contact-info-icon mb-3">
      <svg
        width="50"
        height="50"
        viewBox="0 0 24 24"
        fill="none"
        style={{ color: "#ff8c00" }}
      >
        <path
          d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
          fill="currentColor"
        />
      </svg>
    </div>

    {/* Text below image */}
    <div className="contact-info-text">
      <Typography
        variant="h5"
        sx={{ fontWeight: "600", mb: 1, color: "#ff8c00" }}
      >
        Office Time
      </Typography>
      <Typography sx={{ mb: 1, color: "#555" }}>Mon 10:00 am – Sat 18:00 pm (GMT+1)</Typography>
      <Typography sx={{ mb: 1, color: "#555" }}>Sunday Close</Typography>

    </div>
  </div>
          </div>

          {/* Email */}
  <div className="col-md-4 mb-4">
  <div className="contact-info p-4 rounded h-100 text-center" style={{ backgroundColor: "#ffffff", border: "1px solid #f0f0f0", boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)" }}>
    {/* Image on top */}
    <div className="contact-info-icon mb-3">
      <svg
        width="50"
        height="50"
        viewBox="0 0 24 24"
        fill="none"
        style={{ color: "#ff8c00" }}
      >
        <path
          d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
          fill="currentColor"
        />
      </svg>
    </div>

    {/* Text below image */}
    <div className="contact-info-text">
      <Typography
        variant="h5"
        sx={{ fontWeight: "600", mb: 1, color: "#ff8c00" }}
      >
        Email
      </Typography>
      <Typography sx={{ mb: 1, color: "#555" }}>
         <span>support&#64;hcfinvest.com</span>
      </Typography>
    </div>
  </div>
          </div>

        {/* Maps Row */}
        <div className="row mt-4">
          <div className="col-md-6 mb-4">
            <div className="contact-page-map rounded shadow-sm overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2481.6117609046473!2d0.04906157662194591!3d51.53868037182046!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47d8a7c3d5aa86e1%3A0x5b21f9acf4794109!2sIcon%20Offices%20-%20East%20Ham%20-%20London!5e0!3m2!1sen!2sin!4v1739274218708!5m2!1sen!2sin"
                width="100%"
                height="350"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Office Map"
              ></iframe>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="contact-page-map rounded shadow-sm overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3885.0887427092466!2d-61.22379772492033!3d13.156802087175832!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c475150d7889919%3A0xec14007759a547d6!2sGriffith%20Corporate%20Centre!5e0!3m2!1sen!2sin!4v1739274137676!5m2!1sen!2sin"
                width="100%"
                height="350"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Registered Address Map"
              ></iframe>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>









      {/* contact Us form Start */}

      <Grid container>
        <Box
          component="form"
          // onSubmit={handleSubmit}
          sx={{
            width: "70%",
            padding: "30px",
            border: "1px solid #f0f0f0",
            borderRadius: "12px",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
            backgroundColor: "#ffffff",
            margin: "3rem auto",
          }}
        >
          <Typography
            variant="h2"
            sx={{
              textAlign: "center",
              fontWeight: 600,
              marginBottom: "25px",
              marginTop: "20px",
              fontSize: "1.8rem",
              color: "#ff8c00",
            }}
          >
            Get in touch with us
          </Typography>

          <TextField
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            size="small"
            placeholder="First Name"
            sx={{ width: "45%", margin: "5px" }}
          />
          <TextField
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            size="small"
            placeholder="Last Name"
            sx={{ width: "45%", margin: "5px" }}
          />
          <TextField
            name="email"
            value={formData.email}
            onChange={handleChange}
            sx={{ width: "45%", margin: "5px" }}
            size="small"
            placeholder="Email"
          />
          <TextField
            name="country"
            value={formData.country}
            onChange={handleChange}
            sx={{ width: "45%", margin: "5px" }}
            size="small"
            placeholder="Country"
          />
          <TextField
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            id="outlined-select-currency"
            size="small"
            type="number"
            placeholder="Phone"
            sx={{ width: "45%", margin: "5px" }}
          />
          <TextField
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            size="small"
            placeholder="Subject"
            sx={{ width: "45%", margin: "5px" }}
          />
          <TextField
            name="message"
            value={formData.message}
            onChange={handleChange}
            id="outlined-multiline-static"
            multiline
            rows={4}
            sx={{ width: "91%", margin: "5px" }}
            placeholder="Message"
          />

          <Button
            type="submit"
            variant="contained"
            sx={{ 
              width: "250px", 
              mt: "20px", 
              mb: "30px", 
              background: "linear-gradient(135deg, #ff8c00 0%, #ff7000 100%)",
              color: "white",
              fontWeight: "600",
              padding: "12px 24px",
              borderRadius: "25px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              "&:hover": { 
                background: "linear-gradient(135deg, #ff7000 0%, #ff5500 100%)",
                transform: "translateY(-2px)"
              } 
            }}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </Box>
      </Grid>

      {/* contact Us form End */}
    </Container>
    </>
  );
};
export default ContactUs;
