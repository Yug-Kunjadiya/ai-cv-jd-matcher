'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, 
  FileText, 
  UploadCloud, 
  X, 
  Sparkles, 
  Moon, 
  Sun, 
  Database, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Globe, 
  BookOpen, 
  Lock,
  ArrowRight,
  TrendingUp,
  LayoutDashboard,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

// Custom components
import EvaluationView from '@/components/EvaluationView';
import AuditLogView from '@/components/AuditLogView';
import TrustedCompanies from '@/components/TrustedCompanies';

export default function Home() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<'match' | 'eval' | 'logs'>('match');
  const [darkMode, setDarkMode] = useState(false);
  const [dbStatus, setDbStatus] = useState({ isMongoConnected: false, dbType: 'JSON File' });
  // Gemini API key is configured on the backend via .env.local
  
  // Matching Inputs
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);

  // Evaluation & Logs lists
  const [evalData, setEvalData] = useState<{ metrics: any; pairs: any[] }>({ metrics: null, pairs: [] });
  const [logsList, setLogsList] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [isEvalLoading, setIsEvalLoading] = useState(false);

  // Steps for the animated matcher progress
  const analysisSteps = [
    'Reading resume file content...',
    'Redacting sensitive Emirates IDs, passports, and DOBs...',
    'Calculating local sentence embedding vectors...',
    'Comparing skills and experience segments...',
    'Executing Gemini structured matching logic...'
  ];

  // Load state on mount
  useEffect(() => {
    // Check if window is defined for dark mode preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
      }
      
      // Session API key loading removed
    }
    fetchLogs();
    fetchEvalMetrics();
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  };



  const fetchLogs = async () => {
    setIsLogsLoading(true);
    try {
      const res = await fetch('/api/logs', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLogsList(data.logs || []);
        if (data.dbStatus) {
          setDbStatus(data.dbStatus);
        }
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    } finally {
      setIsLogsLoading(false);
    }
  };

  const fetchEvalMetrics = async () => {
    setIsEvalLoading(true);
    try {
      const res = await fetch('/api/eval', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEvalData({ metrics: data.metrics, pairs: data.pairs });
        }
      }
    } catch (e) {
      console.error('Failed to fetch eval:', e);
    } finally {
      setIsEvalLoading(false);
    }
  };

  const handleTriggerSeed = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        await fetchLogs();
        await fetchEvalMetrics();
      }
    } catch (e) {
      console.error('Failed to trigger seeding:', e);
    }
  };

  const handleSetActual = async (analysisId: string, newActual: 'hire' | 'reject') => {
    setIsEvalLoading(true);
    try {
      const res = await fetch('/api/eval/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, actual: newActual })
      });
      if (res.ok) {
        await fetchEvalMetrics();
      }
    } catch (e) {
      console.error('Failed to set candidate actual status:', e);
    } finally {
      setIsEvalLoading(false);
    }
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf' || ext === 'txt') {
        setCvFile(file);
        setErrorMsg('');
      } else {
        setErrorMsg('Invalid file type. Please upload a PDF or plain text resume.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
      setErrorMsg('');
    }
  };

  const clearFile = () => {
    setCvFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Run the matching evaluation
  const handleAnalyze = async () => {
    if (!cvFile) {
      setErrorMsg('Please select a CV resume file.');
      return;
    }
    if (!jdText.trim()) {
      setErrorMsg('Please enter a Job Description description.');
      return;
    }

    setErrorMsg('');
    setIsAnalyzing(true);
    setAnalysisStep(0);
    setAnalysisResult(null);
    setSelectedSkill(null);

    // Animate progress steps
    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    try {
      const formData = new FormData();
      formData.append('cv', cvFile);
      formData.append('jd', jdText);


      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to complete analysis.');
        } else {
          const text = await res.text();
          // Extract title or main message from HTML response if possible, otherwise truncate
          const titleMatch = text.match(/<title>([\s\S]*?)<\/title>/i);
          const errorMsgText = titleMatch ? titleMatch[1].trim() : text.substring(0, 150) + '...';
          throw new Error(`Server error (${res.status}): ${errorMsgText}`);
        }
      }

      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
        // Pre-select first skill scorecard
        if (data.analysis.per_skill_scores && data.analysis.per_skill_scores[0]) {
          setSelectedSkill(data.analysis.per_skill_scores[0]);
        }
        // Refresh logs and evaluation stats
        fetchLogs();
        fetchEvalMetrics();
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setErrorMsg(err.message || 'An error occurred during matching.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export JSON Report
  const handleExportJSON = () => {
    if (!analysisResult) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(analysisResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cv_jd_match_report_${analysisResult.cvName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className={`${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} min-h-screen transition-all font-sans antialiased`}>
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-600/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                AI CV-TO-JD MATCHER
              </h1>
              <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
                UAE Recruiting Suite
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Database indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold border border-slate-200/50 dark:border-slate-700/50 select-none">
              <Database className={`h-3.5 w-3.5 ${dbStatus.isMongoConnected ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span className="text-slate-500 dark:text-slate-400">DB:</span>
              <span className={dbStatus.isMongoConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                {dbStatus.dbType} {dbStatus.isMongoConnected ? '(Online)' : '(Offline Fallback)'}
              </span>
            </div>



            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-slate-500" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        


        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 font-medium text-sm gap-6">
          <button
            onClick={() => setActiveTab('match')}
            className={`pb-4 px-2 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'match' ? 'border-indigo-600 text-indigo-600 dark:text-white font-bold' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            Match Dashboard
          </button>
          <button
            onClick={() => setActiveTab('eval')}
            className={`pb-4 px-2 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'eval' ? 'border-indigo-600 text-indigo-600 dark:text-white font-bold' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <TrendingUp className="h-4.5 w-4.5" />
            Evaluation Hub
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-4 px-2 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'logs' ? 'border-indigo-600 text-indigo-600 dark:text-white font-bold' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Lock className="h-4.5 w-4.5" />
            PII Audit Logs
          </button>
        </div>

        {/* Tab Content Router */}
        <div>
          {activeTab === 'eval' && (
            <EvaluationView 
              metrics={evalData.metrics} 
              pairs={evalData.pairs} 
              isLoading={isEvalLoading}
              onTriggerSeed={handleTriggerSeed}
              onSetActual={handleSetActual}
              onRefresh={fetchEvalMetrics}
            />
          )}

          {activeTab === 'logs' && (
            <AuditLogView 
              logs={logsList} 
              isLoading={isLogsLoading} 
            />
          )}

          {activeTab === 'match' && (
            <div className="space-y-8 animate-fade-in">
              <TrustedCompanies />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Panel - Inputs (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    Upload Candidate CV
                  </h3>

                  {/* Drag and Drop uploader */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${dragOver ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50/30'}`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.txt"
                      className="hidden"
                    />
                    
                    {!cvFile ? (
                      <>
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl mb-3 text-slate-400 dark:text-slate-500">
                          <UploadCloud className="h-7 w-7" />
                        </div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-1">Drag and drop file here</h4>
                        <p className="text-xs text-slate-400 max-w-xs">Supports PDF or TXT resume files (Max 5MB)</p>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl relative">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-indigo-100 dark:bg-indigo-950 p-2.5 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="text-left min-w-0">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[200px]">
                              {cvFile.name}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              {(cvFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFile();
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-500" />
                    Job Description (JD)
                  </h3>
                  
                  <textarea
                    rows={8}
                    placeholder="Paste job details, required skills, experience parameters, or visa preferences..."
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed placeholder-slate-400"
                  />

                  {errorMsg && (
                    <div className="flex gap-2 p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs border border-rose-100 dark:border-rose-900/50 leading-relaxed">
                      <XCircle className="h-4.5 w-4.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer disabled:cursor-not-allowed text-sm"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing Match Profile...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Analyze Match Details
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Panel - Results (7 cols) */}
              <div className="lg:col-span-7">
                
                {/* 1. Analyzing Loading State */}
                {isAnalyzing && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center py-24 space-y-6 flex flex-col items-center justify-center">
                    <div className="relative">
                      {/* Outer pulsing ring */}
                      <div className="h-16 w-16 border-4 border-indigo-100 dark:border-indigo-900 rounded-full animate-pulse" />
                      {/* Inner spinning ring */}
                      <div className="absolute top-0 left-0 h-16 w-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-lg text-slate-800 dark:text-white">Parsing and matching variables</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">Evaluating skillset embeddings, experience years alignment, and visa eligibility metrics.</p>
                    </div>

                    {/* Animated Step List */}
                    <div className="w-full max-w-xs space-y-2.5 text-left border border-slate-100 dark:border-slate-700/50 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/25">
                      {analysisSteps.map((step, idx) => {
                        const isActive = idx === analysisStep;
                        const isDone = idx < analysisStep;
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center gap-2.5 text-xs transition-opacity duration-300 ${isDone ? 'text-slate-400 dark:text-slate-500 line-through' : isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-300 dark:text-slate-600'}`}
                          >
                            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${isDone ? 'bg-slate-300 dark:bg-slate-600' : isActive ? 'bg-indigo-600 dark:bg-indigo-400 animate-ping' : 'bg-slate-200 dark:bg-slate-700'}`} />
                            <span>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Default Welcome State */}
                {!isAnalyzing && !analysisResult && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center py-32 flex flex-col items-center justify-center">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full mb-4 text-slate-400 dark:text-slate-600">
                      <Sparkles className="h-10 w-10 text-indigo-500/80" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">CV-to-JD Analysis Hub</h3>
                    <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                      Upload a candidate resume PDF on the left, paste the JD requirements, and hit analyze. The engine will instantly run semantic checks and compile scores.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold mt-8 text-slate-400 uppercase tracking-wide">
                      <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> PII Masking</span>
                      <span className="h-1 w-1 bg-slate-300 rounded-full" />
                      <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> semantic score</span>
                      <span className="h-1 w-1 bg-slate-300 rounded-full" />
                      <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> UAE work checks</span>
                    </div>
                  </div>
                )}

                {/* 3. Result Loaded State */}
                {!isAnalyzing && analysisResult && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Header Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                      
                      {/* Overall Fit Grid */}
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                        
                        {/* Radial Score ring */}
                        <div className="flex items-center gap-4">
                          <div className="relative h-24 w-24 flex items-center justify-center shrink-0">
                            {/* SVG Radial progress bar */}
                            <svg className="h-full w-full -rotate-90">
                              <circle 
                                cx="48" 
                                cy="48" 
                                r="40" 
                                stroke="#f1f5f9" 
                                strokeWidth="8" 
                                fill="transparent"
                                className="dark:stroke-slate-700"
                              />
                              <circle 
                                cx="48" 
                                cy="48" 
                                r="40" 
                                stroke={analysisResult.fit_score >= 80 ? '#10b981' : analysisResult.fit_score >= 55 ? '#f59e0b' : '#ef4444'} 
                                strokeWidth="8" 
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 40}
                                strokeDashoffset={2 * Math.PI * 40 * (1 - analysisResult.fit_score / 100)}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                              />
                            </svg>
                            <span className="absolute text-2xl font-black text-slate-800 dark:text-white">
                              {analysisResult.fit_score}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Overall Fit Index</span>
                            <h4 className="font-extrabold text-lg text-slate-800 dark:text-white leading-tight">
                              {analysisResult.cvName}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Matched against: <span className="font-semibold text-slate-600 dark:text-slate-300">{analysisResult.jdTitle}</span>
                            </p>
                          </div>
                        </div>

                        {/* Recommendation badge */}
                        <div className="flex flex-col items-center sm:items-end gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommendation</span>
                          {analysisResult.recommendation === 'hire' ? (
                            <span className="px-5 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50 rounded-xl font-bold tracking-wide flex items-center gap-1.5 text-sm uppercase shadow-sm shadow-emerald-500/5 animate-pulse">
                              <CheckCircle className="h-4.5 w-4.5" /> HIRE CANDIDATE
                            </span>
                          ) : analysisResult.recommendation === 'borderline' ? (
                            <span className="px-5 py-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50 rounded-xl font-bold tracking-wide flex items-center gap-1.5 text-sm uppercase shadow-sm shadow-amber-500/5">
                              <AlertCircle className="h-4.5 w-4.5" /> BORDERLINE FIT
                            </span>
                          ) : (
                            <span className="px-5 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50 rounded-xl font-bold tracking-wide flex items-center gap-1.5 text-sm uppercase shadow-sm shadow-rose-500/5">
                              <XCircle className="h-4.5 w-4.5" /> REJECT CANDIDATE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-100 dark:border-slate-800/80 rounded-xl leading-relaxed text-xs text-slate-600 dark:text-slate-300">
                        <h5 className="font-bold text-slate-800 dark:text-white mb-1">Recruiter Insights Summary</h5>
                        {analysisResult.summary}
                      </div>

                      {/* Export action */}
                      <div className="flex justify-end border-t border-slate-100 dark:border-slate-700/50 pt-4">
                        <button
                          onClick={handleExportJSON}
                          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer font-bold"
                        >
                          <Download className="h-4 w-4" /> Export Report (JSON)
                        </button>
                      </div>
                    </div>

                    {/* Semantic Similarity Section */}
                    {analysisResult.semanticScore !== undefined && (
                      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                            <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
                            Local Embeddings Semantic Similarity Profile
                          </h4>
                          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md text-indigo-600 dark:text-indigo-400 font-bold select-none uppercase tracking-wide">
                            HuggingFace all-MiniLM-L6-v2
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                          {/* Scores & Progress */}
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center text-xs mb-1.5">
                                <span className="font-medium text-slate-500 dark:text-slate-400">Semantic Text Similarity Score</span>
                                <span className="font-bold text-slate-800 dark:text-white text-sm">
                                  {Math.round(analysisResult.semanticScore * 100)}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                                  style={{ width: `${Math.round(analysisResult.semanticScore * 100)}%` }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center text-xs mb-1.5">
                                <span className="font-medium text-slate-500 dark:text-slate-400">Embedding Match Confidence</span>
                                <span className={`font-bold text-sm ${
                                  analysisResult.embeddingMatchConfidence >= 75 ? 'text-emerald-500' :
                                  analysisResult.embeddingMatchConfidence >= 45 ? 'text-amber-500' : 'text-rose-500'
                                }`}>
                                  {analysisResult.embeddingMatchConfidence}% ({
                                    analysisResult.embeddingMatchConfidence >= 75 ? 'High Confidence' :
                                    analysisResult.embeddingMatchConfidence >= 45 ? 'Medium Confidence' : 'Low Confidence'
                                  })
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-1000" 
                                  style={{ 
                                    width: `${analysisResult.embeddingMatchConfidence}%`,
                                    backgroundColor: analysisResult.embeddingMatchConfidence >= 75 ? '#10b981' : analysisResult.embeddingMatchConfidence >= 45 ? '#f59e0b' : '#ef4444'
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Info Text */}
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed border-l-2 border-slate-200 dark:border-slate-700 pl-4 py-1">
                            We use the HuggingFace sentence-transformers pipeline to compute local semantic vector embeddings. 
                            This measures high-dimensional contextual alignment rather than simple keyword matches, 
                            evaluating skill experience and overall resume relevance.
                          </p>
                        </div>

                        {/* Semantically Matched vs Missing Skills */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/25 border border-slate-100 dark:border-slate-800">
                            <h5 className="text-[11px] font-bold text-slate-500 tracking-wide uppercase select-none flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Semantically Matched Skills ({analysisResult.matchedSkills?.length || 0})
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {analysisResult.matchedSkills && analysisResult.matchedSkills.length > 0 ? (
                                analysisResult.matchedSkills.map((skill: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-100/50 dark:border-emerald-900/30">
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No semantic skill matches.</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/25 border border-slate-100 dark:border-slate-800">
                            <h5 className="text-[11px] font-bold text-slate-500 tracking-wide uppercase select-none flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Lacking/Missing Skills ({analysisResult.missingSkills?.length || 0})
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {analysisResult.missingSkills && analysisResult.missingSkills.length > 0 ? (
                                analysisResult.missingSkills.map((skill: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No missing skills detected.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reasons & Gaps Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Top Match Reasons */}
                      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-3">
                          <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                          Top 5 Match Strengths
                        </h4>
                        <ul className="space-y-3">
                          {analysisResult.top_reasons?.map((reason: string, idx: number) => (
                            <li key={idx} className="flex gap-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300 items-start">
                              <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 px-1 rounded text-[10px] font-bold mt-0.5 select-none">{idx + 1}</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Top Skill Gaps */}
                      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-3">
                          <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
                          Top 3 Gaps & Red Flags
                        </h4>
                        <ul className="space-y-3">
                          {analysisResult.gaps?.map((gap: string, idx: number) => (
                            <li key={idx} className="flex gap-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300 items-start">
                              <span className="bg-rose-50 dark:bg-rose-950/20 text-rose-500 px-1 rounded text-[10px] font-bold mt-0.5 select-none">{idx + 1}</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* UAE Compliance Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-3">
                        <Globe className="h-4.5 w-4.5 text-indigo-500" />
                        UAE Labor & Visa Compliance Guidelines
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                        
                        {/* Visa Analysis */}
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-700 dark:text-slate-300">Visa Mentions Details</h5>
                          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                            {analysisResult.visa_analysis || "No specific UAE visa details were detected in the CV."}
                          </p>
                        </div>

                        {/* Experience & Seniority */}
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-700 dark:text-slate-300">Seniority Alignment</h5>
                          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                            {analysisResult.seniority_analysis || "No seniority mismatch was detected."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Per-Skill Scorecards & Evidence citations */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                          <BookOpen className="h-4.5 w-4.5 text-indigo-500" />
                          Skill Scorecards & citations
                        </h4>
                        <span className="text-[10px] text-slate-400">Click a card to see matching citation</span>
                      </div>

                      <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Cards list (7 cols) */}
                        <div className="md:col-span-7 space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
                          {analysisResult.per_skill_scores?.map((skillScore: any, idx: number) => {
                            const isSelected = selectedSkill?.skill === skillScore.skill;
                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedSkill(skillScore)}
                                className={`w-full text-left p-3.5 border rounded-xl transition-all cursor-pointer flex flex-col gap-2 ${isSelected ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-sm' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}
                              >
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">{skillScore.skill}</span>
                                  <span className={`font-bold ${skillScore.score >= 80 ? 'text-emerald-500' : skillScore.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                    {skillScore.score}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-500" 
                                    style={{ 
                                      width: `${skillScore.score}%`,
                                      backgroundColor: skillScore.score >= 80 ? '#10b981' : skillScore.score >= 50 ? '#f59e0b' : '#ef4444'
                                    }}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Citation citation (5 cols) */}
                        <div className="md:col-span-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col min-h-[220px]">
                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2 uppercase flex items-center justify-between">
                            <span>MATCH EVIDENCE QUOTE</span>
                            {selectedSkill && (
                              <span className="bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-bold tracking-normal select-none">
                                {selectedSkill.skill}
                              </span>
                            )}
                          </div>

                          {!selectedSkill ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center my-auto">
                              <HelpCircle className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-1" />
                              <p className="text-[10px]">Select a skill scorecard to load matched context from the candidate resume.</p>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col justify-between leading-relaxed text-xs">
                              <blockquote className="italic text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed border-l-2 border-indigo-500 pl-3.5 my-auto">
                                "{selectedSkill.evidence}"
                              </blockquote>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-right mt-4 italic border-t border-slate-100 dark:border-slate-800/60 pt-2 shrink-0 select-none">
                                citations matched using offline sentence embeddings.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
