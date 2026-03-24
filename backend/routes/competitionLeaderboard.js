
// competitionLeaderboard.js

import express from "express";
import Trade from "../models/Trade.js";
import competitionParticipantSchema from "../models/competitionParticipantSchema.js";
// import Trade from "../models/Trade.js";
// import CompitionParticipant from "../models/competitionParticipantSchema.js";

const router = express.Router();

/**
 * 🔥 GET LEADERBOARD
 * URL: /api/competition/leaderboard/:competitionId
 */
router.get("/leaderboard/:competitionId", async (req, res) => {
  try {
    const { competitionId } = req.params;

    // ✅ 1. Get participants
    const participants = await competitionParticipantSchema.find({ competitionId })
      .populate("userId", "firstName email");

    if (!participants.length) {
      return res.json({ success: true, leaderboard: [] });
    }

    // ✅ 2. Extract userIds
    const userIds = participants.map((p) => p.userId._id);

    // ✅ 3. Fetch ALL OPEN TRADES (single query 🔥)
    const trades = await Trade.find({
      userId: { $in: userIds },
      status: "OPEN",
      isChallengeAccount: true, // ⚠️ only competition trades
    });

    // ✅ 4. Get symbols
    const symbols = [...new Set(trades.map((t) => t.symbol))];

    // ✅ 5. Fetch LIVE PRICES
    let livePrices = {};
    try {
      const priceRes = await fetch(
        `${process.env.PRICE_API_URL}/prices/batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols }),
        }
      );

      const priceData = await priceRes.json();

      if (priceData.success && priceData.prices) {
        livePrices = priceData.prices;
      }
    } catch (err) {
      console.error("❌ Price fetch error:", err);
    }

    // ✅ 6. Group trades by user
    const tradesByUser = {};

    trades.forEach((trade) => {
      const uid = trade.userId.toString();
      if (!tradesByUser[uid]) tradesByUser[uid] = [];
      tradesByUser[uid].push(trade);
    });

    // ✅ 7. Calculate P&L for each participant
    const updatedParticipants = [];

    for (const participant of participants) {
      const uid = participant.userId._id.toString();
      const userTrades = tradesByUser[uid] || [];

      let totalPnl = 0;

      for (const trade of userTrades) {
        const prices = livePrices[trade.symbol];
        if (!prices) continue;

        const pnl = trade.calculatePnl(prices.bid, prices.ask);
        totalPnl += pnl;
      }

      const initialDeposit = participant.initialDeposit || 1;

      const roi = (totalPnl / initialDeposit) * 100;
      const equity = initialDeposit + totalPnl;

      // ✅ update participant fields
      participant.profitLoss = totalPnl;
      participant.roi = roi;
      participant.equity = equity;

      updatedParticipants.push(participant);
    }

    // ✅ 8. Sort by ROI
    updatedParticipants.sort((a, b) => b.roi - a.roi);

    // ✅ 9. Assign ranks
    updatedParticipants.forEach((p, index) => {
      p.rank = index + 1;
    });

    // ✅ 10. Save updates (optional but recommended)
    await Promise.all(updatedParticipants.map((p) => p.save()));

    // ✅ 11. Final response
    const leaderboard = updatedParticipants.map((p) => ({
      userId: p.userId._id,
      name: p.userId.firstName,
      email: p.userId.email,
      profitLoss: p.profitLoss,
      roi: p.roi,
      equity: p.equity,
      rank: p.rank,
    }));

    return res.json({
      success: true,
      leaderboard,
    });

  } catch (error) {
    console.error("❌ Leaderboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
    });
  }
});

export default router;

