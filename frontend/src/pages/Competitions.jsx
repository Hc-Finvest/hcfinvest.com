import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Divider,
  FormControlLabel
} from "@mui/material";
import {API_URL} from "../config/api";  

import GavelIcon from "@mui/icons-material/Gavel";
import SecurityIcon from "@mui/icons-material/Security";

import { useNavigate } from "react-router-dom";

/* ICONS */
import StarIcon from "@mui/icons-material/Star";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import Sidebar from "../components/Sidebar";

/* ---------------- COLOR THEME ---------------- */

const colors = {
  pageBackground: "#EEF1F7",
  cardBackground: "#FFFFFF",
  border: "#E5E9F2",
  textPrimary: "#2C3550",
  textSecondary: "#7B849A",
  tabActiveBg: "#DCE5FF",
  tabActiveText: "#3B5BDB",
  hoverRow: "#F3F6FF",
  buttonGradient: "linear-gradient(90deg,#4C6FFF,#2F54EB)"
};

export default function Competitions() {

  const navigate = useNavigate();

  const [tab, setTab] = useState(0);
  const [competitions, setCompetitions] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [joinedCompetitions, setJoinedCompetitions] = useState([]);

  const [openRules, setOpenRules] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const traders = [
    { rank: 1, name: "Trader 1", avatar: "https://i.pravatar.cc/150?img=12", profit: "$0" },
    { rank: 2, name: "Trader 2", avatar: "https://i.pravatar.cc/150?img=32", profit: "$0" },
    { rank: 3, name: "Trader 3", avatar: "https://i.pravatar.cc/150?img=5", profit: "$0" }
  ];

  useEffect(() => {

const fetchCompetitions = async () => {

  try {

    const user = JSON.parse(localStorage.getItem("user"));
    const clientId = user?._id;

    const res = await axios.get(`${API_URL}/competitions/getall`);

    const competitionsData = res.data.data;

    setCompetitions(competitionsData);

    /* CHECK IF USER ALREADY JOINED */

    if (clientId) {

      const joined = competitionsData
        .filter(comp =>
          comp.participants &&
          comp.participants.includes(clientId)
        )
        .map(comp => comp._id);

      setJoinedCompetitions(joined);

    }

  } catch (error) {
    console.error("Error fetching competitions:", error);
  }

};
    fetchCompetitions();

  }, []);

  useEffect(() => {

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);

  }, []);

  const getCountdown = (startDate) => {

    const diff = new Date(startDate).getTime() - currentTime;

    if (diff <= 0) return "-";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;

  };

  const getStatusStyle = (status) => {

    if (status === "live") return { color: "#16A34A", fontWeight: 600 };
    if (status === "completed") return { color: "#DC2626", fontWeight: 600 };
    if (status === "upcoming") return { color: "#2563EB", fontWeight: 600 };

    return { color: colors.textPrimary };

  };

  const filteredCompetitions = competitions.filter((comp) => {

    if (tab === 0) return comp.competitionStatus === "upcoming";
    if (tab === 1) return comp.competitionStatus === "live";
    if (tab === 2) return comp.competitionStatus === "completed";

    return true;

  });

  const openJoinDialog = (competitionId) => {

    setSelectedCompetition(competitionId);
    setAgreeTerms(false);
    setOpenRules(true);

  };

  const joinCompetition = async (competitionId) => {

    try {

      const user = JSON.parse(localStorage.getItem("user"));
      const clientId = user?._id;

      if (!clientId) {
        alert("User not logged in");
        return;
      }

      await axios.post(
        `${API_URL}/competitions/join/${competitionId}`,
        { userId: clientId }
      );

      setJoinedCompetitions(prev => [...prev, competitionId]);

      setCompetitions(prev =>
        prev.map(comp =>
          comp._id === competitionId
            ? {
                ...comp,
                participants: comp.participants
                  ? [...comp.participants, clientId]
                  : [clientId]
              }
            : comp
        )
      );

    } catch (error) {
      console.error(error);
    }

  };

  const confirmJoinCompetition = async () => {

    await joinCompetition(selectedCompetition);
    setOpenRules(false);

  };

  return (
<div style={{ display: "flex"}}>
    <Sidebar activeMenu="Competitions"/>
    <Box sx={{background:colors.pageBackground,minHeight:"100vh",padding:"0px" , width:'100%'}}>


{/* MyBox */}
    <Box
      sx={{
        position: "relative",
        height: "410px",
        width: "100%",
        // borderRadius: "12px",
        overflow: "hidden",
        mb: 4,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        px: 6,
        py: 4,
        backgroundImage: "url('/bgm.png')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {/* Dark Overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          // background: "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.1) 100%)"
        }}
      />

      {/* Title + Subtitle */}
      <Box sx={{ position: "relative", color: "#000", maxWidth: "700px" }}>
        <Typography
          sx={{
            fontSize: 50,
            fontWeight: 700,
            mb: 1
          }}
        >
          Competitions
        </Typography>

        <Typography
          sx={{
            fontSize: 20,
            opacity: 0.9
          }}
        >
          Join trading contests with cash prizes and great rewards.
          Compete for the top spot!
        </Typography>
      </Box>

      {/* Tabs at Bottom */}
      <Box sx={{ position: "relative" }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{
            "& .MuiTab-root": {
              color: "#000",
              opacity: 0.85,
              fontWeight: 500,
              fontSize: 15
            },
            "& .Mui-selected": {
              color: "#000",
              fontWeight: 700
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#000",
              height: "3px"
            }
          }}
        >
          <Tab label="Upcoming" />
          <Tab label="Ongoing" />
          <Tab label="Completed" />
        </Tabs>
      </Box>
    </Box>


    {/* Main Content */}
      <Box sx={{display:"flex",gap:"25px"}}>

        <Box sx={{flex:3}}>

          <Typography sx={{fontWeight:600,marginBottom:"10px",color:colors.textPrimary}}>
            Competitions
          </Typography>

          <Card sx={{borderRadius:"10px",border:`1px solid ${colors.border}`}}>

            <Box sx={{
              display:"grid",
              gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",
              padding:"16px",
              background:"#F8FAFC",
              borderBottom:`1px solid ${colors.border}`,
              fontWeight:600
            }}>
              <Typography>Competition</Typography>
              <Typography>Prize Pool</Typography>
              <Typography>Participants</Typography>
              <Typography>Status</Typography>
              <Typography>Countdown</Typography>
              <Typography>Action</Typography>
            </Box>

            {filteredCompetitions.map((comp)=>(

              <Box key={comp._id}
                sx={{
                  display:"grid",
                  gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",
                  padding:"18px",
                  alignItems:"center",
                  borderBottom:`1px solid ${colors.border}`,
                  "&:hover":{background:colors.hoverRow}
                }}
              >

                <Box sx={{display:"flex",alignItems:"center",gap:"10px"}}>

                  <StarIcon sx={{color:"#F59E0B",fontSize:22}}/>

                  <Box>
                    <Typography sx={{fontWeight:600}}>
                      {comp.competitionName}
                    </Typography>

                    <Typography sx={{fontSize:"13px",color:colors.textSecondary}}>
                      {new Date(comp.startDate).toLocaleDateString()} -
                      {new Date(comp.endDate).toLocaleDateString()}
                    </Typography>
                  </Box>

                </Box>

                <Typography>{comp.totalPrizePool}</Typography>

                <Typography sx={{color:colors.textSecondary}}>
                  {comp.participants ? comp.participants.length : 0} Participants
                </Typography>

                <Typography sx={getStatusStyle(comp.competitionStatus)}>
                  {comp.competitionStatus.toUpperCase()}
                </Typography>

                <Typography sx={{color:colors.textSecondary}}>
                  {comp.competitionStatus==="upcoming"
                    ? getCountdown(comp.startDate)
                    : "-"}
                </Typography>

                {comp.competitionStatus==="completed"?(
                  <Button
                    sx={{
                      background:"#16A34A",
                      color:"#fff",
                      textTransform:"none",
                      borderRadius:"6px",
                      fontWeight:600
                    }}
                    onClick={()=>navigate(`/leaderboard/${comp._id}`)}
                  >
                    View Result
                  </Button>
                ):(
                  <Button
                    sx={{
                      background: joinedCompetitions.includes(comp._id)
                        ? "#16A34A"
                        : colors.buttonGradient,
                      color:"#fff",
                      textTransform:"none",
                      borderRadius:"6px",
                      fontWeight:600
                    }}
                    disabled={joinedCompetitions.includes(comp._id)}
                    onClick={()=>openJoinDialog(comp._id)}
                  >
                    {joinedCompetitions.includes(comp._id)
                      ? "Joined"
                      : "Join Competition"}
                  </Button>
                )}

              </Box>

            ))}

          </Card>

        </Box>

        <Box sx={{flex:1}}>

          <Typography sx={{fontWeight:600,marginBottom:"10px",color:colors.textPrimary}}>
            Leaderboard
          </Typography>

          <Card sx={{borderRadius:"10px",border:`1px solid ${colors.border}`,padding:"15px"}}>

            {traders.map((trader)=>(

              <Box key={trader.rank}
                sx={{
                  display:"flex",
                  justifyContent:"space-between",
                  alignItems:"center",
                  padding:"10px 5px"
                }}
              >

                <Box sx={{display:"flex",alignItems:"center",gap:"10px"}}>

                  {trader.rank===1 && <EmojiEventsIcon sx={{color:"#FACC15"}}/>}
                  {trader.rank===2 && <WorkspacePremiumIcon sx={{color:"#94A3B8"}}/>}
                  {trader.rank===3 && <WorkspacePremiumIcon sx={{color:"#CD7F32"}}/>}

                  <Avatar src={trader.avatar} sx={{width:40,height:40}}/>

                  <Typography>{trader.name}</Typography>

                </Box>

                <Typography>{trader.profit}</Typography>

              </Box>

            ))}

          </Card>

        </Box>

      </Box>

