import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import AdminLayout from "../components/AdminLayout";
import { API_URL } from "../config/api.js";

const AdminCompetitionDetails = () => {

  const { id } = useParams();

  const [competition, setCompetition] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    fetchCompetitionDetails();
  }, [id]);

  const fetchCompetitionDetails = async () => {
    try {

      const res = await axios.get(`${API_URL}/competitions/${id}`);
      const data = res.data?.data;

      setCompetition(data);

      if (Array.isArray(data?.participants)) {
        setParticipants(data.participants);
      } else {
        setParticipants([]);
      }

    } catch (error) {
      console.error("Error loading competition:", error);
    }
  };

  if (!competition) {
    return (
      <AdminLayout title="Competition Details">
        <div style={{ padding: "40px", textAlign: "center" }}>
          Loading Competition...
        </div>
      </AdminLayout>
    );
  }

  const sortedParticipants = [...participants].sort(
    (a, b) => (b.roi || 0) - (a.roi || 0)
  );

  return (
    <AdminLayout
      title="Competition Details"
      subtitle="Competition Leaderboard"
    >
      <div style={{ padding: "30px" }}>

        {/* Competition Info */}
        <div style={competitionBox}>
          <h2 style={{ marginBottom: "20px" }}>
            {competition.competitionName}
          </h2>

          <div style={infoGrid}>
            <InfoCard label="Entry Fee" value={competition.entryFee} />
            <InfoCard label="Prize Pool" value={competition.totalPrizePool} />
            <InfoCard label="Status" value={competition.competitionStatus} />
            <InfoCard label="Start Date" value={competition.startDate?.slice(0,10)} />
            <InfoCard label="End Date" value={competition.endDate?.slice(0,10)}/>
            <InfoCard label="Participants" value={participants.length} />
          </div>
        </div>

        {/* Leaderboard */}
        <div style={tableContainer}>

          <h3 style={{ marginBottom: "20px" }}>Participants Leaderboard</h3>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>

              <thead>
                <tr style={{ background: "#f5f6fa" }}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Trader Name</th>
                  <th style={thStyle}>Equity</th>
                  <th style={thStyle}>ROI (%)</th>
                  <th style={thStyle}>PNL ($)</th>
                  <th style={thStyle}>Trades Taken</th>
                </tr>
              </thead>

              <tbody>

                {sortedParticipants.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={emptyStyle}>
                      No participants joined this competition yet
                    </td>
                  </tr>
                ) : (

                  sortedParticipants.map((user, index) => {

                    const roi = user.roi || 0;
                    const pnl = user.pnl || 0;

                    return (

                      <tr key={user._id || index} style={rowStyle}>

                        <td style={tdStyle}>
                          {user._id}
                        </td>

                        <td style={tdStyle}>
                          {user.name || "Unknown"}
                        </td>

                        <td style={tdStyle}>
                          ${user.equity ? user.equity.toFixed(2) : "0.00"}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color: roi >= 0 ? "#2ecc71" : "#e74c3c",
                            fontWeight: "600"
                          }}
                        >
                          {roi.toFixed(2)}%
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color: pnl >= 0 ? "#2ecc71" : "#e74c3c",
                            fontWeight: "600"
                          }}
                        >
                          ${pnl.toFixed(2)}
                        </td>

                        <td style={tdStyle}>
                          {user.totalTrades || 0}
                        </td>

                      </tr>

                    );

                  })

                )}

              </tbody>

            </table>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminCompetitionDetails;


/* ---------- Components ---------- */

const InfoCard = ({ label, value }) => (
  <div style={cardStyle}>
    <span style={labelStyle}>{label}</span>
    <span style={valueStyle}>{value || "-"}</span>
  </div>
);


/* ---------- Styles ---------- */

const competitionBox = {
  background: "#fff",
  padding: "30px",
  borderRadius: "10px",
  marginBottom: "25px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
};

const infoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
  gap: "20px"
};

const cardStyle = {
  background: "#f9fafc",
  padding: "15px",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  border: "1px solid #eee"
};

const labelStyle = {
  fontSize: "13px",
  color: "#888",
  marginBottom: "5px"
};

const valueStyle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#222"
};

const tableContainer = {
  background: "#fff",
  padding: "25px",
  borderRadius: "10px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse"
};

const thStyle = {
  padding: "12px",
  textAlign: "left",
  fontSize: "13px",
  color: "#555",
  borderBottom: "1px solid #ddd"
};

const tdStyle = {
  padding: "12px",
  fontSize: "14px",
  color: "#333",
  borderBottom: "1px solid #eee"
};

const rowStyle = {
  transition: "background 0.2s"
};

const emptyStyle = {
  padding: "20px",
  textAlign: "center",
  color: "#888"
};