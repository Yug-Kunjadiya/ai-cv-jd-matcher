'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Play, CheckCircle2, AlertTriangle, RefreshCw, BarChart3, Binary, Table, XCircle } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number;
  colorClass: string;
  description: string;
}

function MetricCard({ label, value, colorClass, description }: MetricCardProps) {
  const percentage = Math.round(value * 100);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`text-2xl font-bold ${colorClass}`}>{percentage}%</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-3 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000`} 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: colorClass.includes('emerald') ? '#10b981' : colorClass.includes('indigo') ? '#6366f1' : colorClass.includes('sky') ? '#0ea5e9' : '#f59e0b'
          }}
        />
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>
    </div>
  );
}

interface EvaluationViewProps {
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: {
      tp: number;
      fp: number;
      fn: number;
      tn: number;
    };
  } | null;
  pairs: any[];
  isLoading: boolean;
  onTriggerSeed: () => Promise<void>;
  onSetActual?: (analysisId: string, newActual: 'hire' | 'reject') => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export default function EvaluationView({ metrics, pairs, isLoading, onTriggerSeed, onSetActual, onRefresh }: EvaluationViewProps) {
  const [seeding, setSeeding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'pending'>('all');

  // Auto-refresh every 15s to stay real-time
  useEffect(() => {
    if (!onRefresh) return;
    const interval = setInterval(() => { onRefresh(); }, 15000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const handleSeed = async () => {
    setSeeding(true);
    await onTriggerSeed();
    setSeeding(false);
  };

  const chartData = metrics ? [
    { name: 'Accuracy', score: Math.round(metrics.accuracy * 100), color: '#6366f1' },
    { name: 'Precision', score: Math.round(metrics.precision * 100), color: '#10b981' },
    { name: 'Recall', score: Math.round(metrics.recall * 100), color: '#38bdf8' },
    { name: 'F1 Score', score: Math.round(metrics.f1Score * 100), color: '#f59e0b' }
  ] : [];

  const pendingPairs = pairs.filter(p => !p.actual);
  const filteredPairs = pairs.filter(pair => {
    if (filter === 'pending') return !pair.actual;
    if (!pair.actual) return filter === 'all'; // pending only in 'all'
    const isCorrect = pair.actual?.toLowerCase() === pair.predicted?.toLowerCase();
    if (filter === 'correct') return isCorrect;
    if (filter === 'incorrect') return !isCorrect;
    return true;
  });

  const labelledPairs = pairs.filter(p => !!p.actual);
  const correctPairs = labelledPairs.filter(p => p.actual?.toLowerCase() === p.predicted?.toLowerCase());
  const mismatchPairs = labelledPairs.filter(p => p.actual?.toLowerCase() !== p.predicted?.toLowerCase());
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">System Evaluation Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Real-time evaluation of AI match engine decisions. Set the ground-truth label (HIRE/REJECT) for each CV using the toggle in the Actual Status column.</p>
        </div>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium shadow-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              title="Refresh evaluation data from database"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
          <button
            onClick={handleSeed}
            disabled={seeding || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:shadow-indigo-500/20 hover:shadow-lg"
          >
            {seeding ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Re-seed & Evaluate Dataset
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Recalculating evaluation matrix...</p>
        </div>
      ) : pairs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">No Analyses Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
            No CV analyses have been run yet. Go to the CV Matcher tab and upload a resume to get started. Your analyses will appear here in real time.
          </p>
          <button
            onClick={handleSeed}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
          >
            <Play className="h-4 w-4" /> Seed System Database Now
          </button>
        </div>
      ) : (
        <>
          {!metrics ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <p className="text-amber-800 dark:text-amber-300">
                <strong>Set ground truth labels</strong> to compute evaluation metrics. Click the amber <strong>+ SET LABEL</strong> button in the table below for each CV to assign its actual decision (HIRE/REJECT).
              </p>
            </div>
          ) : (
            /* Metrics Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard 
                label="Classification Accuracy" 
                value={metrics.accuracy} 
                colorClass="text-indigo-600 dark:text-indigo-400"
                description="Overall proportion of correct hire/reject predictions."
              />
              <MetricCard 
                label="Match Precision" 
                value={metrics.precision} 
                colorClass="text-emerald-600 dark:text-emerald-400"
                description="Accuracy of hire recommendations (low false positives)."
              />
              <MetricCard 
                label="Candidate Recall" 
                value={metrics.recall} 
                colorClass="text-sky-600 dark:text-sky-400"
                description="Proportion of actual good matches detected."
              />
              <MetricCard 
                label="Balanced F1 Score" 
                value={metrics.f1Score} 
                colorClass="text-amber-600 dark:text-amber-400"
                description="Harmonic mean of precision and recall validation."
              />
            </div>
          )}

          {metrics && (
          /* Charts Section */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Recharts Bar */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Validation Scores Chart</h3>
              </div>
              <div className="flex-1 h-64 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700/50" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Score']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#1e293b' }}
                    />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={50}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Confusion Matrix */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Binary className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Confusion Matrix (Actual vs Predicted)</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-400 mb-1">
                <div></div>
                <div className="text-emerald-500 py-1 bg-emerald-50 dark:bg-emerald-950/20 rounded-md">PREDICT HIRE</div>
                <div className="text-rose-500 py-1 bg-rose-50 dark:bg-rose-950/20 rounded-md">PREDICT REJECT</div>
              </div>

              <div className="grid grid-cols-12 gap-2 h-56">
                {/* Labels column */}
                <div className="col-span-2 flex flex-col justify-around text-right pr-2 text-[10px] font-bold text-slate-400">
                  <div className="text-emerald-500">ACTUAL<br/>HIRE</div>
                  <div className="text-rose-500">ACTUAL<br/>REJECT</div>
                </div>

                {/* Matrix core */}
                <div className="col-span-10 grid grid-cols-2 grid-rows-2 gap-2 h-full">
                  {/* TP */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 flex flex-col items-center justify-center border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30 transition-all">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.confusionMatrix.tp}</span>
                    <span className="text-[10px] font-medium text-emerald-800 dark:text-emerald-300 mt-1">True Positive</span>
                  </div>

                  {/* FN */}
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 transition-all">
                    <span className="text-2xl font-black text-slate-500 dark:text-slate-400">{metrics.confusionMatrix.fn}</span>
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-1">False Negative</span>
                  </div>

                  {/* FP */}
                  <div className="bg-rose-50 dark:bg-rose-950/10 rounded-xl p-4 flex flex-col items-center justify-center border border-rose-100 dark:border-rose-950/40 hover:bg-rose-100/30 transition-all">
                    <span className="text-2xl font-black text-rose-500 dark:text-rose-400">{metrics.confusionMatrix.fp}</span>
                    <span className="text-[10px] font-medium text-rose-700 dark:text-rose-300 mt-1">False Positive</span>
                  </div>

                  {/* TN */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 flex flex-col items-center justify-center border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30 transition-all">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.confusionMatrix.tn}</span>
                    <span className="text-[10px] font-medium text-emerald-800 dark:text-emerald-300 mt-1">True Negative</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-4 italic">
                A perfect model places all results in the diagonal (True Positives & True Negatives).
              </p>
            </div>
          </div>
          )}

          {/* Interactive Table of Pairs */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Table className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Validation Dataset Matches ({filteredPairs.length})</h3>
              </div>
              {/* Filter controls */}
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-0.5 text-xs font-medium gap-0.5">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${filter === 'all' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  All ({pairs.length})
                </button>
                <button
                  onClick={() => setFilter('correct')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${filter === 'correct' ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Correct ({correctPairs.length})
                </button>
                <button
                  onClick={() => setFilter('incorrect')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${filter === 'incorrect' ? 'bg-white dark:bg-slate-600 text-rose-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Mismatches ({mismatchPairs.length})
                </button>
                <button
                  onClick={() => setFilter('pending' as any)}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${filter === ('pending' as any) ? 'bg-white dark:bg-slate-600 text-amber-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Pending Label ({pendingPairs.length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700 font-semibold text-xs">
                    <th className="py-4 px-6">CANDIDATE NAME</th>
                    <th className="py-4 px-6">TARGET JOB DESCRIPTION</th>
                    <th className="py-4 px-6 text-center">ACTUAL STATUS</th>
                    <th className="py-4 px-6 text-center">PREDICTED STATUS</th>
                    <th className="py-4 px-6 text-center">FIT SCORE</th>
                    <th className="py-4 px-6 text-center">DECISION STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-600 dark:text-slate-300">
                  {filteredPairs.map((pair, idx) => {
                    const isPending = !pair.actual;
                    const actualStatus = pair.actual;
                    const predictedStatus = pair.predicted;
                    const decisionStatus = isPending ? "Awaiting Label" : (actualStatus?.toLowerCase() === predictedStatus?.toLowerCase() ? "Match" : "Mismatch");
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                        <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-200">{pair.cv_name || pair.cv_id}</td>
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400">{pair.jd_title || pair.jd_id}</td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center gap-1.5 min-w-[140px] justify-center mx-auto">
                            <div className="flex items-center gap-2">
                              {/* Hire Button */}
                              <button
                                onClick={() => onSetActual && pair._id && onSetActual(pair._id, 'hire')}
                                disabled={!onSetActual || !pair._id}
                                title="Set actual status to HIRE"
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none ${
                                  pair.actual === 'hire'
                                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500 shadow-md shadow-emerald-500/30 scale-105 opacity-100'
                                    : 'bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/20 opacity-60 hover:opacity-100'
                                }`}
                              >
                                Hire
                              </button>
                              {/* Reject Button */}
                              <button
                                onClick={() => onSetActual && pair._id && onSetActual(pair._id, 'reject')}
                                disabled={!onSetActual || !pair._id}
                                title="Set actual status to REJECT"
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none ${
                                  pair.actual === 'reject'
                                    ? 'bg-rose-600 dark:bg-rose-500 text-white border-rose-600 dark:border-rose-500 shadow-md shadow-rose-500/30 scale-105 opacity-100'
                                    : 'bg-rose-50/50 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-950/20 opacity-60 hover:opacity-100'
                                }`}
                              >
                                Reject
                              </button>
                            </div>
                            {/* Confirmation Label */}
                            <div className="h-4 flex items-center justify-center transition-all duration-300">
                              {pair.actual === 'hire' && (
                                <span id="i49q80" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider transition-all duration-300 animate-fade-in">
                                  Current Label: HIRE
                                </span>
                              )}
                              {pair.actual === 'reject' && (
                                <span id="5gjd3u" className="text-[10px] font-bold text-rose-500 dark:text-rose-400 tracking-wider transition-all duration-300 animate-fade-in">
                                  Current Label: REJECT
                                </span>
                              )}
                              {!pair.actual && (
                                <span className="text-[10px] font-medium text-amber-500/80 dark:text-amber-400/80 tracking-wider animate-pulse transition-all duration-300">
                                  Awaiting label
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${pair.predicted === 'hire' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'}`}>
                            {pair.predicted ? pair.predicted.toUpperCase() : 'PENDING'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-slate-800 dark:text-white">
                          {pair.fitScore ? `${pair.fitScore}%` : '-'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            {isPending ? (
                              <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-xs bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg">
                                <AlertTriangle className="h-3.5 w-3.5" /> Awaiting Label
                              </div>
                            ) : decisionStatus === "Match" ? (
                              <div className="flex items-center gap-1.5 text-emerald-500 font-semibold text-xs bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Match
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-rose-500 font-semibold text-xs bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-lg">
                                <XCircle className="h-3.5 w-3.5" /> Mismatch
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
