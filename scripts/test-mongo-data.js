const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
      if (key) process.env[key] = val;
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

async function test() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');
  
  const CV = mongoose.models.CV || mongoose.model('CV', new mongoose.Schema({ name: String }));
  const Analysis = mongoose.models.Analysis || mongoose.model('Analysis', new mongoose.Schema({
    cvId: { type: mongoose.Schema.Types.ObjectId, ref: 'CV' },
    fitScore: Number,
    recommendation: String,
    actual: String
  }));

  const analyses = await Analysis.find({}).populate('cvId');
  console.log('Analyses found:', analyses.length);
  analyses.forEach(a => {
    console.log(`- Candidate: ${a.cvId ? a.cvId.name : 'Unknown'}, Actual: ${a.actual}, Predicted: ${a.recommendation === 'hire' ? 'hire' : 'reject'} (Rec: ${a.recommendation}), FitScore: ${a.fitScore}`);
  });
  
  await mongoose.disconnect();
}

test();
