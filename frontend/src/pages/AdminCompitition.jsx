import React, { useState, useEffect } from 'react';
import AdminCreateCompitition from './AdminCreateCompitition';
import AdminLayout from '../components/AdminLayout';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {API_URL} from "../config/api.js";
import { useTheme } from '../context/ThemeContext';

const AdminCompetition = () => {

  const navigate = useNavigate();
  const { modeColors } = useTheme();

  const [activeTab, setActiveTab] = useState('ongoing');
  const [open,setOpen] = useState(false);

  const [competitions, setCompetitions] = useState({
    ongoing: [],
    upcoming: [],
    completed: []
  });

  useEffect(() => {

    fetchCompetitions();

  }, []);

  const fetchCompetitions = async () => {

    try {

      const res = await axios.get(
        `${API_URL}/competitions/getall`
      );

      const data = res.data.data;

      const grouped = {
        ongoing: [],
        upcoming: [],
        completed: []
      };

      data.forEach(comp => {

        const formatted = {
          id: comp._id,
          name: comp.competitionName,
          entryFee: comp.entryFee || "Free",
          prizePool: comp.totalPrizePool,
          participants: Array.isArray(comp.participants)
            ? comp.participants.length
            : (comp.participants || 0),
          startDate: comp.startDate?.slice(0,10),
          endDate: comp.endDate?.slice(0,10),
          raw: comp
        };

        if (comp.competitionStatus === "live") {
          grouped.ongoing.push(formatted);
        }

        if (comp.competitionStatus === "upcoming") {
          grouped.upcoming.push(formatted);
        }

        if (comp.competitionStatus === "completed") {
          grouped.completed.push(formatted);
        }

      });

      setCompetitions(grouped);

    } catch (error) {

      console.error("Error fetching competitions", error);

    }

  };

  const handleView = (competition) => {

//     alert(
//       `Competition: ${competition.name}
// Start Date: ${competition.startDate}
// End Date: ${competition.endDate}
// Prize Pool: ${competition.prizePool}`
//     );
  navigate(`/admin/competition-details/${competition.id}`);

  };

  const handleEdit = (competition) => {

    console.log("Edit competition:", competition);

    setOpen(true);

  };

  const handleDelete = async (competition) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this competition?"
    );

    if (!confirmDelete) return;

    try {

      await axios.delete(
        `${API_URL}/competitions/delete/${competition.id}`
      );

      fetchCompetitions();
      alert("Competition deleted");

    } catch (error) {

      console.error("Delete failed", error);

    }

  };

  const tabs = [
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' }
  ];

  return (
    <AdminLayout title="Trading Competitions" subtitle="Manage and create trading competitions for your users">
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: modeColors.bgSecondary, minHeight: '80vh' }}>
      <div style={{ backgroundColor: modeColors.bgCard, borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, color: modeColors.textPrimary, fontSize: '24px' }}>Trading Competitions</h1>
          <button
            style={{
              backgroundColor: modeColors.adminSuccess,
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            onClick={()=>setOpen(true)}
          >
            Create Competition
          </button>
        </div>

        <AdminCreateCompitition open={open} onClose={() => setOpen(false)} />   

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `2px solid ${modeColors.border}`, marginBottom: '20px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                color: activeTab === tab.id ? modeColors.adminSuccess : modeColors.textSecondary,
                borderBottom: activeTab === tab.id ? `2px solid ${modeColors.adminSuccess}` : 'none',
                marginBottom: '-2px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: modeColors.bgHover }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${modeColors.border}`, color: modeColors.textSecondary, fontSize: '12px', fontWeight: 'bold' }}>Competition Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${modeColors.border}`, color: modeColors.textSecondary, fontSize: '12px', fontWeight: 'bold' }}>Entry Fee</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${modeColors.border}`, color: modeColors.textSecondary, fontSize: '12px', fontWeight: 'bold' }}>Prize Pool</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${modeColors.border}`, color: modeColors.textSecondary, fontSize: '12px', fontWeight: 'bold' }}>Participants</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${modeColors.border}`, color: modeColors.textSecondary, fontSize: '12px', fontWeight: 'bold' }}>Start Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${modeColors.border}`, color: modeColors.textSecondary, fontSize: '12px', fontWeight: 'bold' }}>End Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${modeColors.border}`, color: modeColors.textSecondary, fontSize: '12px', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>

            <tbody>

              {competitions[activeTab].map((competition, index) => (
                <tr key={index} style={{ borderBottom: `1px solid ${modeColors.border}` }}>
                  <td style={{ padding: '12px', color: modeColors.textPrimary }}>{competition.name}</td>
                  <td style={{ padding: '12px', color: modeColors.textPrimary }}>{competition.entryFee}</td>
                  <td style={{ padding: '12px', color: modeColors.textPrimary, fontWeight: 'bold' }}>{competition.prizePool}</td>
                  <td style={{ padding: '12px', color: modeColors.textPrimary }}>{competition.participants}</td>
                  <td style={{ padding: '12px', color: modeColors.textPrimary }}>{competition.startDate}</td>
                  <td style={{ padding: '12px', color: modeColors.textPrimary }}>{competition.endDate}</td>

                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => handleView(competition)}
                      style={{
                        backgroundColor: modeColors.adminInfo,
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: '5px'
                      }}
                    >
                      View
                    </button>

                    <button
                      onClick={() => handleEdit(competition)}
                      style={{
                        backgroundColor: modeColors.adminWarning,
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: '5px'
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(competition)}
                      style={{
                        backgroundColor: modeColors.adminError,
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              ))}

            </tbody>
          </table>
        </div>

      </div>
    </div>
    </AdminLayout>
  );
};

export default AdminCompetition;