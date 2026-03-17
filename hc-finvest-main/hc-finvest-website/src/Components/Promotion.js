import { Box, Container, Typography } from "@mui/material"
import ScrollToTopButton from "./Utilities/ScrollToTopButton";
import { Helmet } from "react-helmet-async";

const Promotion = () => { 

//   const promotions = [
//   {
//     id: 1,
//     imgSrc: "/Images/PromotionImages/Bonus (pramotion).jpg",
//     alt: "50% Bonus",
//     badgeText: "50% Bonus",
//     badgeIcon: <GiftIcon fontSize="small" sx={{ mr: 0.5 }} />,
//     title: "Get 50% Cash Deposit Bonus",
//     description:
//       "Maximize your trading power with a 50% deposit bonus up to $2000. Boost your account instantly.",
//     smallText: "*T&Cs apply.",
//     buttonText: "Learn More",
//     buttonHref: "/bonus",
//     bgColor: "background.paper",
//   },
//   {
//     id: 2,
//     imgSrc: "/Images/PromotionImages/Refer a friend (pramotion).jpg",
//     alt: "Refer a Friend",
//     badgeText: "Refer a Friend",
//     badgeIcon: <GroupIcon fontSize="small" sx={{ mr: 0.5 }} />,
//     title: "Earn Rewards by Referring",
//     description:
//       "Invite your friends to join and trade. Get rewarded with cash, bonuses, or rebates every time they deposit.",
//     smallText: "*T&Cs apply.",
//     buttonText: "Learn More",
//     buttonHref: "/refer-a-friend",
//     bgColor: "primary.light",
//     reverse: true,
//   },
// ];
    return (
      <>

          <Helmet>
            <link rel="canonical" href="https://www.hcfinvest.com/promotions" />
          </Helmet>

        <Container
        sx={{ backgroundColor: "#fff" }}
        maxWidth={false}
        disableGutters
      >
        <ScrollToTopButton />
        <Box
          sx={{
            position: "relative",
            height: "475px",
            display: "flex",
            flexDirection: "column", // 👈 Stack text vertically
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            backgroundImage: `url('Images/PromotionImages/hedgePromotionsimage.jpg')`, // 👈 replace with your image path
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
            Promotions
          </h1>

          <h3
            // variant="h5"
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
            Boost Your Trading Experience with Our Limited-Time Offers
          </h3>
        </Box>

        {/* <Grid
          container
          size={12}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            sx={{
              backgroundColor: "rgba(248, 249, 250, 1)",
              borderRadius: "20px",
              width: "80%",
              padding: "20px",
              margin: "20px",
              boxShadow: "0 .125rem .25rem rgba(0,0,0,.075)!important ",
            }}
          >
            <Grid container size={12}>
              <Grid
                item
                size={6}
                sx={{ display: "flex", justifyContent: "flex-start" }}
              >
                <img
                  src="Images/PromotionImages/Bonus (Pramotion).jpg"
                  style={{ borderRadius: "20px" }}
                />
              </Grid>
              <Grid item size={6} textAlign="left">
                <Box
                  sx={{
                    width: "250px",
                    height: "50px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    backgroundColor: "#ff8c00ff", // same bright orange
                    color: "#ffffff", // white text
                    px: 2.5,
                    py: 0.7,
                    borderRadius: "999px", // fully rounded pill shape
                    fontWeight: "bold",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)", // subtle shadow like image
                  }}
                >
                  <CardGiftcardIcon sx={{ fontSize: 30, color: "#ffffff" }} />
                  <Typography sx={{ fontSize: "25px", fontWeight: "bold" }}>
                    50% Bonus
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    color: "#ff8c00",
                    fontWeight: "bold",
                  }}
                >
                  Get 50% Cash Deposit Bonus
                </Typography>
                <p style={{ color: "var(--bs-secondary-color)" }}>
                  {" "}
                  Maximize your trading power with a 50% deposit bonus up to
                  $2000. Boost your account instantly.
                </p>
                <Typography sx={{ color: "var(--bs-secondary-color)" }}>
                  T&Cs Apply
                </Typography>
                <Button href="/bonus" variant="contained">Learn More</Button>
              </Grid>
            </Grid>
          </Box>

          <Box
            sx={{
              backgroundColor: "rgba(13, 110, 253, 0.09)",
              borderRadius: "20px",
              width: "80%",
              padding: "20px",
              margin: "20px",
              boxShadow: "0 .125rem .25rem rgba(0,0,0,.075)!important ",
            }}
          >
            <Grid container size={12}>
              <Grid item size={6} textAlign="left">
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    backgroundColor: "#ff8c00ff", // same orange color
                    color: "#ffffff", // white text and icon
                    px: 2.5,
                    py: 0.7,
                    borderRadius: "999px", // fully rounded shape
                    fontWeight: "bold",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)", // subtle shadow for lift
                    width: "250px",
                    height: "50px",
                    fontSize: "30px",
                  }}
                >
                  <GroupIcon sx={{ fontSize: 30, color: "#ffffff" }} />
                  <Typography sx={{ fontSize: "25px", fontWeight: "bold" }}>
                    Refer a Friend
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    color: "#ff8c00",
                    fontWeight: "bold",
                  }}
                >
                  Earn Rewards by Referring
                </Typography>
                <p style={{ color: "var(--bs-secondary-color)" }}>
                  {" "}
                  Invite your friends to join and trade. Get rewarded with cash,
                  bonuses, or rebates every time they deposit.
                </p>
                <Typography sx={{ color: "var(--bs-secondary-color)" }}>
                  T&Cs Apply
                </Typography>
                <Button variant="contained">Learn More</Button>
              </Grid>
              <Grid
                item
                size={6}
                sx={{ display: "flex", justifyContent: "flex-end" }}
              >
                <img
                  src="Images/PromotionImages/Refer a friend (Pramotion).jpg"
                  style={{ borderRadius: "20px" }}
                />
              </Grid>
            </Grid>
          </Box>
        </Grid> */}
 <section className="py-5 sectiontext">
      <div className="container">

        {/* Card 1 */}
        <div className="row align-items-center mb-5 p-4 rounded-4 bg-light shadow-sm">
          <div className="col-lg-6">
            <img
              src="/Images/PromotionImages/Bonus (pramotion).jpg"
              className="img-fluid rounded-4 shadow"
              alt="50% Bonus"
            />
          </div>
          <div className="col-lg-6 mt-4 mt-lg-0">
            <span className="custom-badge badge-primary mb-2" style={{backgroundColor:'#2a9df4' , color:'white' ,fontSize:'2rem', padding:'5px' , borderRadius:'10px'}}>
              <i className="fas fa-gift me-1"></i> 50% Bonus
            </span>
            <Typography variant="h4" className="fw-bold" style={{color: "#ff8c00"}}>Get 50% Cash Deposit Bonus</Typography>
            <Typography className="text-muted">
              Maximize your trading power with a 50% deposit bonus up to $2000. Boost your account instantly.
            </Typography>
            <small className="text-muted d-block mb-2">*T&Cs apply.</small>
            <a href="/bonus" className="btn btn-outline-primary btn-sm rounded-pill">
              Learn More
            </a>
          </div>
        </div>

        {/* Card 2 */}
        <div className="row align-items-center flex-lg-row-reverse mb-5 p-4 rounded-4 bg-primary bg-opacity-10 shadow-sm">
          <div className="col-lg-6 text-center text-lg-end">
            <img
              src="/Images/PromotionImages/Refer a friend (pramotion).jpg"
              className="img-fluid rounded-4 shadow"
              alt="Refer a Friend"
            />
          </div>
          <div className="col-lg-6 mt-4 mt-lg-0">
            <span className="custom-badge badge-primary mb-2"  style={{backgroundColor:'#2a9df4' , color:'white' ,fontSize:'2rem', padding:'5px' , borderRadius:'10px'}}>
              <i className="fas fa-user-friends me-1"></i> Refer a Friend
            </span>
            <Typography variant="h4" className="fw-bold" style={{color: "#ff8c00"}}>Earn Rewards by Referring</Typography>
            <Typography className="text-muted">
              Invite your friends to join and trade. Get rewarded with cash, bonuses, or rebates every time they deposit.
            </Typography>
            <small className="text-muted d-block mb-2">*T&Cs apply.</small>
            <a href="/refer-a-friend" className="btn btn-outline-primary btn-sm rounded-pill">
              Learn More
            </a>
          </div>
        </div>

      </div>
    </section>
      </Container>
      
      </>
    );
}

export default Promotion;