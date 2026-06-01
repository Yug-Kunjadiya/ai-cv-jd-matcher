const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables from .env.local
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

// Target database URIs to clear
const uris = [
  'mongodb+srv://yugkunjadiya007_db_user:lwhQ2b8aO0brpKEk@cluster0.rnarbvl.mongodb.net/cvmatcher?appName=Cluster0',
  'mongodb+srv://yugkunjadiya007_db_user:lwhQ2b8aO0brpKEk@cluster0.rnarbvl.mongodb.net/test?appName=Cluster0'
];

const CVSchema = new mongoose.Schema({ name: String }, { strict: false });
const JDSchema = new mongoose.Schema({ title: String }, { strict: false });
const AnalysisSchema = new mongoose.Schema({ cvId: mongoose.Schema.Types.ObjectId }, { strict: false });
const AuditLogSchema = new mongoose.Schema({ action: String }, { strict: false });

async function clearDBs() {
  console.log('Starting DB cleanup...');
  
  for (const uri of uris) {
    try {
      console.log(`Connecting to database: ${uri.split('@')[1]} ...`);
      const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 }).asPromise();
      console.log('Connected successfully.');
      
      const CV = conn.model('CV', CVSchema);
      const JD = conn.model('JD', JDSchema);
      const Analysis = conn.model('Analysis', AnalysisSchema);
      const AuditLog = conn.model('AuditLog', AuditLogSchema);
      
      // Also register Match model to clear it too!
      const Match = conn.model('Match', new mongoose.Schema({}, { strict: false }));
      
      const cvRes = await CV.deleteMany({});
      const jdRes = await JD.deleteMany({});
      const analysisRes = await Analysis.deleteMany({});
      const auditRes = await AuditLog.deleteMany({});
      const matchRes = await Match.deleteMany({});
      
      console.log(`Cleared collections:`);
      console.log(`- CVs: ${cvRes.deletedCount}`);
      console.log(`- JDs: ${jdRes.deletedCount}`);
      console.log(`- Analyses: ${analysisRes.deletedCount}`);
      console.log(`- AuditLogs: ${auditRes.deletedCount}`);
      console.log(`- Matches: ${matchRes.deletedCount}`);
      
      await conn.close();
      console.log('Connection closed.\n');
    } catch (error) {
      console.error(`Failed to clear database for URI:`, error.message);
    }
  }

  // 2. Clear local JSON database
  const LOCAL_DB_PATH = path.join(__dirname, '../eval/local_db.json');
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      console.log('Clearing local JSON database file...');
      const emptyDb = { cvs: [], jds: [], analyses: [], logs: [] };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(emptyDb, null, 2), 'utf8');
      console.log('Successfully cleared local_db.json.');
    } catch (error) {
      console.error('Failed to clear local JSON database:', error.message);
    }
  }

  console.log('DB cleanup completed.');
}

clearDBs();
