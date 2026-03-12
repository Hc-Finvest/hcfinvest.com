import express from "express";
import Competition from "../models/Compitition.js";

const router = express.Router();


// Calculate competition status

const getCompetitionStatus = (startDate, endDate) => {

  const now = new Date();

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Completed
  if (end < now) {
    return "completed";
  }

  // Upcoming
  if (start > now) {
    return "upcoming";
  }

  // Ongoing
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
router.get("/getall", async (req, res) => {

  try {

    const competitions = await Competition.find();

    res.json({
      success: true,
      data: competitions
    });

  } catch (error) {

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


export default router;