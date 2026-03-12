import mongoose from "mongoose";

const prizeSchema = new mongoose.Schema({
  position: Number,
  prizeAmount: String
});

const competitionSchema = new mongoose.Schema({

  competitionName: {
    type: String,
    required: true
  },

  description: String,
  competitionType: {
    type: String,
    default: "trading"
  },

  startDate: Date,
  endDate: Date,
  registrationDeadline: Date,

  maxParticipants: Number,
  entryFee: Number,

  totalPrizePool: String,
  tradingPlatform: String,

  eligibleInstruments: [String],

  minDeposit: Number,
  competitionRules: String,
  bannerImage: String,

  isPublic: Boolean,
  requiresKYC: Boolean,
  allowMultipleEntries: Boolean,

  competitionStatus: {
    type: String,
    enum: ["upcoming", "live", "completed"]
  },

  prizeDistribution: [prizeSchema],

  /* ⭐ ADD THIS FIELD */
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]

}, { timestamps: true });

export default mongoose.model("Competition", competitionSchema);