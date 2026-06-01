'use client';

import React, { useState } from 'react';
import { ShieldCheck, Calendar, FileText, ChevronRight, Eye, Search, AlertCircle } from 'lucide-react';

interface AuditLog {
  _id: string;
  action: string;
  fileName: string;
  redactedCount: {
    emiratesIds: number;
    passportNumbers: number;
    dobs: number;
    emails?: number;
    phones?: number;
  };
  originalSnippet: string;
  redactedSnippet: string;
  timestamp: string;
}

interface AuditLogViewProps {
  logs: AuditLog[];
  isLoading: boolean;
}

export default function AuditLogView({ logs, isLoading }: AuditLogViewProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => 
    log.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectLog = (log: AuditLog) => {
    setSelectedLog(log);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Title Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-500" />
            PII Redaction Audit Logs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Verify real-time compliance redaction of sensitive UAE variables. Raw sensitive data is never logged or saved.
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter logs by CV filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Table of logs - 7 cols */}
        <div className="xl:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Audit Event Logs ({filteredLogs.length})</h3>
            <span className="text-xs text-slate-400">Click any row to open the snippet comparison</span>
          </div>
          
          {isLoading ? (
            <div className="flex-1 py-20 flex flex-col items-center justify-center">
              <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-slate-400">Loading audit records...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex-1 py-20 text-center flex flex-col items-center justify-center">
              <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No logs found matching search criteria.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[550px] divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredLogs.map((log) => {
                const totalRedacted = log.redactedCount.emiratesIds + log.redactedCount.passportNumbers + log.redactedCount.dobs + (log.redactedCount.emails || 0) + (log.redactedCount.phones || 0);
                const isSelected = selectedLog?._id === log._id;
                
                return (
                  <button
                    key={log._id}
                    onClick={() => handleSelectLog(log)}
                    className={`w-full text-left p-5 transition-all flex items-start gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isSelected ? 'bg-indigo-50/55 dark:bg-indigo-950/20 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="bg-slate-100 dark:bg-slate-700 p-2.5 rounded-xl text-slate-500 dark:text-slate-400">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1 gap-2">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{log.fileName}</h4>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1.5 shrink-0">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          {log.action.replace('CV_', '')}
                        </span>
                        
                        {log.redactedCount.emiratesIds > 0 && (
                          <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-medium">
                            {log.redactedCount.emiratesIds} EID
                          </span>
                        )}
                        {log.redactedCount.passportNumbers > 0 && (
                          <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-medium">
                            {log.redactedCount.passportNumbers} Passports
                          </span>
                        )}
                        {log.redactedCount.dobs > 0 && (
                          <span className="bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400 px-2 py-0.5 rounded-full text-[10px] font-medium">
                            {log.redactedCount.dobs} DOB
                          </span>
                        )}
                        {totalRedacted === 0 && (
                          <span className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-medium">
                            0 PII Detected
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 self-center" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Split comparison viewer - 5 cols */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/10">
            <Eye className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">PII Redaction Visualizer</h3>
          </div>

          {!selectedLog ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 my-auto">
              <ShieldCheck className="h-14 w-14 text-slate-200 dark:text-slate-700 mb-3" />
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-1">Select an Event Log</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
                Click a record from the list to display the side-by-side secure snippet comparison showing how EID and passport numbers are redacted.
              </p>
            </div>
          ) : (
            <div className="flex-1 p-5 space-y-5 overflow-y-auto max-h-[500px] text-xs">
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-1 truncate">{selectedLog.fileName}</h4>
                <p className="text-[10px] text-slate-400">{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>

              {/* Original secure masked snippet */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  <span>ORIGINAL INPUT SNAPSHOT (SECURED)</span>
                  <span className="text-[9px] text-amber-500 font-medium lowercase">† dummy masked, never saves raw PII</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3.5 font-mono text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {selectedLog.originalSnippet}
                </div>
              </div>

              {/* Redacted target snippet */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  <span>REDACTED TARGET OUTPUT (DB VERSION)</span>
                  <span className="text-[9px] text-emerald-500 font-medium">100% compliant filtering</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3.5 font-mono text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {/* Highlight the redacted tags */}
                  {selectedLog.redactedSnippet.split(/(<REDACTED_.*?>)/g).map((part, index) => {
                    if (part.startsWith('<REDACTED_') && part.endsWith('>')) {
                      let color = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
                      if (part.includes('PASSPORT')) color = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
                      if (part.includes('DOB')) color = 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300';
                      
                      return (
                        <span key={index} className={`${color} px-1.5 py-0.5 rounded font-extrabold text-[10px] tracking-wide select-none`}>
                          {part}
                        </span>
                      );
                    }
                    return part;
                  })}
                </div>
              </div>

              {/* Compliance note */}
              <div className="bg-indigo-50/60 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-950/40 rounded-xl p-3.5 text-slate-500 dark:text-slate-400 leading-relaxed text-[11px] flex gap-2.5">
                <ShieldCheck className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-0.5 text-xs">PII Redaction Report</h5>
                  The engine scanned the upload and identified and replaced values matching Emirates ID formats, date patterns matching DOB identifiers, and passport numbers. Only the redacted version is persisted in MongoDB or the local JSON file.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
