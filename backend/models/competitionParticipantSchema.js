// competitionParticipantSchema


import mongoose from "mongoose";

const competitionParticipantSchema = new mongoose.Schema(
  {
    competitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competition",
      required: [true, "Competition ID is required"],
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true
    },

    participantName: {
      type: String,
      required: [true, "Participant name is required"],
      trim: true,
      maxlength: 100
    },

    tradingAccountNumber: {
      type: String,
      required: [true, "Trading account number is required"],
      trim: true
    },

    initialDeposit: {
      type: Number,
      required: [true, "Initial deposit is required"],
      min: [0, "Initial deposit cannot be negative"]
    },

    equity: {
      type: Number,
      default: 0,
      min: [0, "Equity cannot be negative"]
    },

    profitLoss: {
      type: Number,
      default: 0
    },

    roi: {
      type: Number,
      default: 0
    },

    rank: {
      type: Number,
      default: null,
      min: 1
    },

    prize: {
      type: String,
      default: null,
      trim: true
    },

    enrolledAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);


// 🔒 Prevent duplicate participation (same user + same competition)
competitionParticipantSchema.index(
  { competitionId: 1, userId: 1 },
  { unique: true }
);


// 🚀 Optimized leaderboard queries
competitionParticipantSchema.index({ competitionId: 1, roi: -1 });
competitionParticipantSchema.index({ competitionId: 1, profitLoss: -1 });


// ⚡ Auto-calculate ROI before saving
competitionParticipantSchema.pre("save", function (next) {
  if (this.initialDeposit > 0) {
    this.roi = (this.profitLoss / this.initialDeposit) * 100;
  }
  next();
});


// 📊 Optional virtual ROI (if needed)
competitionParticipantSchema.virtual("calculatedROI").get(function () {
  if (this.initialDeposit > 0) {
    return (this.profitLoss / this.initialDeposit) * 100;
  }
  return 0;
});


// ✅ EXPORT MODEL
const CompetitionParticipant = mongoose.model(
  "CompetitionParticipant",
  competitionParticipantSchema
);

export default CompetitionParticipant;