import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'eval/local_db.json');

export interface LocalDBStructure {
  cvs: any[];
  jds: any[];
  analyses: any[];
  logs: any[];
}

function initDB(): LocalDBStructure {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(DB_FILE)) {
    const initial: LocalDBStructure = { cvs: [], jds: [], analyses: [], logs: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }

  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content) as LocalDBStructure;
  } catch (e) {
    console.error("Failed to parse local JSON DB. Resetting...", e);
    const initial: LocalDBStructure = { cvs: [], jds: [], analyses: [], logs: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

export const jsonDb = {
  get: (): LocalDBStructure => {
    return initDB();
  },

  save: (data: LocalDBStructure) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  },

  clear: () => {
    const initial: LocalDBStructure = { cvs: [], jds: [], analyses: [], logs: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
  },

  // --- CVs ---
  getCvs: async () => {
    return initDB().cvs;
  },
  addCv: async (cv: any) => {
    const db = initDB();
    const newCv = { ...cv, _id: cv._id || `cv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, createdAt: new Date() };
    db.cvs.push(newCv);
    jsonDb.save(db);
    return newCv;
  },

  // --- JDs ---
  getJds: async () => {
    return initDB().jds;
  },
  addJd: async (jd: any) => {
    const db = initDB();
    const newJd = { ...jd, _id: jd._id || `jd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, createdAt: new Date() };
    db.jds.push(newJd);
    jsonDb.save(db);
    return newJd;
  },

  // --- Analyses ---
  getAnalyses: async () => {
    return initDB().analyses;
  },
  addAnalysis: async (analysis: any) => {
    const db = initDB();
    const newAnalysis = { ...analysis, _id: `analysis_${Date.now()}`, createdAt: new Date() };
    db.analyses.push(newAnalysis);
    jsonDb.save(db);
    return newAnalysis;
  },

  // --- Audit Logs ---
  getLogs: async () => {
    const db = initDB();
    // Return sorted newest first
    return [...db.logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  addLog: async (log: any) => {
    const db = initDB();
    const newLog = { ...log, _id: `log_${Date.now()}`, timestamp: new Date() };
    db.logs.push(newLog);
    jsonDb.save(db);
    return newLog;
  }
};
