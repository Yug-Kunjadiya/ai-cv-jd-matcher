import { connectToDatabase } from './mongodb';
import { CV, JD, Analysis, AuditLog } from './models';
import { jsonDb } from './json-db';

export interface DBStatus {
  isMongoConnected: boolean;
  dbType: 'MongoDB' | 'JSON File';
}

let isConnected = false;

async function checkConnection(): Promise<boolean> {
  if (isConnected) return true;
  try {
    const conn = await connectToDatabase();
    if (conn.readyState === 1) {
      isConnected = true;
      return true;
    }
    return false;
  } catch (e) {
    // MongoDB connection failed, fallback to JSON db
    isConnected = false;
    return false;
  }
}

export const dbService = {
  getStatus: async (): Promise<DBStatus> => {
    const connected = await checkConnection();
    return {
      isMongoConnected: connected,
      dbType: connected ? 'MongoDB' : 'JSON File'
    };
  },

  // --- CV Operations ---
  saveCV: async (cvData: any) => {
    const isMongo = await checkConnection();
    if (isMongo) {
      return await CV.create(cvData);
    } else {
      return await jsonDb.addCv(cvData);
    }
  },

  getCVs: async () => {
    const isMongo = await checkConnection();
    if (isMongo) {
      return await CV.find({}).sort({ createdAt: -1 });
    } else {
      return await jsonDb.getCvs();
    }
  },

  // --- JD Operations ---
  saveJD: async (jdData: any) => {
    const isMongo = await checkConnection();
    if (isMongo) {
      return await JD.create(jdData);
    } else {
      return await jsonDb.addJd(jdData);
    }
  },

  getJDs: async () => {
    const isMongo = await checkConnection();
    if (isMongo) {
      return await JD.find({}).sort({ createdAt: -1 });
    } else {
      return await jsonDb.getJds();
    }
  },

  // --- Analysis Operations ---
  saveAnalysis: async (analysisData: any) => {
    const isMongo = await checkConnection();
    if (isMongo) {
      return await Analysis.create(analysisData);
    } else {
      return await jsonDb.addAnalysis(analysisData);
    }
  },

  getAnalyses: async () => {
    const isMongo = await checkConnection();
    if (isMongo) {
      return await Analysis.find({}).sort({ createdAt: -1 });
    } else {
      return await jsonDb.getAnalyses();
    }
  },

  updateAnalysisActual: async (analysisId: string, actual: 'hire' | 'reject') => {
    const isMongo = await checkConnection();
    if (isMongo) {
      return await Analysis.findByIdAndUpdate(analysisId, { actual }, { new: true });
    } else {
      const db = jsonDb.get();
      const idx = db.analyses.findIndex((a: any) => a._id === analysisId);
      if (idx !== -1) {
        db.analyses[idx].actual = actual;
        jsonDb.save(db);
        return db.analyses[idx];
      }
      return null;
    }
  },

  // --- Audit Log Operations ---
  saveAuditLog: async (logData: any) => {
    const isMongo = await checkConnection();
    if (isMongo) {
      return await AuditLog.create(logData);
    } else {
      return await jsonDb.addLog(logData);
    }
  },

  getAuditLogs: async () => {
    const isMongo = await checkConnection();
    if (isMongo) {
      return await AuditLog.find({}).sort({ timestamp: -1 });
    } else {
      return await jsonDb.getLogs();
    }
  },

  // --- Data Clearing ---
  clearAll: async () => {
    const isMongo = await checkConnection();
    if (isMongo) {
      await CV.deleteMany({});
      await JD.deleteMany({});
      await Analysis.deleteMany({});
      await AuditLog.deleteMany({});
    } else {
      jsonDb.clear();
    }
  }
};
