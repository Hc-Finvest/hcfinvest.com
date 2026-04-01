// New_Compition.jsx
import {
  Trophy,
  Users,
  Clock,
  Medal,
  DollarSign,
  TrendingUp, RefreshCw , Moon, Sun, Settings, LogOut, User, ShieldCheck
} from "lucide-react";

import axios from "axios";
import { API_URL } from "../config/api";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { useTheme } from '../context/ThemeContext'
import NavbarClient from "../components/NavbarClient";
import { useSidebar } from "../context/SidebarContext.jsx";

export default function New_Compition() {


const [tab, setTab] = useState("active");
  const navigate = useNavigate();
  
const [insufficientDialogOpen, setInsufficientDialogOpen] = useState(false);


    const [leaderboard, setLeaderboard] = useState([]);
    const [selectedCompId, setSelectedCompId] = useState(null);


    const [competitions, setCompetitions] = useState([]);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [joinedCompetitions, setJoinedCompetitions] = useState([]);
  
    const [openRules, setOpenRules] = useState(false);
    const [selectedCompetition, setSelectedCompetition] = useState(null);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [enrollmentData, setEnrollmentData] = useState(null);
      const { isDarkMode, toggleDarkMode } = useTheme();
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);

    const [selectedBannerComp, setSelectedBannerComp] = useState(null);
    const [bestRank, setBestRank] = useState(null);
    const [competitionProfit, setCompetitionProfit] = useState(0);
    const [totalWinnings, setTotalWinnings] = useState(0);
    const { sidebarExpanded } = useSidebar();
  
  
    const top3 = leaderboard.slice(0, 3);
  

    // Calculations of Total winnings 
        useEffect(() => {
          const fetchTotalWinnings = async () => {
            try {
              const user = JSON.parse(localStorage.getItem("user"));
              const clientId = user?._id;

              if (!clientId) return;

              const res = await axios.get(
                `${API_URL}/competition/total-winnings/${clientId}`
              );

              if (res.data?.success) {
                setTotalWinnings(res.data.totalWinnings);
              }

            } catch (error) {
              console.error("Error fetching winnings:", error);
            }
          };

          fetchTotalWinnings();
        }, []);

    // Fetch All Cometitions
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

    // Fetching the best rank 
    useEffect(() => {
        const fetchBestRank = async () => {
          try {
            const user = JSON.parse(localStorage.getItem("user"));
            const clientId = user?._id;

            if (!clientId || competitions.length === 0) return;

            // ✅ Get joined competitions
            const joined = competitions.filter(
              (comp) =>
                comp.participants &&
                comp.participants.includes(clientId)
            );

            let ranks = [];

            for (const comp of joined) {
              try {
                const res = await axios.get(
                  `${API_URL}/competition/leaderboard/${comp._id}`
                );

                const leaderboard = res.data.leaderboard || [];

                const userEntry = leaderboard.find(
                  (u) => u.userId === clientId
                );

                if (userEntry && userEntry.rank) {
                  ranks.push(userEntry.rank);
                }

              } catch (err) {
                console.error("Leaderboard error:", err);
              }
            }

            // ✅ Find best rank (minimum)
            if (ranks.length > 0) {
              setBestRank(Math.min(...ranks));
            }

          } catch (error) {
            console.error("Best Rank Error:", error);
          }
        };

        fetchBestRank();
      }, [competitions]); 
    

      // Fetch the profit as per the competition
      useEffect(() => {
  const fetchCompetitionProfit = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const clientId = user?._id;

      if (!clientId || competitions.length === 0) return;

      // ✅ Get joined competitions
      const joined = competitions.filter(
        (comp) =>
          comp.participants &&
          comp.participants.includes(clientId)
      );

      let totalProfit = 0;

      for (const comp of joined) {
        try {
          const res = await axios.get(
            `${API_URL}/competition/leaderboard/${comp._id}`
          );

          const leaderboard = res.data.leaderboard || [];

          const userEntry = leaderboard.find(
            (u) => u.userId === clientId
          );

          if (userEntry && userEntry.profitLoss) {
            totalProfit += userEntry.profitLoss;
          }

        } catch (err) {
          console.error("Leaderboard error:", err);
        }
      }

      setCompetitionProfit(totalProfit);

    } catch (error) {
      console.error("Competition Profit Error:", error);
    }
  };

  fetchCompetitionProfit();
}, [competitions]);

    
    useEffect(() => {
  
      const timer = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
  
      return () => clearInterval(timer);
  
    }, []);


      useEffect(() => {
    if (!selectedCompId) return;

    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/competition/leaderboard/${selectedCompId}`,
        );

        setLeaderboard(res.data.leaderboard || []);
      } catch (err) {
        console.error("Leaderboard error:", err);
      }
    };

    fetchLeaderboard();

    // 🔥 auto refresh every 5 sec
    const interval = setInterval(fetchLeaderboard, 5000);

    return () => clearInterval(interval);
  }, [selectedCompId]);



  
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

          if (tab === "active") return comp.competitionStatus === "live";

          if (tab === "upcoming") return comp.competitionStatus === "upcoming";

          if (tab === "past") return comp.competitionStatus === "completed";

          return true;

        });

    const openJoinDialog = (competitionId) => {
  
      setSelectedCompetition(competitionId);
      setAgreeTerms(false);
      setOpenRules(true);
  
    };

      const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/user/login");
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
const sendCompetitionJoinEmail = async ({
  email,
  name,
  competitionName,
  startDate,
}) => {
  try {
    const res = await axios.post(
      `${API_URL}/competition-email/competition-join`,
      {
        email,
        name,
        competitionName,
        startDate,
      }
    );

    // ✅ optional success log
    if (res.data?.success) {
      console.log("📧 Email sent successfully");
    }

  } catch (error) {
    console.error(
      "❌ Email sending failed:",
      error.response?.data?.message || error.message
    );

    // ❗ DO NOT throw → don't break main flow
  }
};

 const confirmJoinCompetition = async () => {

    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));
      const clientId = user?._id;

      if (!clientId) {
        alert("User not logged in");
        return;
      }

      const selectedComp = competitions.find(
        (comp) => comp._id === selectedCompetition
      );

      if (!selectedComp) {
        alert("Competition not found");
        return;
      }

      const entryFee = selectedComp.entryFee;
      const initialDeposit = selectedComp?.initialDeposit ?? 10000;

      // 💰 Wallet Check
      const walletRes = await axios.get(`${API_URL}/wallet/${clientId}`);
      const balance = walletRes.data?.wallet?.balance;

      if (balance < entryFee) {
        setInsufficientDialogOpen(true);
        setOpenRules(false);
        return;
      }
      // ✅ STEP 1: JOIN COMPETITION
      await deductEntryFee({ userId: clientId, amount: entryFee });
      // ✅ STEP 2: DEDUCT ENTRY FEE
      await joinCompetition(selectedCompetition);
      // ✅ STEP 3: CREATE DEMO ACCOUNT
      await createParticipant({ competitionId: selectedCompetition, user, initialDeposit });
      // ✅ STEP 4: CREATE DEMO ACCOUNT
      const demoRes = await handleCreateCompetitionDemo();
      console.log("Demo Account Created:", demoRes);
      // 🔥 STORE DATA FOR DIALOG


      setEnrollmentData({
        name: user.firstName,
        email: user.email,
        accountNumber: demoRes?.data?.accountId,
        // username: demoRes?.data?.email,
        username: user.email,
        password: user.password || "******",
        startDate: selectedComp.startDate
      });


      await sendCompetitionJoinEmail({email: user.email, name: user.firstName, competitionName: selectedComp.competitionName, startDate: selectedComp.startDate});

      setSuccessDialogOpen(true);
      setOpenRules(false);

    } catch (error) {
      console.error(error);

      if (error.response?.data?.message === "User already joined this competition") {
        alert("You already joined this competition");
      } else {
        alert(error.response?.data?.message || "Something went wrong");
      }

    } finally {
      setLoading(false);
    }
  };

    const createParticipant = async ({ competitionId, user, initialDeposit }) => {
      console.log("All Data for User"+ user.data);
    const clientId = user?._id;

    return await axios.post(`${API_URL}/competitions/createParticipant`, {
      competitionId,
      userId: clientId,
      participantName: user?.firstName || "Trader",
      tradingAccountNumber: "DEMO_" + Date.now(),
      initialDeposit
    });
  };

    const deductEntryFee = async ({ userId, amount }) => {
      return await axios.post(`${API_URL}/wallet/deduct-entry-fee`, {
        userId,
        amount
      });
    };
      
  const handleCreateCompetitionDemo = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
  
      if (!user._id) {
        alert("Please login first");
        return;
      }
  
      const existingRes = await fetch(
        `${API_URL}/trading-accounts/user/${user._id}`
      );
      const existingData = await existingRes.json();
  
      const alreadyExists = existingData.accounts?.find(
        (acc) => acc.accountName === "Competition Account"
      );
  
      if (alreadyExists) {
        alert("Competition account already exists!");
        navigate(`/trade/${alreadyExists._id}`);
        return;
      }
  
      const res = await fetch(`${API_URL}/account-types`);
      const data = await res.json();
  
      const demoType = data.accountTypes?.find((t) => t.isDemo);
  
      if (!demoType) {
        alert("No demo account type available");
        return;
      }
  
      const createRes = await fetch(`${API_URL}/trading-accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          accountTypeId: demoType._id,
          pin: "0000",
          accountName: "Competition Account",
        }),
      });
  
      const createData = await createRes.json();
      if (createRes.ok) {
        console.log("Created Competition Account:", createData.account);
        return createData; // ✅ IMPORTANT
      } else {
        throw new Error(createData.message || "Failed to create account");
      }
  
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating competition account");
    }
  };

        useEffect(() => {
        if (filteredCompetitions.length > 0 && !selectedBannerComp) {
          setSelectedBannerComp(filteredCompetitions[0]);
          setSelectedCompId(filteredCompetitions[0]._id); // for leaderboard
        }
      }, [filteredCompetitions]);


      const joinedCount = joinedCompetitions.length;

        const activeCount = competitions.filter(
          (comp) => comp.competitionStatus === "live"
        ).length;

        const upcomingCount = competitions.filter(
          (comp) => comp.competitionStatus === "upcoming"
        ).length;

        // const pastCount = competitions.filter(
        //   (comp) => comp.competitionStatus === "completed"
        // ).length;


  return (
    <div className="min-h-screen flex bg-[#f4f6fb] text-gray-800">
      {/* SIDEBAR */}
      <Sidebar activeMenu="Competition" />

      {/* MAIN CONTENT */}
      {/* <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 "> */}
      <div
        className={`flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 transition-all duration-300 ${
          sidebarExpanded ? "ml-[280px]" : "ml-[64px]"
        }`}
      >
        {/* HEADER */}
        {/* <div className="mb-6 ">
          <h1 className="text-2xl font-bold">Trading Competitions</h1>
          <p className="text-gray-400 text-sm">
            Compete with other traders and win amazing prizes.
          </p>
        </div> */}

        <NavbarClient title="Trading Competitions" subtitle="Compete with other traders and win amazing prizes." />

        {/* MAIN BANNER */}
  <div className="border rounded-2xl p-6 mb-6 bg-white border-gray-200 text-gray-700">
    <div className="flex justify-between items-start flex-wrap gap-4">

    {/* LEFT */}
    <div>
      <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs">
        {selectedBannerComp?.competitionStatus === "live"
          ? "Live Now"
          : selectedBannerComp?.competitionStatus}
      </span>

      <h2 className="text-xl font-semibold mt-3">
        {selectedBannerComp?.competitionName || "No Active Competition"}
      </h2>

      <p className="text-gray-400 text-sm mt-1">
        {selectedBannerComp?.description || "Trading competition"}
      </p>

      <div className="flex items-center gap-4 mt-4 text-sm flex-wrap">

        {/* 💰 Prize */}
        <div className="flex items-center gap-1">
          <Trophy size={16} className="text-yellow-400" />
          ${selectedBannerComp?.totalPrizePool || 0}
        </div>

        {/* 👥 Participants */}
        <div className="flex items-center gap-1">
          <Users size={16} />
          {selectedBannerComp?.participants?.length || 0}
        </div>

        {/* ⏳ Countdown */}
        <div className="flex items-center gap-1 text-red-400">
          <Clock size={16} />
          {selectedBannerComp
            ? getCountdown(selectedBannerComp.startDate)
            : "-"}
        </div>
      </div>
    </div>

    {/* RIGHT */}
<div className="text-right">

  <div className="flex items-center justify-end gap-5 mb-1">
    
    {/* Start Know More Button for more Hwo the competition works */}

    {/* <button
      onClick={() => {
        console.log("Know More clicked");
      }}
      className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition"
    >
      Know More
    </button> */}

    {/* End  Know More Button for more Hwo the competition works */}

    <p className="text-gray-400 text-sm">Your Current Rank</p>
  </div>

  <h2 className="text-3xl font-bold">
    #{selectedBannerComp?.yourRank || "-"}
  </h2>

  <p className="text-gray-400 text-sm mt-3">Your Profit</p>
  <p className="text-blue-600 text-lg font-semibold">
    ${selectedBannerComp?.yourProfit || "0.00"}
  </p>

</div>

  </div>
</div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border bg-white border-gray-200 shadow-sm rounded-2xl text-black p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm">Competitions Joined</p>
                <h2 className="text-xl font-bold mt-1">{joinedCount}</h2>
              </div>
              <Trophy className="text-yellow-400" />
            </div>
          </div>

          <div className="border border-gray-200 shadow-sm  bg-white rounded-2xl p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm">Best Rank</p>
                <h2 className="text-xl font-bold mt-1 text-blue-600">{bestRank}</h2>
              </div>
              <Medal className="text-blue-700" />
            </div>
          </div>

          <div className="border bg-white border-gray-200 shadow-sm  rounded-2xl p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Winnings</p>
                <h2 className="text-xl font-bold mt-1">{totalWinnings.toFixed(2)}</h2>
              </div>
              <DollarSign className="text-blue-600" />
            </div>
          </div>

          <div className="border border-gray-200 shadow-sm  bg-white rounded-2xl p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm">Competition Profit</p>
                <h2 className="text-xl font-bold mt-1 text-blue-700">
                  {competitionProfit}
                </h2>
              </div>
              <TrendingUp className="text-blue-700" />
            </div>
          </div>
        </div>

        {/* 🔥 TABS (UPDATED - RADIX STYLE LOOK) */}
        <div className="mt-10 flex justify-center">
          <div
            role="tablist"
            className="grid grid-cols-3 w-full max-w-lg h-11 items-center rounded-xl border border-gray-200 shadow-sm  bg-blue-100 p-1"
          >
            {/* ACTIVE */}
            <button
              role="tab"
              onClick={() => setTab("active")}
              className={`flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium transition-all ${
                tab === "active"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-900 hover:text-blue-700"
              }`}
            >
              Active ({activeCount})
            </button>

            {/* UPCOMING */}
            <button
              role="tab"
              onClick={() => setTab("upcoming")}
              className={`flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium transition-all ${
                tab === "upcoming"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-900 hover:text-blue-700"
              }`}
            >
              Upcoming ({upcomingCount})
            </button>

            {/* PAST */}
            <button
              role="tab"
              onClick={() => setTab("past")}
              className={`flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium transition-all ${
                tab === "past"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-900 hover:text-blue-700"
              }`}
            >
              Past Results
            </button>
          </div>
        </div>

        {/* 🔥 TAB CONTENT */}

        {/* ACTIVE */}
        {tab === "active" && (
          <div className="mt-6 space-y-6">
            {/* 🔥 COMPETITION LIST */}
            <div className="space-y-4">
              {/* CARD 1 */}
              <div className="space-y-4">
                {filteredCompetitions.map((comp) => (
                  <div
                    key={comp._id}
                    onClick={() => {
                    setSelectedBannerComp(comp);
                    setSelectedCompId(comp._id);
                  }}
                    className="flex flex-col gap-6 rounded-xl border border-gray-200 shadow-sm py-6 bg-white"
                  >
                    <div className="px-6 pt-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-black">
                        {/* LEFT */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {/* ✅ Competition Name */}
                            <h3 className="font-semibold text-gray-800">
                              {comp.competitionName}
                            </h3>

                            {/* ✅ Joined Badge */}
                            {joinedCompetitions.includes(comp._id) && (
                              <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-400">
                                Joined
                              </span>
                            )}
                          </div>

                          {/* ✅ Description */}
                          <p className="text-sm text-gray-400">
                            {comp.description || "Trading competition"}
                          </p>

                          {/* DETAILS */}
                          <div className="flex items-center gap-4 pt-1">
                            {/* 🏆 1st Prize */}
                            <div className="flex items-center gap-1 text-sm">
                              <Trophy className="h-4 w-4 text-yellow-400" />
                              <span>
                                ${comp.firstPrize || comp.totalPrizePool}
                              </span>
                            </div>


                            <div className="flex items-center gap-1 text-sm">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span className="text-gray-600">
                                Entry: ${comp.entryFee || 0}
                              </span>
                            </div>

                            {/* 👥 Participants */}
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-400">
                                {comp.participants?.length || 0}
                              </span>
                            </div>


                            {/* 📅 Start Date */}
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-400">
                                {new Date(comp.startDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Your Rank</p>
                            <p className="text-xl font-bold text-gray-800">
                              #{comp.yourRank || "-"}
                            </p>
                          </div>

                          <button
                            onClick={() => openJoinDialog(comp._id)}
                            disabled={joinedCompetitions.includes(comp._id)}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              joinedCompetitions.includes(comp._id)
                                ? "bg-blue-500 hover:bg-blue-700 text-white"
                                : "bg-blue-500 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {joinedCompetitions.includes(comp._id)
                              ? "Joined"
                              : "Register Now"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🔥 LEADERBOARD HEADER */}
            {/* <div className="border border-gray-200 shadow-sm  rounded-2xl p-5 bg-white">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h2 className="font-semibold">
                    Leaderboard - Rise to the Top
                  </h2>
                  <p className="text-xs text-gray-400">
                    Live points ranking with podium highlights
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button className="text-xs bg-blue-500/20 px-3 py-1 rounded-lg">
                    Current Leaderboard
                  </button>
                  <button className="text-xs bg-white/10 px-3 py-1 rounded-lg">
                    IB Leaderboard
                  </button>
                  <button className="text-xs bg-white/10 px-3 py-1 rounded-lg">
                    Live Points
                  </button>
                  <button className="text-xs bg-white/10 px-3 py-1 rounded-lg">
                    $10,000 Pool
                  </button>
                </div>
              </div>
            </div> */}

            {/* 🔥 PODIUM */}
            <div className="border  shadow-sm  rounded-2xl p-5 bg-white border-gray-200">
              <p className="text-xs text-gray-400 mb-4">ELITE PODIUM</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* 🥈 2nd Winner - ADVANCED UI */}
                <div className="group relative min-h-[300px] overflow-hidden rounded-2xl border px-4 pb-6 pt-5 text-center transition-all duration-500 bg-[linear-gradient(135deg,#ecfdf5,#ffffff,#d1fae5)] border border-green-200 border-[#29466c]">
                  {/* BOTTOM CARD */}
                  <div className="absolute bottom-8 left-1/2 h-[106px] w-[88%] -translate-x-1/2 rounded-t-xl border border-[#2f4c70] bg-[linear-gradient(180deg,rgba(24,52,92,0.7),rgba(10,23,44,0.95))]">
                    <div className="flex h-full flex-col items-center justify-start px-3 pt-5">
                      {/* <p className="text-sm font-semibold text-slate-100">
                        ByteX
                      </p> */}

                      {top3[2] && (
                        <p className="text-sm font-semibold text-slate-100">
                          {top3[2].name}
                        </p>
                      )}

                      <div className="mt-3 rounded-md border border-[#345a87] bg-[linear-gradient(180deg,rgba(19,42,75,0.98),rgba(9,24,46,0.98))] px-2 py-1 text-[12px] font-semibold text-amber-200 shadow-[0_8px_22px_rgba(4,10,24,0.55)]">
                        <span className="inline-flex items-center gap-1">
                          💰 5k season reward
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TOP GRAPHIC */}
                  <div className="relative z-10 flex justify-center">
                    <div className="relative h-[168px] w-[276px]">
                      {/* LEFT SHAPES */}
                      <span className="absolute left-[28px] top-[45px] h-[44px] w-[100px] -skew-x-[34deg] border bg-gradient-to-b from-[#cfd5e8] to-[#8893b8] border-[#d9def0]" />
                      <span className="absolute left-[50px] top-[66px] h-[28px] w-[68px] -skew-x-[20deg] border bg-gradient-to-b from-[#e5e9f7] to-[#9aa5ca] border-[#e9edfb]" />

                      {/* RIGHT SHAPES */}
                      <span className="absolute right-[28px] top-[45px] h-[44px] w-[100px] skew-x-[34deg] border bg-gradient-to-b from-[#cfd5e8] to-[#8893b8] border-[#d9def0]" />

                      {/* CENTER HEX */}
                      <span
                        className="absolute left-1/2 top-[31px] h-[94px] w-[112px] -translate-x-1/2 border bg-gradient-to-b from-[#d7dced] via-[#a6b0cf] to-[#7e87a8] border-[#dde3f6]"
                        style={{
                          clipPath:
                            "polygon(50% 0,87% 16%,92% 45%,73% 84%,50% 100%,27% 84%,8% 45%,13% 16%)",
                        }}
                      />

                      {/* AVATAR */}
                      <img
                        src="/icon1.png"
                        alt="ByteX"
                        className="absolute left-1/2 top-[78px] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      />

                      {/* RANK */}
                      <span className="absolute left-1/2 top-[106px] inline-flex h-6 min-w-6 -translate-x-1/2 items-center justify-center rounded-full border border-[#3d6799] bg-[#10294e] px-1 text-[10px] font-semibold text-cyan-100">
                        2
                      </span>
                    </div>
                  </div>
                </div>

                {/* 🥇 1st Winner Premium */}
                <div className="group relative min-h-[300px] overflow-hidden rounded-2xl border px-4 pb-6 pt-5 text-center transition-all duration-500 bg-[linear-gradient(135deg,#ecfdf5,#ffffff,#d1fae5)] border border-green-200 border-cyan-300/70 md:scale-105 shadow-[0_0_36px_rgba(34,211,238,0.18)]">
                  {/* BOTTOM CARD */}
                  <div className="absolute bottom-8 left-1/2 h-[106px] w-[88%] -translate-x-1/2 rounded-t-xl border border-[#2f4c70] bg-[linear-gradient(180deg,rgba(24,52,92,0.7),rgba(10,23,44,0.95))]">
                    <div className="flex h-full flex-col items-center justify-start px-3 pt-5">
                      {/* <p className="text-sm font-semibold text-slate-100">
                        Hawk
                      </p> */}
                      {top3[0] && (
                        <p className="text-sm font-semibold text-slate-100">
                          {top3[0].name}
                        </p>
                      )}

                      <div className="mt-3 rounded-md border border-[#345a87] bg-[linear-gradient(180deg,rgba(19,42,75,0.98),rgba(9,24,46,0.98))] px-2 py-1 text-[12px] font-semibold text-amber-200 shadow-[0_8px_22px_rgba(4,10,24,0.55)]">
                        <span className="inline-flex items-center gap-1">
                          💰 10k season reward
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TOP GRAPHIC */}
                  <div className="relative z-10 flex justify-center mt-2">
                    <div className="relative h-[168px] w-[276px] scale-105">
                      {/* GOLD SHAPES */}
                      <span className="absolute left-[28px] top-[45px] h-[44px] w-[100px] -skew-x-[34deg] border bg-gradient-to-b from-[#ffd73f] to-[#e99a10] border-[#ffdd63]"></span>
                      <span className="absolute left-[50px] top-[66px] h-[28px] w-[68px] -skew-x-[20deg] border bg-gradient-to-b from-[#ffe05b] to-[#f6ae12] border-[#ffd66a]"></span>

                      <span className="absolute right-[28px] top-[45px] h-[44px] w-[100px] skew-x-[34deg] border bg-gradient-to-b from-[#ffd73f] to-[#e99a10] border-[#ffdd63]"></span>
                      <span className="absolute right-[50px] top-[66px] h-[28px] w-[68px] skew-x-[20deg] border bg-gradient-to-b from-[#ffe05b] to-[#f6ae12] border-[#ffd66a]"></span>

                      {/* CENTER BADGE */}
                      <span className="absolute left-1/2 top-[31px] h-[94px] w-[112px] -translate-x-1/2 border bg-gradient-to-b from-[#ffcf38] via-[#f3a018] to-[#da790f] border-[#ffd86e] [clip-path:polygon(50%_0,87%_16%,92%_45%,73%_84%,50%_100%,27%_84%,8%_45%,13%_16%)]"></span>

                      {/* AVATAR */}
                      <img
                        src="/icon2.png"
                        alt="Hawk"
                        className="absolute left-1/2 top-[78px] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      />

                      {/* RANK */}
                      <span className="absolute left-1/2 top-[106px] -translate-x-1/2 rounded-full border border-[#3d6799] bg-[#10294e] px-2 py-1 text-xs text-cyan-100">
                        1
                      </span>
                    </div>
                  </div>
                </div>

                {/* 🔥 3rd (Advanced Podium Card) */}
                <div className="group relative min-h-[300px] overflow-hidden rounded-2xl border px-4 pb-6 pt-5 text-center transition-all duration-500 bg-[linear-gradient(135deg,#ecfdf5,#ffffff,#d1fae5)] border border-green-200 border-[#29466c]">
                  {/* BOTTOM INFO BOX */}
                  <div className="absolute bottom-8 left-1/2 h-[106px] w-[88%] -translate-x-1/2 rounded-t-xl border border-[#2f4c70] bg-[linear-gradient(180deg,rgba(24,52,92,0.7),rgba(10,23,44,0.95))]">
                    <div className="flex h-full flex-col items-center justify-start px-3 pt-5">
                      {/* <p className="text-sm font-semibold text-slate-100">
                        Voyager
                      </p> */}
                      {top3[2] && (
                        <p className="text-sm font-semibold text-slate-100">
                          {top3[2].name}
                        </p>
                      )}

                      <div className="mt-3 rounded-md border border-[#345a87] bg-[linear-gradient(180deg,rgba(19,42,75,0.98),rgba(9,24,46,0.98))] px-2 py-1 text-[12px] font-semibold text-amber-200 shadow-[0_8px_22px_rgba(4,10,24,0.55)]">
                        <span className="inline-flex items-center gap-1">
                          🪙 2.5k season reward
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TOP GRAPHIC */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-center">
                      <div className="relative h-[168px] w-[276px]">
                        {/* LEFT BLOCKS */}
                        <span className="absolute left-[28px] top-[45px] h-[44px] w-[100px] -skew-x-[34deg] border bg-gradient-to-b from-[#be5f2e] to-[#6b2f13] border-[#d0885e]" />
                        <span className="absolute left-[50px] top-[66px] h-[28px] w-[68px] -skew-x-[20deg] border bg-gradient-to-b from-[#d57b4b] to-[#8a3c1a] border-[#df9066]" />

                        {/* RIGHT BLOCKS */}
                        <span className="absolute right-[28px] top-[45px] h-[44px] w-[100px] skew-x-[34deg] border bg-gradient-to-b from-[#be5f2e] to-[#6b2f13] border-[#d0885e]" />

                        {/* CENTER SHAPE */}
                        <span
                          className="absolute left-1/2 top-[31px] h-[94px] w-[112px] -translate-x-1/2 border bg-gradient-to-b from-[#c76637] via-[#9a4824] to-[#6e3218] border-[#d88f68]"
                          style={{
                            clipPath:
                              "polygon(50% 0,87% 16%,92% 45%,73% 84%,50% 100%,27% 84%,8% 45%,13% 16%)",
                          }}
                        />

                        {/* AVATAR */}
                        <img
                          src="/icon3.png"
                          alt="Voyager"
                          className="absolute left-1/2 top-[78px] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        />

                        {/* RANK */}
                        <span className="absolute left-1/2 top-[106px] -translate-x-1/2 bg-[#10294e] text-xs px-2 py-1 rounded-full border border-[#3d6799] text-cyan-100">
                          3
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 🔥 TOP USERS TABLE */}
            {/* 🔥 PREMIUM TOP USERS TABLE */}
            <div className="rounded-xl border border-gray-200 bg-[linear-gradient(135deg,#ecfdf5,#ffffff,#d1fae5)] border border-green-200 p-3">
              {/* HEADER */}
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">Top Users</p>

                <button className="inline-flex items-center justify-center text-sm px-3 h-7 rounded-md border  bg-blue-500 hover:bg-blue-700 text-white ">
                  Show all
                </button>
              </div>

              {/* TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  {/* HEADER */}
                  <thead>
                    <tr className="border-b border-[#1b2f4b] text-gray-800">
                      <th className="text-left p-2 w-14">Rank</th>
                      <th className="text-left p-2">User Name</th>
                      <th className="text-left p-2">24h Return</th>
                      <th className="text-right p-2">User Rating</th>
                    </tr>
                  </thead>

                  {/* BODY */}
                  {/* 
                  <tbody>
                    {[
                      {
                        rank: "#1",
                        name: "Hawk",
                        username: "@hawkfx",
                        return: "+124.5%",
                        rating: "68,950",
                        img: "/stock-broker-3d-icon-png-download-5625740.webp",
                      },
                      {
                        rank: "#2",
                        name: "ByteX",
                        username: "@bytex",
                        return: "+102.8%",
                        rating: "51,420",
                        img: "/trader-3d-icon-png-download-4403852.webp",
                      },
                      {
                        rank: "#3",
                        name: "Voyager",
                        username: "@voyager",
                        return: "+89.2%",
                        rating: "42,360",
                        img: "/crypto-trader-3d-icon-png-download-12328244.webp",
                      },
                    ].map((user, i) => (
                      <tr
                        key={i}
                        className="border-b border-[#1b2f4b] hover:bg-[#0d1d38] transition"
                      >
                        {/* RANK *}
                        <td className="p-2 font-semibold text-blue-500">
                          {user.rank}
                        </td>

                        {/* USER *}
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={user.img}
                              alt={user.name}
                              className="w-7 h-7 rounded-full"
                            />

                            <div>
                              <p className="text-sm font-medium text-blue-500">
                                {user.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {user.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* RETURN *}
                        <td className="p-2 text-blue-500 font-medium">
                          {user.return}
                        </td>

                        {/* RATING *}
                        <td className="p-2 text-right font-semibold text-blue-500">
                          {user.rating}
                        </td>
                      </tr>
                    ))}

                    {/* YOU ROW *}
                    <tr className="border-b border-[#1b2f4b] bg-[#12294a]">
                      <td className="p-2 font-semibold text-slate-100">#9</td>

                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#132948] flex items-center justify-center text-xs">
                            UA
                          </div>

                          <div>
                            <p className="text-sm font-medium text-cyan-300">
                              You
                            </p>
                            <p className="text-xs text-slate-400">@you</p>
                          </div>

                          <span className="text-xs bg-cyan-400/15 text-cyan-200 px-2 py-0.5 rounded border border-cyan-300/30">
                            You
                          </span>
                        </div>
                      </td>

                      <td className="p-2 text-emerald-400 font-medium">
                        +36.8%
                      </td>

                      <td className="p-2 text-right font-semibold text-slate-100">
                        17,920
                      </td>
                    </tr>
                  </tbody>
 */}

                  <tbody>
                    {leaderboard.slice(0, 10).map((user) => (
                      <tr
                        key={user.userId}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-2 font-semibold text-blue-500">
                          #{user.rank}
                        </td>

                        <td className="p-2">
                          <p className="text-sm font-medium text-blue-500">
                            {user.name}
                          </p>
                        </td>

                        <td
                          className={`p-2 font-medium ${
                            user.roi >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {user.roi >= 0 ? "+" : ""}
                          {user.roi.toFixed(2)}%
                        </td>

                        <td className="p-2 text-right font-semibold">
                          ${user.profitLoss.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* UPCOMING */}
        {tab === "upcoming" && (
          <div className="mt-6 space-y-6">
            {/* 🔥 COMPETITION LIST */}
            <div className="space-y-4">
              {/* CARD 1 */}
              <div className="space-y-4">
  {filteredCompetitions.map((comp) => (
    <div
      key={comp._id}
      onClick={() => setSelectedCompId(comp._id)}
      className="flex flex-col gap-6 rounded-xl border border-gray-200 shadow-sm py-6 bg-white"
    >
      <div className="px-6 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          {/* LEFT */}
          <div className="space-y-1">
            {/* 🔥 NAME */}
            <h3 className="font-semibold text-gray-800">
              {comp.competitionName}
            </h3>

            {/* 🔥 DESCRIPTION */}
            <p className="text-sm text-gray-400">
              {comp.description || "Trading competition"}
            </p>

            {/* 🔥 DETAILS */}
            <div className="flex items-center gap-4 pt-1">

              {/* 💰 PRIZE */}
              <div className="flex items-center gap-1 text-sm">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-black">
                  ${comp.totalPrizePool}
                </span>
              </div>

                            <div className="flex items-center gap-1 text-sm">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span className="text-gray-600">
                                Entry: ${comp.entryFee || 0}
                              </span>
                            </div>

              {/* 📅 START DATE */}
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">
                  Starts{" "}
                  {new Date(comp.startDate).toLocaleDateString()}
                </span>
              </div>


              <div className="flex items-center gap-1 text-sm">
                {/* <Clock className="h-4 w-4 text-gray-400" /> */}
                <span className="text-gray-400">
                  {/* {new Date(comp.startDate).toLocaleDateString()} */}
                  {comp.competitionStatus==="upcoming" 
                    ? getCountdown(comp.startDate)
                     : "-"}
                </span>
              </div>


            </div>
          </div>

          {/* RIGHT BUTTON */}
          <button
            onClick={() => openJoinDialog(comp._id)}
            disabled={joinedCompetitions.includes(comp._id)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              joinedCompetitions.includes(comp._id)
                ? "bg-blue-500 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-700 text-white"
            }`}
          >
            {joinedCompetitions.includes(comp._id)
              ? "Joined"
              : "Register Now"}
          </button>

        </div>
      </div>
    </div>
  ))}
</div>

            </div>


          {successDialogOpen && enrollmentData && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
              
              <div className="bg-white p-6 rounded-xl shadow-lg text-center w-[380px]">
                
                <h2 className="text-xl font-bold text-green-600 mb-4">
                  🎉 Congratulations!
                </h2>

                <p className="text-gray-700 mb-4">
                  You have successfully joined the competition.
                </p>

                {/* 🔥 USER DETAILS */}
                <div className="text-left text-sm space-y-2 bg-gray-50 p-4 rounded-lg">
                  
                  <p><strong>Name:</strong> {enrollmentData.name}</p>

                  <p><strong>Email:</strong> {enrollmentData.email}</p>

                  <p><strong>Account No:</strong> {enrollmentData.accountNumber || "************"}</p>

                  <p>
                    <strong>Start Date:</strong>{" "}
                    {new Date(enrollmentData.startDate).toLocaleDateString()}
                  </p>

                </div>

                <button
                  onClick={() => setSuccessDialogOpen(false)}
                  className="mt-5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
                >
                  OK
                </button>

              </div>
            </div>
          )}


{insufficientDialogOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
    
    <div className="bg-white p-6 rounded-xl shadow-lg text-center w-[360px]">
      
      <h2 className="text-xl font-bold text-red-600 mb-4">
        ❌ Insufficient Balance
      </h2>

      <p className="text-gray-700 mb-4">
        You don't have enough balance to join this competition.
      </p>

      <p className="text-sm text-gray-500">
        Please add funds to your wallet and try again.
      </p>

      <div className="flex gap-3 mt-5">
        
        {/* Close Button */}
        <button
          onClick={() => setInsufficientDialogOpen(false)}
          className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>

        {/* Add Funds Button */}
        <button
          onClick={() => {
            setInsufficientDialogOpen(false);
            navigate("/wallet"); // 🔥 change route if needed
          }}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Funds
        </button>

      </div>

    </div>
  </div>
)}
          

            {/* 🔥 LEADERBOARD HEADER */}
            {/* <div className="border border-gray-200 shadow-sm rounded-2xl p-5 bg-white">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h2 className="font-semibold">
                    Leaderboard - Rise to the Top
                  </h2>
                  <p className="text-xs text-gray-400">
                    Live points ranking with podium highlights
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button className="text-xs bg-blue-500/20 px-3 py-1 rounded-lg">
                    Current Leaderboard
                  </button>
                  <button className="text-xs bg-white/10 px-3 py-1 rounded-lg">
                    IB Leaderboard
                  </button>
                  <button className="text-xs bg-white/10 px-3 py-1 rounded-lg">
                    Live Points
                  </button>
                  <button className="text-xs bg-white/10 px-3 py-1 rounded-lg">
                    $10,000 Pool
                  </button>
                </div>
              </div>
            </div> */}

            {/* 🔥 PODIUM */}
            {/* <div className="border border-gray-200 shadow-sm rounded-2xl p-5 bg-white">
              <p className="text-xs text-gray-400 mb-4">ELITE PODIUM</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         
                <div className="group relative min-h-[300px] overflow-hidden rounded-2xl border px-4 pb-6 pt-5 text-center transition-all duration-500 bg-[linear-gradient(135deg,#ecfdf5,#ffffff,#d1fae5)] border border-green-200 border-[#29466c]">
            
                  <div className="absolute bottom-8 left-1/2 h-[106px] w-[88%] -translate-x-1/2 rounded-t-xl border border-[#2f4c70] bg-[linear-gradient(180deg,rgba(24,52,92,0.7),rgba(10,23,44,0.95))]">
                    <div className="flex h-full flex-col items-center justify-start px-3 pt-5">
                      <p className="text-sm font-semibold text-slate-100">
                        ByteX
                      </p>

                      <div className="mt-3 rounded-md border border-[#345a87] bg-[linear-gradient(180deg,rgba(19,42,75,0.98),rgba(9,24,46,0.98))] px-2 py-1 text-[12px] font-semibold text-amber-200 shadow-[0_8px_22px_rgba(4,10,24,0.55)]">
                        <span className="inline-flex items-center gap-1">
                          💰 5k season reward
                        </span>
                      </div>
                    </div>
                  </div>

                 
                  <div className="relative z-10 flex justify-center">
                    <div className="relative h-[168px] w-[276px]">
                    
                      <span className="absolute left-[28px] top-[45px] h-[44px] w-[100px] -skew-x-[34deg] border bg-gradient-to-b from-[#cfd5e8] to-[#8893b8] border-[#d9def0]" />
                      <span className="absolute left-[50px] top-[66px] h-[28px] w-[68px] -skew-x-[20deg] border bg-gradient-to-b from-[#e5e9f7] to-[#9aa5ca] border-[#e9edfb]" />

                      <span className="absolute right-[28px] top-[45px] h-[44px] w-[100px] skew-x-[34deg] border bg-gradient-to-b from-[#cfd5e8] to-[#8893b8] border-[#d9def0]" />

                     
                      <span
                        className="absolute left-1/2 top-[31px] h-[94px] w-[112px] -translate-x-1/2 border bg-gradient-to-b from-[#d7dced] via-[#a6b0cf] to-[#7e87a8] border-[#dde3f6]"
                        style={{
                          clipPath:
                            "polygon(50% 0,87% 16%,92% 45%,73% 84%,50% 100%,27% 84%,8% 45%,13% 16%)",
                        }}
                      />

                     
                      <img
                        src="/trader-3d-icon-png-download-4403852.webp"
                        alt="ByteX"
                        className="absolute left-1/2 top-[78px] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      />

                     
                      <span className="absolute left-1/2 top-[106px] inline-flex h-6 min-w-6 -translate-x-1/2 items-center justify-center rounded-full border border-[#3d6799] bg-[#10294e] px-1 text-[10px] font-semibold text-cyan-100">
                        2
                      </span>
                    </div>
                  </div>
                </div>

                
                <div className="group relative min-h-[300px] overflow-hidden rounded-2xl border px-4 pb-6 pt-5 text-center transition-all duration-500 bg-[linear-gradient(135deg,#ecfdf5,#ffffff,#d1fae5)] border border-green-200 border-cyan-300/70 md:scale-105 shadow-[0_0_36px_rgba(34,211,238,0.18)]">
                  
                  <div className="absolute bottom-8 left-1/2 h-[106px] w-[88%] -translate-x-1/2 rounded-t-xl border border-[#2f4c70] bg-[linear-gradient(180deg,rgba(24,52,92,0.7),rgba(10,23,44,0.95))]">
                    <div className="flex h-full flex-col items-center justify-start px-3 pt-5">
                      <p className="text-sm font-semibold text-slate-100">
                        Hawk
                      </p>

                      <div className="mt-3 rounded-md border border-[#345a87] bg-[linear-gradient(180deg,rgba(19,42,75,0.98),rgba(9,24,46,0.98))] px-2 py-1 text-[12px] font-semibold text-amber-200 shadow-[0_8px_22px_rgba(4,10,24,0.55)]">
                        <span className="inline-flex items-center gap-1">
                          💰 10k season reward
                        </span>
                      </div>
                    </div>
                  </div>

                  
                  <div className="relative z-10 flex justify-center mt-2">
                    <div className="relative h-[168px] w-[276px] scale-105">
                      
                      <span className="absolute left-[28px] top-[45px] h-[44px] w-[100px] -skew-x-[34deg] border bg-gradient-to-b from-[#ffd73f] to-[#e99a10] border-[#ffdd63]"></span>
                      <span className="absolute left-[50px] top-[66px] h-[28px] w-[68px] -skew-x-[20deg] border bg-gradient-to-b from-[#ffe05b] to-[#f6ae12] border-[#ffd66a]"></span>

                      <span className="absolute right-[28px] top-[45px] h-[44px] w-[100px] skew-x-[34deg] border bg-gradient-to-b from-[#ffd73f] to-[#e99a10] border-[#ffdd63]"></span>
                      <span className="absolute right-[50px] top-[66px] h-[28px] w-[68px] skew-x-[20deg] border bg-gradient-to-b from-[#ffe05b] to-[#f6ae12] border-[#ffd66a]"></span>

                      
                      <span className="absolute left-1/2 top-[31px] h-[94px] w-[112px] -translate-x-1/2 border bg-gradient-to-b from-[#ffcf38] via-[#f3a018] to-[#da790f] border-[#ffd86e] [clip-path:polygon(50%_0,87%_16%,92%_45%,73%_84%,50%_100%,27%_84%,8%_45%,13%_16%)]"></span>

                      
                      <img
                        src="/stock-broker-3d-icon-png-download-5625740.webp"
                        alt="Hawk"
                        className="absolute left-1/2 top-[78px] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      />

                     
                      <span className="absolute left-1/2 top-[106px] -translate-x-1/2 rounded-full border border-[#3d6799] bg-[#10294e] px-2 py-1 text-xs">
                        1
                      </span>
                    </div>
                  </div>
                </div>

                
                <div className="group relative min-h-[300px] overflow-hidden rounded-2xl border px-4 pb-6 pt-5 text-center transition-all duration-500 bg-[linear-gradient(135deg,#ecfdf5,#ffffff,#d1fae5)] border border-green-200 border-[#29466c]">
                 
                  <div className="absolute bottom-8 left-1/2 h-[106px] w-[88%] -translate-x-1/2 rounded-t-xl border border-[#2f4c70] bg-[linear-gradient(180deg,rgba(24,52,92,0.7),rgba(10,23,44,0.95))]">
                    <div className="flex h-full flex-col items-center justify-start px-3 pt-5">
                      <p className="text-sm font-semibold text-slate-100">
                        Voyager
                      </p>

                      <div className="mt-3 rounded-md border border-[#345a87] bg-[linear-gradient(180deg,rgba(19,42,75,0.98),rgba(9,24,46,0.98))] px-2 py-1 text-[12px] font-semibold text-amber-200 shadow-[0_8px_22px_rgba(4,10,24,0.55)]">
                        <span className="inline-flex items-center gap-1">
                          🪙 2.5k season reward
                        </span>
                      </div>
                    </div>
                  </div>

                 
                  <div className="relative z-10">
                    <div className="flex items-center justify-center">
                      <div className="relative h-[168px] w-[276px]">
                       
                        <span className="absolute left-[28px] top-[45px] h-[44px] w-[100px] -skew-x-[34deg] border bg-gradient-to-b from-[#be5f2e] to-[#6b2f13] border-[#d0885e]" />
                        <span className="absolute left-[50px] top-[66px] h-[28px] w-[68px] -skew-x-[20deg] border bg-gradient-to-b from-[#d57b4b] to-[#8a3c1a] border-[#df9066]" />

                       
                        <span className="absolute right-[28px] top-[45px] h-[44px] w-[100px] skew-x-[34deg] border bg-gradient-to-b from-[#be5f2e] to-[#6b2f13] border-[#d0885e]" />

                     
                        <span
                          className="absolute left-1/2 top-[31px] h-[94px] w-[112px] -translate-x-1/2 border bg-gradient-to-b from-[#c76637] via-[#9a4824] to-[#6e3218] border-[#d88f68]"
                          style={{
                            clipPath:
                              "polygon(50% 0,87% 16%,92% 45%,73% 84%,50% 100%,27% 84%,8% 45%,13% 16%)",
                          }}
                        />

                       
                        <img
                          src="/crypto-trader-3d-icon-png-download-12328244.webp"
                          alt="Voyager"
                          className="absolute left-1/2 top-[78px] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        />

                       
                        <span className="absolute left-1/2 top-[106px] -translate-x-1/2 bg-[#10294e] text-xs px-2 py-1 rounded-full border border-[#3d6799]">
                          3
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}

           
            {/* <div className="rounded-xl border border-gray-200 bg-[linear-gradient(135deg,#ecfdf5,#ffffff,#d1fae5)] border border-green-200 p-3">
             
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold  text-gray-800">
                  Top Users
                </p>

                <button className="inline-flex items-center justify-center text-sm px-3 h-7 rounded-md border    text-white bg-blue-600 hover:bg-blue-700  ">
                  Show all
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                 
                  <thead>
                    <tr className="border-b border-[#1b2f4b] text-gray-800">
                      <th className="text-left p-2 w-14">Rank</th>
                      <th className="text-left p-2">User Name</th>
                      <th className="text-left p-2">24h Return</th>
                      <th className="text-right p-2">User Rating</th>
                    </tr>
                  </thead>

                  
                  <tbody>
                    {[
                      {
                        rank: "#1",
                        name: "Hawk",
                        username: "@hawkfx",
                        return: "+124.5%",
                        rating: "68,950",
                        img: "/stock-broker-3d-icon-png-download-5625740.webp",
                      },
                      {
                        rank: "#2",
                        name: "ByteX",
                        username: "@bytex",
                        return: "+102.8%",
                        rating: "51,420",
                        img: "/trader-3d-icon-png-download-4403852.webp",
                      },
                      {
                        rank: "#3",
                        name: "Voyager",
                        username: "@voyager",
                        return: "+89.2%",
                        rating: "42,360",
                        img: "/crypto-trader-3d-icon-png-download-12328244.webp",
                      },
                    ].map((user, i) => (
                      <tr
                        key={i}
                        className="border-b border-[#1b2f4b] hover:bg-[#0d1d38] transition"
                      >
                       
                        <td className="p-2 font-semibold text-blue-500">
                          {user.rank}
                        </td>

                       
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={user.img}
                              alt={user.name}
                              className="w-7 h-7 rounded-full"
                            />

                            <div>
                              <p className="text-sm font-medium text-blue-500">
                                {user.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {user.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        
                        <td className="p-2 text-blue-500 font-medium">
                          {user.return}
                        </td>

                        
                        <td className="p-2 text-right font-semibold text-blue-500">
                          {user.rating}
                        </td>
                      </tr>
                    ))}

                   
                    <tr className="border-b border-[#1b2f4b] bg-[#12294a]">
                      <td className="p-2 font-semibold text-slate-100">#9</td>

                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#132948] flex items-center justify-center text-xs">
                            UA
                          </div>

                          <div>
                            <p className="text-sm font-medium text-cyan-300">
                              You
                            </p>
                            <p className="text-xs text-slate-400">@you</p>
                          </div>

                          <span className="text-xs bg-cyan-400/15 text-cyan-200 px-2 py-0.5 rounded border border-cyan-300/30">
                            You
                          </span>
                        </div>
                      </td>

                      <td className="p-2 text-emerald-400 font-medium">
                        +36.8%
                      </td>

                      <td className="p-2 text-right font-semibold text-slate-100">
                        17,920
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div> */}
          </div>
        )}

        {/* PAST */}
        
        {tab === "past" && (
          <div className="mt-6 space-y-6">
            {/* 🔥 COMPETITION LIST */}
            {/* <div className="space-y-4">
              

              
            </div> */}

            {/* 🔥 LEADERBOARD HEADER */}
            {/* <div className="border border-gray-200 shadow-sm  rounded-2xl p-5 bg-white">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h2 className="font-semibold">
                    Leaderboard - Rise to the Top
                  </h2>
                  <p className="text-xs text-gray-400">
                    Live points ranking with podium highlights
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button className="text-xs bg-blue-500/20 px-3 py-1 rounded-lg">
                    Current Leaderboard
                  </button>
                  <button className="text-xs bg-white/10 px-3 py-1 rounded-lg">
                    IB Leaderboard
                  </button>
                  <button className="text-xs bg-white/10 px-3 py-1 rounded-lg">
                    Live Points
                  </button>
                  <button className="text-xs bg-white/10 px-3 py-1 rounded-lg">
                    $10,000 Pool
                  </button>
                </div>
              </div>
            </div> */}

            {/* 🔥 PODIUM */}
            {/* <div className="border  shadow-sm  rounded-2xl p-5 bg-white border-gray-200">
              <p className="text-xs text-gray-400 mb-4">ELITE PODIUM</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               
                <div className="group relative min-h-[300px] overflow-hidden rounded-2xl border px-4 pb-6 pt-5 text-center transition-all duration-500 bg-[linear-gradient(135deg,#ecfdf5,#ffffff,#d1fae5)] border border-green-200 border-[#29466c]">
                  
                  <div className="absolute bottom-8 left-1/2 h-[106px] w-[88%] -translate-x-1/2 rounded-t-xl border border-[#2f4c70] bg-[linear-gradient(180deg,rgba(24,52,92,0.7),rgba(10,23,44,0.95))]">
                    <div className="flex h-full flex-col items-center justify-start px-3 pt-5">
                      <p className="text-sm font-semibold text-slate-100">
                        ByteX
                      </p>

                      <div className="mt-3 rounded-md border border-[#345a87] bg-[linear-gradient(180deg,rgba(19,42,75,0.98),rgba(9,24,46,0.98))] px-2 py-1 text-[12px] font-semibold text-amber-200 shadow-[0_8px_22px_rgba(4,10,24,0.55)]">
                        <span className="inline-flex items-center gap-1">
                          💰 5k season reward
                        </span>
                      </div>
                    </div>
                  </div>

                  
                  <div className="relative z-10 flex justify-center">
                    <div className="relative h-[168px] w-[276px]">
                      
                      <span className="absolute left-[28px] top-[45px] h-[44px] w-[100px] -skew-x-[34deg] border bg-gradient-to-b from-[#cfd5e8] to-[#8893b8] border-[#d9def0]" />
                      <span className="absolute left-[50px] top-[66px] h-[28px] w-[68px] -skew-x-[20deg] border bg-gradient-to-b from-[#e5e9f7] to-[#9aa5ca] border-[#e9edfb]" />

                      
                      <span className="absolute right-[28px] top-[45px] h-[44px] w-[100px] skew-x-[34deg] border bg-gradient-to-b from-[#cfd5e8] to-[#8893b8] border-[#d9def0]" />

                      
                      <span
                        className="absolute left-1/2 top-[31px] h-[94px] w-[112px] -translate-x-1/2 border bg-gradient-to-b from-[#d7dced] via-[#a6b0cf] to-[#7e87a8] border-[#dde3f6]"
                        style={{
                          clipPath:
                            "polygon(50% 0,87% 16%,92% 45%,73% 84%,50% 100%,27% 84%,8% 45%,13% 16%)",
                        }}
                      />

                      
                      <img
                        src="/icon2.png"
                        alt="ByteX"
                        className="absolute left-1/2 top-[78px] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      />

                     
                      <span className="absolute left-1/2 top-[106px] inline-flex h-6 min-w-6 -translate-x-1/2 items-center justify-center rounded-full border border-[#3d6799] bg-[#10294e] px-1 text-[10px] font-semibold text-cyan-100">
                        2
                      </span>
                    </div>
                  </div>
                </div>

                
                <div className="group relative min-h-[300px] overflow-hidden rounded-2xl border px-4 pb-6 pt-5 text-center transition-all duration-500 bg-[linear-gradient(135deg,#ecfdf5,#ffffff,#d1fae5)] border border-green-200 border-cyan-300/70 md:scale-105 shadow-[0_0_36px_rgba(34,211,238,0.18)]">
                  
                  <div className="absolute bottom-8 left-1/2 h-[106px] w-[88%] -translate-x-1/2 rounded-t-xl border border-[#2f4c70] bg-[linear-gradient(180deg,rgba(24,52,92,0.7),rgba(10,23,44,0.95))]">
                    <div className="flex h-full flex-col items-center justify-start px-3 pt-5">
                      <p className="text-sm font-semibold text-slate-100">
                        Hawk
                      </p>

                      <div className="mt-3 rounded-md border border-[#345a87] bg-[linear-gradient(180deg,rgba(19,42,75,0.98),rgba(9,24,46,0.98))] px-2 py-1 text-[12px] font-semibold text-amber-200 shadow-[0_8px_22px_rgba(4,10,24,0.55)]">
                        <span className="inline-flex items-center gap-1">
                          💰 10k season reward
                        </span>
                      </div>
                    </div>
                  </div>

                  
                  <div className="relative z-10 flex justify-center mt-2">
                    <div className="relative h-[168px] w-[276px] scale-105">
                      
                      <span className="absolute left-[28px] top-[45px] h-[44px] w-[100px] -skew-x-[34deg] border bg-gradient-to-b from-[#ffd73f] to-[#e99a10] border-[#ffdd63]"></span>
                      <span className="absolute left-[50px] top-[66px] h-[28px] w-[68px] -skew-x-[20deg] border bg-gradient-to-b from-[#ffe05b] to-[#f6ae12] border-[#ffd66a]"></span>

                      <span className="absolute right-[28px] top-[45px] h-[44px] w-[100px] skew-x-[34deg] border bg-gradient-to-b from-[#ffd73f] to-[#e99a10] border-[#ffdd63]"></span>
                      <span className="absolute right-[50px] top-[66px] h-[28px] w-[68px] skew-x-[20deg] border bg-gradient-to-b from-[#ffe05b] to-[#f6ae12] border-[#ffd66a]"></span>

                      
                      <span className="absolute left-1/2 top-[31px] h-[94px] w-[112px] -translate-x-1/2 border bg-gradient-to-b from-[#ffcf38] via-[#f3a018] to-[#da790f] border-[#ffd86e] [clip-path:polygon(50%_0,87%_16%,92%_45%,73%_84%,50%_100%,27%_84%,8%_45%,13%_16%)]"></span>

                      
                      <img
                        src="/icon1.png"
                        alt="Hawk"
                        className="absolute left-1/2 top-[78px] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      />

                     
                      <span className="absolute left-1/2 top-[106px] -translate-x-1/2 rounded-full border border-[#3d6799] bg-[#10294e] px-2 py-1 text-xs">
                        1
                      </span>
                    </div>
                  </div>
                </div>

                
                <div className="group relative min-h-[300px] overflow-hidden rounded-2xl border px-4 pb-6 pt-5 text-center transition-all duration-500 bg-[linear-gradient(135deg,#ecfdf5,#ffffff,#d1fae5)] border border-green-200 border-[#29466c]">
                  
                  <div className="absolute bottom-8 left-1/2 h-[106px] w-[88%] -translate-x-1/2 rounded-t-xl border border-[#2f4c70] bg-[linear-gradient(180deg,rgba(24,52,92,0.7),rgba(10,23,44,0.95))]">
                    <div className="flex h-full flex-col items-center justify-start px-3 pt-5">
                      <p className="text-sm font-semibold text-slate-100">
                        Voyager
                      </p>

                      <div className="mt-3 rounded-md border border-[#345a87] bg-[linear-gradient(180deg,rgba(19,42,75,0.98),rgba(9,24,46,0.98))] px-2 py-1 text-[12px] font-semibold text-amber-200 shadow-[0_8px_22px_rgba(4,10,24,0.55)]">
                        <span className="inline-flex items-center gap-1">
                          🪙 2.5k season reward
                        </span>
                      </div>
                    </div>
                  </div>

                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center">
                      <div className="relative h-[168px] w-[276px]">
                       
                        <span className="absolute left-[28px] top-[45px] h-[44px] w-[100px] -skew-x-[34deg] border bg-gradient-to-b from-[#be5f2e] to-[#6b2f13] border-[#d0885e]" />
                        <span className="absolute left-[50px] top-[66px] h-[28px] w-[68px] -skew-x-[20deg] border bg-gradient-to-b from-[#d57b4b] to-[#8a3c1a] border-[#df9066]" />

                       
                        <span className="absolute right-[28px] top-[45px] h-[44px] w-[100px] skew-x-[34deg] border bg-gradient-to-b from-[#be5f2e] to-[#6b2f13] border-[#d0885e]" />

                        
                        <span
                          className="absolute left-1/2 top-[31px] h-[94px] w-[112px] -translate-x-1/2 border bg-gradient-to-b from-[#c76637] via-[#9a4824] to-[#6e3218] border-[#d88f68]"
                          style={{
                            clipPath:
                              "polygon(50% 0,87% 16%,92% 45%,73% 84%,50% 100%,27% 84%,8% 45%,13% 16%)",
                          }}
                        />

                       
                        <img
                          src="/icon3.png"
                          alt="Voyager"
                          className="absolute left-1/2 top-[78px] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        />

                        
                        <span className="absolute left-1/2 top-[106px] -translate-x-1/2 bg-[#10294e] text-xs px-2 py-1 rounded-full border border-[#3d6799]">
                          3
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}

            {/* 🔥 TOP USERS TABLE */}
            {/* 🔥 PREMIUM TOP USERS TABLE */}
            {/* <div className="rounded-xl border border-gray-200 bg-[linear-gradient(135deg,#ecfdf5,#ffffff,#d1fae5)] p-3">

              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">
                  Top Users
                </p>

                <button className="inline-flex items-center justify-center text-sm px-3 h-7 rounded-md border    text-white bg-blue-600 hover:bg-blue-700  ">
                  Show all
                </button>
              </div>

              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  
                  <thead>
                    <tr className="border-b border-[#1b2f4b] text-gray-800">
                      <th className="text-left p-2 w-14">Rank</th>
                      <th className="text-left p-2">User Name</th>
                      <th className="text-left p-2">24h Return</th>
                      <th className="text-right p-2">User Rating</th>
                    </tr>
                  </thead>

                 
                  <tbody>
                    {[
                      {
                        rank: "#1",
                        name: "Hawk",
                        username: "@hawkfx",
                        return: "+124.5%",
                        rating: "68,950",
                        img: "/stock-broker-3d-icon-png-download-5625740.webp",
                      },
                      {
                        rank: "#2",
                        name: "ByteX",
                        username: "@bytex",
                        return: "+102.8%",
                        rating: "51,420",
                        img: "/trader-3d-icon-png-download-4403852.webp",
                      },
                      {
                        rank: "#3",
                        name: "Voyager",
                        username: "@voyager",
                        return: "+89.2%",
                        rating: "42,360",
                        img: "/crypto-trader-3d-icon-png-download-12328244.webp",
                      },
                    ].map((user, i) => (
                      <tr
                        key={i}
                        className="border-b border-[#1b2f4b] hover:bg-[#0d1d38] transition"
                      >
                        
                        <td className="p-2 font-semibold text-blue-500">
                          {user.rank}
                        </td>

                       
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={user.img}
                              alt={user.name}
                              className="w-7 h-7 rounded-full"
                            />

                            <div>
                              <p className="text-sm font-medium text-blue-500">
                                {user.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {user.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        
                        <td className="p-2 text-blue-500 font-medium">
                          {user.return}
                        </td>

                        
                        <td className="p-2 text-right font-semibold text-blue-500">
                          {user.rating}
                        </td>
                      </tr>
                    ))}

                    
                    <tr className="border-b border-[#1b2f4b] bg-[#12294a]">
                      <td className="p-2 font-semibold text-slate-100">#9</td>

                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#132948] flex items-center justify-center text-xs">
                            UA
                          </div>

                          <div>
                            <p className="text-sm font-medium text-cyan-300">
                              You
                            </p>
                            <p className="text-xs text-slate-400">@you</p>
                          </div>

                          <span className="text-xs bg-cyan-400/15 text-cyan-200 px-2 py-0.5 rounded border border-cyan-300/30">
                            You
                          </span>
                        </div>
                      </td>

                      <td className="p-2 text-emerald-400 font-medium">
                        +36.8%
                      </td>

                      <td className="p-2 text-right font-semibold text-slate-100">
                        17,920
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div> */}
          </div>
        )}
      </div>