<Dialog
  open={openRules}
  onClose={() => setOpenRules(false)}
  maxWidth="lg"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: "16px",
      p: 1
    }
  }}
>
  {/* TITLE */}

  <DialogTitle
    sx={{
      fontWeight: 700,
      fontSize: "22px",
      textAlign: "center"
    }}
  >
    Trading Competition Rules
  </DialogTitle>

  <Divider />

  <DialogContent
    sx={{
      mt: 2,
      maxHeight: "520px",
      overflowY: "auto"
    }}
  >
    <Box
      sx={{
        display: "flex",
        gap: 3,
        flexWrap: "wrap"
      }}
    >
      {/* LEFT BOX */}

      <Box
        sx={{
          flex: 1,
          minWidth: "420px",
          borderRadius: "14px",
          background: "#F7F9FC",
          p: 3,
          border: "1px solid #E3E8F0"
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <GavelIcon color="primary" />
          <Typography fontWeight={700} fontSize={25}>
            Competition Rules
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5
          }}
        >
          {[
            "Participants must have a registered and verified trading account",
            "Only one competition account per participant",
            "Competition runs only between specified dates",
            "All traders start with the same balance",
            "Ranking based on highest ROI",
            "Minimum number of trades required",
            "Minimum trading volume may apply",
            "Maximum drawdown limit applies",
            "Platform exploitation is prohibited",
            "Leaderboard updates automatically",
            "Tie-breakers: lowest drawdown, volume, earliest profit",
            "KYC required for winners",
            "Prizes credited after competition ends",
            "Organizer reserves the right to update rules"
          ].map((rule, index) => (
            <Typography
              key={index}
              sx={{
                fontSize: "16px",
                lineHeight: 1.5,
                color: "#444"
              }}
            >
              • {rule}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* RIGHT BOX */}

      <Box
        sx={{
          flex: 1,
          minWidth: "420px",
          borderRadius: "14px",
          background: "#F7F9FC",
          p: 3,
          border: "1px solid #E3E8F0"
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <SecurityIcon color="error" />
          <Typography fontWeight={700} fontSize={25}>
            Anti-Cheating Rules
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5
          }}
        >
          {[
            "Arbitrage trading is strictly prohibited",
            "Latency trading or price exploitation not allowed",
            "Multiple competition accounts forbidden",
            "Hedging between participants prohibited",
            "Copy trading between participants not allowed",
            "Collusion between traders forbidden",
            "Exploiting platform bugs leads to disqualification",
            "Suspicious trading may remove user from leaderboard",
            "Automated trading systems may be restricted",
            "Organizer can audit and disqualify accounts"
          ].map((rule, index) => (
            <Typography
              key={index}
              sx={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#444"
              }}
            >
              • {rule}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>

    {/* TERMS */}

    <Box
      sx={{
        mt: 4,
        p: 2,
        borderRadius: "10px",
        background: "#F2F6FF"
      }}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
          />
        }
        label={
          <Typography fontWeight={500}>
            I agree to the competition terms and regulations
          </Typography>
        }
      />
    </Box>
  </DialogContent>

  <Divider />

  {/* BUTTONS */}

  <DialogActions sx={{ p: 3 }}>
    <Button
      onClick={() => setOpenRules(false)}
      variant="outlined"
      sx={{ borderRadius: "8px" }}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      disabled={!agreeTerms}
      onClick={confirmJoinCompetition}
      sx={{
        borderRadius: "8px",
        px: 4,
        fontWeight: 600
      }}
    >
      Join Competition
    </Button>
  </DialogActions>
</Dialog>

    </Box>

    </div>

  );

}