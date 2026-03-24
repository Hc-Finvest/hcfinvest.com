import express from "express";
import sendCompetitionEmail from "../services/sendCompetitionEmail.js";
import competitionJoinTemplate from "../scripts/CompetitionEmailTemplate.js";

const router = express.Router();

router.post("/competition-join", async (req, res) => {
  try {
    const { email, name, competitionName, startDate } = req.body;

    const html = competitionJoinTemplate({
      name,
      competitionName,
      startDate,
    });

    await sendCompetitionEmail({
      to: email,
      subject: "🎉 Competition Joined Successfully",
      html,
    });

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Email failed" });
  }
});

export default router;