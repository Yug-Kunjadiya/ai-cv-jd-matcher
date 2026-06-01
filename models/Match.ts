import mongoose, { Schema } from 'mongoose';

const MatchSchema = new Schema({
  candidateName: { type: String, required: true },
  fitScore: { type: Number, required: true },
  recommendation: { type: String, required: true },
  jd: { type: String, required: true },
  semanticScore: { type: Number },
  matchedSkills: [{ type: String }],
  gaps: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);