{/* 🔥 RULES DIALOG */}
{openRules && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    
    <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-lg">
      
      {/* TITLE */}
      <h2 className="text-xl font-bold text-center mb-4">
        Trading Competition Rules
      </h2>

      <hr />

      {/* CONTENT */}
      <div className="mt-4 max-h-[400px] overflow-y-auto grid md:grid-cols-2 gap-6">
        
        {/* LEFT */}
        <div className="bg-gray-50 border rounded-xl p-4">
          <h3 className="font-semibold mb-3 text-lg">Competition Rules</h3>

          <ul className="text-sm text-gray-600 space-y-1">
            {[
              "Participants must have a registered account",
              "Only one competition account per user",
              "All traders start with same balance",
              "Ranking based on highest ROI",
              "Minimum number of trades required",
              "Drawdown limits apply",
              "Leaderboard updates automatically",
              "KYC required for winners",
              "Organizer may update rules anytime"
            ].map((rule, i) => (
              <li key={i}>• {rule}</li>
            ))}
          </ul>
        </div>

        {/* RIGHT */}
        <div className="bg-gray-50 border rounded-xl p-4">
          <h3 className="font-semibold mb-3 text-lg text-red-500">
            Anti-Cheating Rules
          </h3>

          <ul className="text-sm text-gray-600 space-y-1">
            {[
              "Arbitrage trading not allowed",
              "Multiple accounts forbidden",
              "Copy trading not allowed",
              "Collusion prohibited",
              "Bug exploitation = disqualification",
              "Suspicious activity may remove user"
            ].map((rule, i) => (
              <li key={i}>• {rule}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* TERMS */}
      <div className="mt-4 bg-blue-50 p-3 rounded-lg">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
          />
          I agree to the competition terms and regulations
        </label>
      </div>

      {/* BUTTONS */}
      <div className="flex justify-end gap-3 mt-5">
        <button
          onClick={() => setOpenRules(false)}
          className="px-4 py-2 border rounded-md"
        >
          Cancel
        </button>

        <button
          disabled={!agreeTerms || loading}
          onClick={confirmJoinCompetition}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {loading ? "Joining..." : "Join Competition"}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}


