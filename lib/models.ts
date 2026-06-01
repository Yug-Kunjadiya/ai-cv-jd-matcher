import mongoose, { Schema } from 'mongoose';

// --- CV Schema ---
const CVSchema = new Schema({
  name: { type: String, required: true },
  skills: [{ type: String }],
  education: [{ type: String }],
  experienceYears: { type: Number, default: 0 },
  workHistory: [
    {
      role: { type: String },
      company: { type: String },
      duration: { type: String },
      description: { type: String }
    }
  ],
  visaStatus: { type: String, default: 'unknown' }, // e.g. golden visa, employment visa, dependent visa
  emiratesIdMentioned: { type: Boolean, default: false },
  rawTextRedacted: { type: String, required: true },
  fileName: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// --- JD Schema ---
const JDSchema = new Schema({
  title: { type: String, required: true },
  requiredSkills: [{ type: String }],
  preferredSkills: [{ type: String }],
  minExperience: { type: Number, default: 0 },
  visaPreference: { type: String, default: 'any' },
  seniorityLevel: { type: String, default: 'mid' }, // e.g. junior, mid, senior, lead
  rawText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// --- Analysis Schema ---
const AnalysisSchema = new Schema({
  cvId: { type: Schema.Types.ObjectId, ref: 'CV', required: true },
  jdId: { type: Schema.Types.ObjectId, ref: 'JD' }, // optional if matching is on-the-fly
  fitScore: { type: Number, required: true },
  recommendation: { type: String, enum: ['hire', 'borderline', 'reject'], required: true },
  actual: { type: String, enum: ['hire', 'reject'] },
  perSkillScores: [
    {
      skill: { type: String, required: true },
      score: { type: Number, required: true },
      evidence: { type: String, default: '' }
    }
  ],
  topReasons: [{ type: String }],
  gaps: [{ type: String }],
  visaAnalysis: { type: String },
  seniorityAnalysis: { type: String },
  summary: { type: String },
  semanticScore: { type: Number },
  embeddingMatchConfidence: { type: Number },
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

// --- Audit Log Schema ---
const AuditLogSchema = new Schema({
  action: { type: String, required: true }, // CV_UPLOAD, CV_REDACTION, JD_PARSE, MATCH_ANALYSIS
  fileName: { type: String },
  redactedCount: {
    emiratesIds: { type: Number, default: 0 },
    passportNumbers: { type: Number, default: 0 },
    dobs: { type: Number, default: 0 }
  },
  originalSnippet: { type: String }, // Masked original snippet (contains no actual PII, only asterisks/placeholders)
  redactedSnippet: { type: String }, // The redacted snippet showing replacement tags
  timestamp: { type: Date, default: Date.now }
});

export const CV = mongoose.models.CV || mongoose.model('CV', CVSchema);
export const JD = mongoose.models.JD || mongoose.model('JD', JDSchema);
export const Analysis = mongoose.models.Analysis || mongoose.model('Analysis', AnalysisSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
