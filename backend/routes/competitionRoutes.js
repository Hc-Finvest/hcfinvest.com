//CompititionRoutes.js

import express from "express";
import Competition from "../models/Compitition.js";
import CompetitionParticipant from "../models/competitionParticipantSchema.js";

const router = express.Router();


// Calculate competition status

// const getCompetitionStatus = (startDate, endDate) => {

//   const now = new Date();

//   const start = new Date(startDate);
//   const end = new Date(endDate);

//   // Completed
//   if (end < now) {
//     return "completed";
//   }

//   // Upcoming
//   if (start > now) {
//     return "upcoming";
//   }

//   // Ongoing
//   return "live";

// };

const getCompetitionStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 🔥 Convert to DATE ONLY (ignore time completely)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (endDay < today) return "completed";
  if (startDay > today) return "upcoming";

  return "live";
};

// DELETE COMPETITION
router.delete("/delete/:id", async (req, res) => {

  try {

    const { id } = req.params;

    const competition = await Competition.findByIdAndDelete(id);

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found"
      });
    }

    res.json({
      success: true,
      message: "Competition deleted successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});

router.post("/join/:competitionId", async (req, res) => {

  try {

    const { competitionId } = req.params;
    const { userId } = req.body;

    const competition = await Competition.findById(competitionId);

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    competition.participants.push(userId);

    await competition.save();

    res.json({
      success: true,
      message: "Joined successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});


// GET ALL COMPETITIONS
// router.get("/getall", async (req, res) => {

//   try {

//     const competitions = await Competition.find();

//     res.json({
//       success: true,
//       data: competitions
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });

//   }

// });

router.get("/getall", async (req, res) => {
  try {
    // 🔥 STEP 1: Fetch all competitions
    const competitions = await Competition.find();

    // 🔥 STEP 2: Update status using your function
    const updatedCompetitions = await Promise.all(
      competitions.map(async (comp) => {

        const newStatus = getCompetitionStatus(
          comp.startDate,
          comp.endDate
        );

        // ✅ Only update if status changed
        if (comp.competitionStatus !== newStatus) {
          comp.competitionStatus = newStatus;
          await comp.save();
        }

        return comp;
      })
    );

    // 🔥 STEP 3: Return updated data
    res.json({
      success: true,
      data: updatedCompetitions
    });

  } catch (error) {
    console.error("GET ALL ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
  


//  GET COMPETITION DETAILS BY ID - includes participants
router.get("/:id", async (req, res) => {
  try {

    const competition = await Competition
      .findById(req.params.id)
      .populate("participants"); // optional if participants reference users

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found"
      });
    }

    res.status(200).json({
      success: true,
      data: competition
    });

  } catch (error) {

    console.error("Error loading competition:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});


// CREATE COMPETITION

router.post("/create", async (req, res) => {

  try {

    const data = req.body;

    const status = getCompetitionStatus(
      data.startDate,
      data.endDate
    );

    const competition = new Competition({
      ...data,
      competitionStatus: status
    });

    await competition.save();

    res.status(201).json({
      success: true,
      message: "Competition created successfully",
      data: competition
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});

router.post("/createParticipant", async (req, res) => {
  try {
    const {
      competitionId,
      userId,
      participantName,
      tradingAccountNumber,
      initialDeposit
    } = req.body;

    // ❗ Prevent duplicate join
    const existing = await CompetitionParticipant.findOne({
      competitionId,
      userId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already joined this competition"
      });
    }

    const participant = new CompetitionParticipant({
      competitionId,
      userId,
      participantName,
      tradingAccountNumber,
      initialDeposit,
      equity: initialDeposit, // start equity = deposit
      profitLoss: 0,
      roi: 0
    });

    await participant.save();

    res.status(201).json({
      success: true,
      message: "Joined competition successfully",
      participant
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


router.post("/createParticipant", async (req, res) => {
  try {
    const {
      competitionId,
      userId,
      participantName,
      tradingAccountNumber,
      initialDeposit
    } = req.body;

    console.log("Incoming Payload:", req.body);

    // ✅ VALIDATION
    if (!competitionId || !userId) {
      return res.status(400).json({
        success: false,
        message: "competitionId and userId are required"
      });
    }

    // ✅ CHECK DUPLICATE
    const existing = await CompetitionParticipant.findOne({
      competitionId,
      userId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already joined this competition"
      });
    }

    // ✅ CREATE PARTICIPANT (SAFE)
    const participant = await CompetitionParticipant.create({
      competitionId,
      userId,
      participantName,
      tradingAccountNumber,
      initialDeposit,
      equity: initialDeposit,
      profitLoss: 0,
      roi: 0
    });

    console.log("Participant created:", participant);

    res.status(201).json({
      success: true,
      message: "Joined competition successfully",
      participant
    });

  } catch (err) {
    console.error("CREATE PARTICIPANT ERROR:", err);

    // ✅ DUPLICATE KEY HANDLING
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User already joined this competition"
      });
    }

    res.status(500).json({
      success: false,
      message: err.message || "Server error"
    });
  }
});

// ✅ GET TOTAL WINNINGS OF USER
router.get("/total-winnings/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // 🔒 Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const result = await CompetitionParticipant.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          prize: { $ne: null } // only users who actually won
        }
      },

      // ⚠️ Convert string → number (only if prize is string in DB)
      {
        $addFields: {
          prizeAmount: { $toDouble: "$prize" }
        }
      },

      {
        $group: {
          _id: "$userId",
          totalWinnings: { $sum: "$prizeAmount" }
        }
      }
    ]);

    const totalWinnings =
      result.length > 0 ? result[0].totalWinnings : 0;

    res.status(200).json({
      success: true,
      totalWinnings
    });

  } catch (error) {
    console.error("Total Winnings Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});




export default router;