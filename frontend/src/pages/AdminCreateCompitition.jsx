import React, { useState } from 'react';
import { Dialog, DialogContent } from "@mui/material";
import axios from "axios";

const AdminCreateCompitition = ({ open, onClose }) => {

  const [formData, setFormData] = useState({
    competitionName: '',
    description: '',
    competitionType: 'trading',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    maxParticipants: '',
    entryFee: '',
    totalPrizePool: '',
    tradingPlatform: 'MT5',
    eligibleInstruments: ['forex', 'commodities'],
    minDeposit: '',
    competitionRules: '',
    bannerImage: null,
    isPublic: true,
    requiresKYC: false,
    allowMultipleEntries: false
  });

  /* EMPTY PRIZE DISTRIBUTION */
  const [prizeDistribution, setPrizeDistribution] = useState([]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addPrizeRow = () => {

    const newRank = prizeDistribution.length + 1;

    setPrizeDistribution([
      ...prizeDistribution,
      { rank: newRank, prize: '', amount: '' }
    ]);
  };

  const updatePrizeRow = (index, field, value) => {

    const updated = [...prizeDistribution];
    updated[index][field] = value;
    setPrizeDistribution(updated);

  };

  const removePrizeRow = (index) => {

    setPrizeDistribution(prizeDistribution.filter((_, i) => i !== index));

  };

  /* SEND DATA TO BACKEND */
const handleCreateCompetition = async () => {

  try {

    const payload = {
      competitionName: formData.competitionName,
      description: formData.description,
      competitionType: formData.competitionType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      registrationDeadline: formData.registrationDeadline,
      maxParticipants: formData.maxParticipants,
      entryFee: formData.entryFee,
      totalPrizePool: formData.totalPrizePool,
      tradingPlatform: formData.tradingPlatform,
      eligibleInstruments: formData.eligibleInstruments,
      minDeposit: formData.minDeposit,
      competitionRules: formData.competitionRules,
      bannerImage: formData.bannerImage,
      isPublic: formData.isPublic,
      requiresKYC: formData.requiresKYC,
      allowMultipleEntries: formData.allowMultipleEntries,
      prizeDistribution: prizeDistribution
    };

    const response = await axios.post(
      "http://localhost:5001/api/competitions/create",
      payload
    );

    console.log("Competition Saved:", response.data);

    alert("Competition created successfully");
    
    onClose();

  } catch (error) {

    console.error("Error:", error);

    alert("Failed to create competition");

  }

};
  return (

    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>

      <DialogContent>

        <div style={{ padding: '20px', fontFamily: 'Arial', backgroundColor: '#f5f5f5' }}>

          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>

              <h2>Add New Competition</h2>

              <div>

                <button
                  onClick={onClose}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    marginRight: '10px'
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreateCompetition}
                  style={{
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px'
                  }}
                >
                  Create Competition
                </button>

              </div>

            </div>

            {/* FORM GRID */}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* LEFT COLUMN */}

              <div>

                <label>Competition Name</label>

                <input
                  name="competitionName"
                  value={formData.competitionName}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                />

                <label>Description</label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                />

                <label>Competition Type</label>

                <select
                  name="competitionType"
                  value={formData.competitionType}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="trading">Trading</option>
                  <option value="demo">Demo</option>
                  <option value="investment">Investment</option>
                </select>

              </div>

              {/* RIGHT COLUMN */}

              <div>

                <label>Start Date</label>

                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                />

                <label>End Date</label>

                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                />

                <label>Total Prize Pool</label>

                <input
                  name="totalPrizePool"
                  value={formData.totalPrizePool}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                />

                <label>Trading Platform</label>

                <select
                  name="tradingPlatform"
                  value={formData.tradingPlatform}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="MT5">MT5</option>
                  <option value="MT4">MT4</option>
                </select>

              </div>

            </div>

{/* Prize Distribution */}

<div style={{ marginTop: "30px" }}>

  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
    <h3 style={{ margin: 0 }}>Prize Distribution</h3>

    <button
      onClick={addPrizeRow}
      style={{
        background: "#007bff",
        color: "white",
        border: "none",
        padding: "8px 16px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold"
      }}
    >
      + Add Prize
    </button>
  </div>

  {prizeDistribution.length === 0 ? (

    <div
      style={{
        padding: "30px",
        textAlign: "center",
        background: "#fafafa",
        border: "1px dashed #ccc",
        borderRadius: "8px",
        color: "#777"
      }}
    >
      No prize distribution added yet
    </div>

  ) : (

    prizeDistribution.map((prize, index) => (

      <div
        key={index}
        style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr 1fr 120px",
          gap: "10px",
          alignItems: "center",
          padding: "15px",
          background: "#f9f9f9",
          borderRadius: "8px",
          marginBottom: "10px"
        }}
      >

        {/* Rank */}

        <div
          style={{
            background: "#4CAF50",
            color: "white",
            padding: "6px 10px",
            borderRadius: "20px",
            textAlign: "center",
            fontWeight: "bold"
          }}
        >
          Rank #{prize.rank}
        </div>

        {/* Prize Percentage */}

        <input
          placeholder="Prize % (ex: 50%)"
          value={prize.prize}
          onChange={(e) =>
            updatePrizeRow(index, "prize", e.target.value)
          }
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />

        {/* Amount */}

        <input
          placeholder="Amount (ex: $2500)"
          value={prize.amount}
          onChange={(e) =>
            updatePrizeRow(index, "amount", e.target.value)
          }
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />

        {/* Remove Button */}

        <button
          onClick={() => removePrizeRow(index)}
          style={{
            background: "#dc3545",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Remove
        </button>

      </div>

    ))

  )}

</div>

          </div>

        </div>

      </DialogContent>

    </Dialog>

  );
};

export default AdminCreateCompitition;

