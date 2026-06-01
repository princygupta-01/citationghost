import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Search, Activity, Verified, AlertTriangle, ShieldAlert,
  SlidersHorizontal, CheckCircle, HelpCircle, ArrowRightLeft, User, Bell, Settings,
  Map, HelpCircle as HelpIcon, Sparkles, Filter, ChevronRight, Info, BookOpen, AlertCircle,
  Trash2, Lock
} from 'lucide-react';
import { CitationLog, AlertItem, ScanReport } from '../types';

interface ScanResultsProps {
  onNavigate: (screen: 'landing' | 'initiation' | 'results', transition: 'push' | 'push_back' | 'slide_up' | 'none') => void;
  activeReport: ScanReport | null;
  reports: ScanReport[];
  onSelectReport: (report: ScanReport) => void;
  onDeleteReport: (id: string) => void;
  onClearHistory: () => void;
}

export default function ScanResults({ 
  onNavigate, 
  activeReport,
  reports,
  onSelectReport,
  onDeleteReport,
  onClearHistory
}: ScanResultsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [citationFilter, setCitationFilter] = useState<'ALL' | 'PROBLEMS' | 'VERIFIED'>('PROBLEMS'); // Default to PROBLEMS ONLY
  const [showAuditDetails, setShowAuditDetails] = useState(false);
  
  // Safe getters from report
  const currentFileName = activeReport?.fileName || 'Research_Paper_Final.pdf';
  const currentPaperTitle = activeReport?.paperTitle || 'The Neural Architectures of Decoders';
  const originalLogs = activeReport?.citations ?? [
    { id: '#42', title: 'Neural Architectures in Citation Verification', journal: 'Journal of Computational Neurodynamics, 2024', status: 'Fabricated Citation', score: 12 },
    { id: '#01', title: 'Attention Is All You Need', journal: 'NIPS Proceedings, 217', status: 'Verified', score: 98 },
    { id: '#12', title: 'Probabilistic Graphical Models for Biology', journal: 'Oxford BioPress, 221', status: 'Weak Evidence', score: 45 },
    { id: '#09', title: 'Generative Models in High Energy Physics', journal: 'Physical Review Letters, 223', status: 'Verified', score: 92 },
  ];
  const displayLogs = originalLogs.map(normalizeCitationLog);
  const derivedCounts = countCitationStatuses(displayLogs);
  const currentScore = activeReport ? computeIntegrityScore(derivedCounts) : 94.8;
  const currentVerified = activeReport ? derivedCounts.verified : 142;
  const currentWeak = activeReport ? derivedCounts.weak : 12;
  const currentUnverified = activeReport ? derivedCounts.unverified : 0;
  const currentContradicted = activeReport ? derivedCounts.contradicted : 0;
  const currentFabricated = activeReport ? derivedCounts.fabricated : 3;
  const currentDoiVerified = activeReport ? derivedCounts.doiVerified : 0;
  const currentInvalidMatch = activeReport ? derivedCounts.invalidMatch : 0;
  const currentNonCitation = activeReport ? derivedCounts.nonCitation : 0;
  const currentConfidenceIndex = activeReport?.confidenceIndex ?? 99.2;
  const currentProcessingTime = activeReport?.processingTime ?? 1.4;

  const alerts = activeReport ? ghostAlerts(displayLogs) : [
    { id: '1', title: 'Missing DOI for Ref #42', description: 'The source URL returns a 44. Identity could not be verified.', severity: 'high' },
    { id: '2', title: 'Source Contradiction in Section 3.1', description: 'Claimed result "p < 1.05" differs from actual source "p = 0.08".', severity: 'medium' },
    { id: '3', title: 'Fabricated Author Attribution', description: '"Dr. Silas Vance" has no publication record for the cited journal.', severity: 'high' }
  ];

  const defaultNode = displayLogs.find(l => l.status === 'Fabricated Citation' || l.status === 'Contradicted') || displayLogs[0];
  const [activeMapNode, setActiveMapNode] = useState<{ id: string; name: string; corr: string; status: string }>({
    id: defaultNode ? defaultNode.id : 'RF_42_SEC3',
    name: defaultNode ? `${defaultNode.id} - ${defaultNode.title}` : 'Ref #42 - GHOST (LLM Hallucination)',
    corr: defaultNode ? `${defaultNode.score.toFixed(2)}% (${defaultNode.status})` : '0.00% (NULL)',
    status: defaultNode ? defaultNode.status : 'Fabricated Citation'
  });

  useEffect(() => {
    const normalizedLogs = originalLogs.map(normalizeCitationLog);
    const node = normalizedLogs.find(l => l.status === 'Fabricated Citation' || l.status === 'Contradicted') || normalizedLogs[0];
    if (node) {
      setActiveMapNode({
        id: node.id,
        name: `${node.id} - ${node.title}`,
        corr: `${node.score.toFixed(2)}% (${node.status})`,
        status: node.status
      });
    }
  }, [activeReport]);

  const filteredLogs = displayLogs
    .filter(log => citationFilter === 'ALL' || (citationFilter === 'PROBLEMS' ? log.status !== 'Verified' && log.status !== 'DOI Verified' : (log.status === 'Verified' || log.status === 'DOI Verified')))
    .filter(log => 
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.journal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleMapNodeClick = (id: string, name: string, corr: string, status: string) => {
    setActiveMapNode({ id, name, corr, status });
  };

  const openProofModal = (log: CitationLog) => {
    setSelectedProof(log);
  };

  // Selected proof modal
  const [selectedProof, setSelectedProof] = useState<CitationLog | null>(null);

  return (
    <div className="min-h-screen bg-[#050816] text-[#fbdae1] font-sans overflow-x-hidden relative">
      
      {/* Sidebar navigation panel */}
      <nav className="bg-[#1f0e13] h-screen w-64 fixed left-0 top-0 border-r border-white/5 backdrop-blur-xl flex flex-col justify-between py-6 px-4 z-50">
        <div className="space-y-10">
          <div className="px-4 cursor-pointer" onClick={() => onNavigate('landing', 'push_back')}>
            {/* Logo matching spec */}
            <h1 className="text-xl font-extrabold tracking-tight font-plus-jakarta bg-gradient-to-r from-white via-primary-fixed to-on-surface bg-clip-text text-transparent">
              CitationGhost
            </h1>
            <p className="text-[10px] font-subheadline uppercase tracking-[0.2em] text-gray-500 mt-1">Forensic Analyst</p>
          </div>

          <div className="space-y-1.5">
            <a 
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-gray-400 hover:text-[#ffb1c4] hover:bg-white/5 font-semibold text-sm uppercase tracking-wider transition-all" 
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate('initiation', 'none'); }}
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span className="font-body-md">Dashboard</span>
            </a>
            
            <a 
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-primary font-bold border-r-4 border-primary bg-primary/10 transition-colors" 
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate('results', 'none'); }}
            >
              <span className="material-symbols-outlined text-[18px]">format_quote</span>
              <span className="font-body-md">Citations</span>
            </a>
          </div>
        </div>

        {/* User profile bottom item */}
        <div className="pt-6 border-t border-white/5 flex items-center gap-3.5 px-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 overflow-hidden border border-primary/30 shrink-0">
            <div className="w-full h-full bg-gradient-to-tr from-[#ff4a8d] to-secondary flex items-center justify-center font-extrabold text-xs text-white">
              AT
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-wide">Dr. Aris Thorne</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Senior Auditor</span>
          </div>
        </div>
      </nav>

      {/* Main layout container right of sidebar */}
      <main className="ml-64 min-h-screen">
        
        {/* Top Header Bar */}
        <header className="fixed top-0 right-0 left-64 h-16 bg-[#050816]/75 border-b border-white/5 backdrop-blur-md flex justify-between items-center px-10 z-40">
          <div className="flex items-center gap-3.5">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <h2 className="text-sm font-extrabold text-[#ffb1c4] tracking-wide font-plus-jakarta uppercase">{currentFileName}</h2>
            {activeReport?.analysisMode && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                activeReport.analysisMode === 'REAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                activeReport.analysisMode === 'PARTIAL' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                activeReport.analysisMode === 'SIMULATED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {activeReport.analysisMode === 'REAL' ? '🟢 REAL ANALYSIS' : 
                 activeReport.analysisMode === 'PARTIAL' ? '🟡 REAL ANALYSIS (PARTIAL)' : 
                 activeReport.analysisMode === 'SIMULATED' ? '🎭 DEMO MODE' : 
                 '🔴 ANALYSIS FAILED'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button className="material-symbols-outlined text-gray-400 hover:text-primary hover:bg-white/5 p-2 rounded-full transition-all text-sm shrink-0">notifications</button>
              <button className="material-symbols-outlined text-gray-400 hover:text-primary hover:bg-white/5 p-2 rounded-full transition-all text-sm shrink-0">settings</button>
            </div>
            
            <button 
              onClick={() => setShowAuditDetails(true)}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all shrink-0"
            >
              Audit Details
            </button>
            
            {/* New Scan button explicitly triggering initiation with slide_up transition */}
            <button 
              onClick={() => onNavigate('initiation', 'slide_up')}
              className="bg-primary hover:scale-105 active:scale-95 text-dark px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest shadow-md shadow-primary/20 cursor-pointer transition-all shrink-0"
            >
              New Scan
            </button>
          </div>
        </header>

        {/* Content workspace area */}
        <div className="pt-24 px-10 pb-16 space-y-8 max-w-7xl mx-auto">
          
          {/* Top Row: Score Chart meter & Metric Cards */}
          <div className="grid grid-cols-12 gap-6 items-stretch">
            
            {/* Left Score Summary details card */}
            <div className="col-span-12 lg:col-span-5 glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 blur-[50px] rounded-full" />
              <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6">Scan Results Summary</h3>
              
              <div className="relative flex items-center justify-center py-4">
                {/* SVG circular progress representation */}
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle cx="96" cy="96" fill="transparent" r="82" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                  <circle 
                    cx="96" 
                    cy="96" 
                    fill="transparent" 
                    r="82" 
                    stroke="url(#neonGradientPink)" 
                    strokeDasharray="515" 
                    strokeDashoffset={515 * (1 - currentScore / 100)}
                    strokeLinecap="round" 
                    strokeWidth="11" 
                    className="glow-text-pink animate-pulse"
                  />
                  <defs>
                    <linearGradient id="neonGradientPink" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffb1c4" />
                      <stop offset="100%" stopColor="#ff4a8d" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4.5xl font-extrabold text-white leading-none glow-text-pink font-plus-jakarta">{currentScore.toFixed(1)}<span className="text-xl text-primary">%</span></span>
                  <span
                    className="text-[10px] font-bold text-primary tracking-widest mt-2 uppercase cursor-help"
                    title="Higher score = more citation integrity issues detected"
                  >
                    Integrity Score
                  </span>
                </div>
              </div>

              {/* Confidence processing stats indices */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Confidence Index</p>
                  <p className="text-base font-bold text-white tracking-wide">{currentConfidenceIndex.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Processing Time</p>
                  <p className="text-base font-bold text-white tracking-wide">{currentProcessingTime.toFixed(1)}s</p>
                </div>
              </div>
            </div>

            {/* Right: Metrics counters and Alerts Feed log */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
              
              <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
                {/* Verified count card */}
                <div className="glass-panel rounded-2xl p-4 text-center border-b-[3px] border-emerald-500/30">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white font-plus-jakarta">{currentVerified}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Verified</p>
                </div>

                {/* Weak count card */}
                <div className="glass-panel rounded-2xl p-4 text-center border-b-[3px] border-secondary/35">
                  <AlertCircle className="w-5 h-5 text-[#d1bcff] mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white font-plus-jakarta">{currentWeak}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Weak Evidence</p>
                </div>

                {/* Unverified count card */}
                <div className="glass-panel rounded-2xl p-4 text-center border-b-[3px] border-sky-500/30">
                  <HelpCircle className="w-5 h-5 text-sky-300 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white font-plus-jakarta">{currentUnverified}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Unverified</p>
                </div>

                {/* Contradicted count card */}
                <div className="glass-panel rounded-2xl p-4 text-center border-b-[3px] border-red-500/35">
                  <ArrowRightLeft className="w-5 h-5 text-red-300 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white font-plus-jakarta">{currentContradicted}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Contradicted</p>
                </div>

                {/* Fabricated count card */}
                <div className="glass-panel rounded-2xl p-4 text-center border-b-[3px] border-primary-container/30">
                  <ShieldAlert className="w-5 h-5 text-primary mx-auto mb-1 pulsing-hallucination" />
                  <p className="text-2xl font-bold text-white font-plus-jakarta">{currentFabricated}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Fabricated</p>
                </div>

                {/* DOI Verified count card */}
                <div className="glass-panel rounded-2xl p-4 text-center border-b-[3px] border-teal-500/30">
                  <CheckCircle className="w-5 h-5 text-teal-300 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white font-plus-jakarta">{currentDoiVerified}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">DOI Verified</p>
                </div>

                {/* Invalid Match count card */}
                <div className="glass-panel rounded-2xl p-4 text-center border-b-[3px] border-orange-500/30">
                  <AlertTriangle className="w-5 h-5 text-orange-300 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white font-plus-jakarta">{currentInvalidMatch}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Invalid Match</p>
                </div>

                {/* Non-Citation count card */}
                <div className="glass-panel rounded-2xl p-4 text-center border-b-[3px] border-gray-500/30">
                  <FileText className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white font-plus-jakarta">{currentNonCitation}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Non-Citation</p>
                </div>
              </div>

              {/* Critical alerts item list */}
              <div className="glass-panel rounded-2xl p-6 flex-grow flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#ffb1c4]">Critical Integrity Alerts</h3>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded uppercase tracking-wider">Action Required</span>
                </div>

                <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                  {alerts.length > 0 ? alerts.map((al) => (
                    <div 
                      key={al.id}
                      onClick={() => {
                        // Locate matching log in forensics and trigger its modal
                        const match = displayLogs.find(l => l.id === al.id || l.id === `#${al.title.match(/\d+/)?.[0]}`);
                        if (match) setSelectedProof(match);
                      }}
                      className="p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-primary/20 hover:bg-white/5 transition-all flex items-center gap-3.5 cursor-pointer group"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${al.severity === 'high' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">{al.title}</p>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">{al.description}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-white transition-all shrink-0" />
                    </div>
                  )) : (
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5 text-xs text-gray-500">
                      No ghost citations detected.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Interactive SVG Citation Network Map Section */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-6 left-6 z-10 space-y-2">
              <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400">Citation Network Map</h3>
              
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#7B2BF9]" />
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Weak Evidence</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary pulsing-hallucination" />
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Fabricated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_#14b8a6]" />
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">DOI Verified</span>
                </div>
              </div>
            </div>

            {/* Neural Map Canvas Representation */}
            <div className="w-full h-80 rounded-xl relative bg-[#020407] overflow-hidden border border-white/5">
              
              {/* Interactive nodes SVG overlay */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Visual linking lines representing connections in visual mapping */}
                <line x1="120" y1="180" x2="280" y2="100" stroke="#10b981" strokeWidth="1" opacity="0.3" />
                <line x1="280" y1="100" x2="420" y2="210" stroke="#7B2BF9" strokeWidth="1" opacity="0.4" />
                <line x1="420" y1="210" x2="650" y2="90" stroke="#ff4a8d" strokeWidth="1.5" className="pulsing-hallucination" />
                <line x1="650" y1="90" x2="520" y2="240" stroke="#ff4a8d" strokeWidth="1.2" opacity="0.5" />
                <line x1="520" y1="240" x2="120" y2="180" stroke="#10b981" strokeWidth="1" opacity="0.2" />

                {/* Nodes rendering matching schematic with interactive triggers */}
                {/* Ref #01 - Verified (Green) */}
                <g 
                  onClick={() => handleMapNodeClick('RF_01', 'Attention Is All You Need', '98.00% (HIGH)', 'Verified')} 
                  className="cursor-pointer group"
                >
                  <circle cx="120" cy="180" r={activeMapNode.id === 'RF_01' ? '12' : '8'} fill="#10b981" className="transition-all hover:scale-125" />
                  <text x="120" y="205" fill="white" fontSize="9" textAnchor="middle" opacity="0.7">Ref #01</text>
                </g>

                {/* Ref #04 - Weak (Indigo) */}
                <g 
                  onClick={() => handleMapNodeClick('RF_04', 'Probabilistic Networks Graph', '45.10% (MED)', 'Weak Evidence')} 
                  className="cursor-pointer group"
                >
                  <circle cx="280" cy="100" r={activeMapNode.id === 'RF_04' ? '12' : '8'} fill="#a78bfa" />
                  <text x="280" y="85" fill="white" fontSize="9" textAnchor="middle" opacity="0.7">Ref #04</text>
                </g>

                {/* Core Source - Verified (Green) */}
                <g 
                  onClick={() => handleMapNodeClick('CORE_SRC', 'Core Document Manuscript', '100% (SOURCE)', 'Verified')} 
                  className="cursor-pointer group"
                >
                  <circle cx="420" cy="210" r={activeMapNode.id === 'CORE_SRC' ? '14' : '10'} fill="#10b981" />
                  <text x="420" y="235" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" opacity="0.8">Core Source</text>
                </g>

                {/* Ref #42 - GHOST (Red pulsing) */}
                <g 
                  onClick={() => handleMapNodeClick('RF_42_SEC3', 'Neural Architectures in LLM', '0.00% (NULL)', 'Fabricated Citation')} 
                  className="cursor-pointer pulsing-hallucination"
                >
                  <circle cx="650" cy="90" r={activeMapNode.id === 'RF_42_SEC3' ? '16' : '12'} fill="#e11d48" />
                  <text x="650" y="65" fill="#f43f5e" fontSize="10" fontWeight="extrabold" textAnchor="middle">REF #42 - GHOST</text>
                </g>

                {/* Ref #09 - Weak (Indigo) */}
                <g 
                  onClick={() => handleMapNodeClick('RF_09', 'Generative Models Physics', '92% (HIGH)', 'Verified')} 
                  className="cursor-pointer group"
                >
                  <circle cx="520" cy="240" r={activeMapNode.id === 'RF_09' ? '11' : '8'} fill="#a78bfa" />
                  <text x="520" y="260" fill="white" fontSize="9" textAnchor="middle" opacity="0.7">Ref #09</text>
                </g>
              </svg>

              {/* Map Legend HUD Panel Card at bottom right */}
              <div className="absolute bottom-4 right-4 glass px-4 py-3 rounded-xl border border-white/5 text-xs flex flex-col gap-1.5 max-w-[280px]">
                <div className="flex justify-between items-center gap-8">
                  <span className="text-gray-500 uppercase tracking-wider text-[9px] font-bold">Active Node</span>
                  <span className="text-white font-extrabold truncate">{activeMapNode.id}</span>
                </div>
                <div className="flex justify-between items-center gap-8">
                  <span className="text-gray-500 uppercase tracking-wider text-[9px] font-bold flex items-center gap-1">Name <Info className="w-2.5 h-2.5" /></span>
                  <span className="text-gray-300 truncate max-w-[140px] font-light">{activeMapNode.name}</span>
                </div>
                <div className="flex justify-between items-center gap-8 border-t border-white/5 pt-1.5 mt-1">
                  <span className="text-gray-500 uppercase tracking-wider text-[9px] font-bold">CROSS-CORR</span>
                  <span className={`font-bold ${activeMapNode.status === 'Fabricated Citation' || activeMapNode.status === 'Contradicted' ? 'text-primary' : 'text-emerald-400'}`}>{activeMapNode.corr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Forensic Log detailed list table */}
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#ffb1c4]">Reference Forensic Log</h3>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="flex rounded-full border border-white/10 bg-black/30 p-1">
                  {(['ALL', 'PROBLEMS', 'VERIFIED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setCitationFilter(filter)}
                      className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all ${
                        citationFilter === filter ? 'bg-primary text-dark' : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      {filter === 'PROBLEMS' ? 'Problems Only' : filter}
                    </button>
                  ))}
                </div>
                <div className="relative flex-grow sm:flex-grow-0">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter sources..."
                    className="w-full sm:w-64 bg-black/40 border border-white/10 text-xs py-2 pl-9 pr-4 rounded-full focus:outline-none focus:border-primary transition-all placeholder:text-gray-600"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                </div>
                
                <button className="bg-white/5 border border-white/10 p-2 rounded-full cursor-pointer hover:bg-white/10 text-gray-400 hover:text-white shrink-0">
                  <Filter className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Forensics Table component */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="pb-3 px-3">ID</th>
                    <th className="pb-3 px-3">Reference Title</th>
                    <th className="pb-3 px-3">Integrity Status</th>
                    <th className="pb-3 px-3">Evidence Score</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                      <td className="py-4.5 px-3 font-semibold text-gray-400">{log.id}</td>
                      <td className="py-4.5 px-3">
                        <div className="flex flex-col">
                          <span className="text-white font-bold group-hover:text-primary transition-colors">{log.title}</span>
                          <span className="text-[10px] text-gray-500 italic mt-0.5">{log.journal}</span>
                        </div>
                      </td>
                      <td className="py-4.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          statusBadgeClass(log.status)
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-4.5 px-3">
                        <div className="w-28 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${
                            statusBarClass(log.status)
                          }`} style={{ width: `${log.score}%` }} />
                        </div>
                      </td>
                      <td className="py-4.5 px-3 text-right">
                        <button 
                          onClick={() => openProofModal(log)}
                          className="text-primary hover:glow-text-pink text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:underline"
                        >
                          View Proof
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-600 font-light">
                        No forensic citations logged matching your query query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Scan Reports History */}
          <div className="glass-panel rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">history</span>
                <span className="text-xs font-bold uppercase tracking-widest text-[#ffb1c4]">Recent Scan Reports History</span>
              </div>
              {reports && reports.length > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onClearHistory(); }}
                  className="text-[10px] text-gray-500 hover:text-primary uppercase tracking-wider font-bold transition-all cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>

            {(!reports || reports.length === 0) ? (
              <div className="py-8 text-center text-gray-500 font-light text-xs">
                No recent scans are tracked. Drop a manuscript in the Dashboard to initiate your first forensic scan!
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => {
                  const isActive = activeReport?.id === report.id;
                  return (
                    <div 
                      key={report.id}
                      onClick={() => {
                        onSelectReport(report);
                        onNavigate('results', 'push');
                      }}
                      className={`relative overflow-hidden group rounded-2xl border p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-44 ${
                        isActive 
                          ? 'bg-[#1b0a0e] border-[#ff4a8d]/40 shadow-[0_0_20px_rgba(255,74,141,0.1)]' 
                          : 'bg-[#0f0b15]/60 hover:bg-white/[0.02] border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Top Row: File Name & Trash Button */}
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-2 text-white group-hover:text-[#ffb1c4] transition-colors min-w-0">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-bold text-xs truncate">{report.fileName}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteReport(report.id);
                            }}
                            className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                            title="Delete scan from history"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <p className="text-[10px] text-gray-500 mt-1 truncate" title={report.paperTitle}>
                          {report.paperTitle}
                        </p>
                        <p className="text-[9px] text-gray-600 mt-0.5">{report.date}</p>
                      </div>

                      {/* Bottom Row: Score and metrics pills */}
                      <div className="pt-4 border-t border-white/5 flex justify-between items-center gap-2">
                        <div className="flex flex-col">
                          <span className="text-[8px] uppercase font-bold text-gray-500 tracking-wider">Integrity Score</span>
                          <span className={`text-sm font-extrabold font-plus-jakarta ${
                            report.score === 100.0 ? 'text-emerald-400' : report.score < 80 ? 'text-primary' : 'text-[#ffb1c4]'
                          }`}>
                            {report.score.toFixed(1)}%
                          </span>
                        </div>

                        {/* Counts Pills */}
                        <div className="flex items-center gap-1.5 text-[8px] font-bold">
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded border-dashed">
                            {report.verifiedCount}V
                          </span>
                          {report.weakCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-[#7000ff]/10 text-secondary border border-[#7000ff]/20 rounded border-dashed">
                              {report.weakCount}W
                            </span>
                          )}
                          {report.hallucinatedCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded animate-pulse">
                              {report.hallucinatedCount}G
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Proof Modal Popup Box with forensic evidence */}
      <AnimatePresence>
        {selectedProof && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProof(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-0 m-auto max-w-3xl h-max max-h-[88vh] overflow-y-auto bg-[#160b0e] border border-white/10 z-50 rounded-2xl p-6 flex flex-col justify-between shadow-2xl"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary">{selectedProof.id} Forensic Proof Ledger</h2>
                    <p className="text-[10px] text-gray-500 uppercase mt-0.5">Encrypted security cross-reference hash 3ea-20bc</p>
                  </div>
                  <button 
                    onClick={() => setSelectedProof(null)}
                    className="text-gray-500 hover:text-white px-2 py-1 leading-none rounded hover:bg-white/5"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 bg-black/35 rounded-xl border border-white/5 space-y-2">
                  <h4 className="text-white font-bold text-sm tracking-tight">{selectedProof.title}</h4>
                  <p className="text-xs text-[#ffb1c4] italic">{authorYear(selectedProof.authors, selectedProof.year) || 'Author data unavailable'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-light">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Index Correlation Score</p>
                    <p className={`font-mono font-bold text-sm ${selectedProof.status === 'Fabricated Citation' ? 'text-primary' : 'text-emerald-400'}`}>
                      {selectedProof.score}% matches
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">DOI Status Registry</p>
                    <p className="text-white font-medium">
                      {doiStatusLabel(selectedProof)}
                    </p>
                  </div>
                </div>

                {selectedProof.crossref_match && (
                  <div className="p-4 bg-white/[0.03] rounded-lg border border-white/10 space-y-2 text-xs">
                    <p className="text-[9px] text-[#ffb1c4] uppercase font-bold tracking-wider">CrossRef Match Proof</p>
                    <p className="text-gray-300"><span className="text-gray-500">Extracted:</span> {truncateText(selectedProof.crossref_match.extracted, 220)}</p>
                    <p className="text-gray-300"><span className="text-gray-500">CrossRef:</span> {selectedProof.crossref_match.crossref_title || 'No title returned'}</p>
                    <p className="text-white font-mono">{selectedProof.crossref_match.confidence ?? 0}% confidence</p>
                    <p className="text-gray-400">{selectedProof.crossref_match.reason}</p>
                  </div>
                )}

                <div className="text-xs text-gray-400 space-y-1 bg-white/[0.01] p-3 rounded-lg leading-relaxed border border-white/5">
                  <p className="font-bold text-gray-300">Context sentence:</p>
                  <p>
                    {selectedProof.claim || selectedProof.reason || proofFallbackNote(selectedProof)}
                  </p>
                </div>

                {hasVerification(selectedProof) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowRightLeft className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Claim vs. Source Comparison</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/15">
                        <p className="text-[9px] text-primary uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                          What the paper claims:
                        </p>
                        <p className="text-gray-200 leading-relaxed font-medium">
                          {selectedProof.claim || 'No specific claim extracted'}
                        </p>
                      </div>
                      <div className="p-4 bg-white/[0.03] rounded-lg border border-white/10">
                        <p className="text-[9px] text-[#ffb1c4] uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                          <span className="w-2 h-2 bg-[#ffb1c4] rounded-full"></span>
                          What the source actually says:
                        </p>
                        <p className="text-gray-200 leading-relaxed font-medium">
                          {truncateText(selectedProof.abstract || selectedProof.reason || 'Abstract not available', 300)}
                        </p>
                      </div>
                    </div>
                    {selectedProof.verification?.quote && (
                      <div className={`p-4 rounded-lg bg-black/25 border border-white/10 border-l-4 ${evidenceQuoteClass(selectedProof)}`}>
                        <p className="text-[9px] uppercase tracking-widest font-extrabold text-gray-300 mb-2">📌 KEY EVIDENCE:</p>
                        <blockquote className="text-sm text-gray-100 leading-relaxed font-medium">
                          "{selectedProof.verification.quote}"
                        </blockquote>
                      </div>
                    )}
                    <div className="p-3 bg-white/[0.03] rounded-lg border border-white/10 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${verdictClass(selectedProof)}`}>
                          {verdictIcon(selectedProof)}
                          {verificationVerdict(selectedProof)}
                        </span>
                        <div className="min-w-[180px] flex-1 sm:flex-none">
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Confidence</span>
                            <span className="text-[10px] text-white font-mono font-bold">{verificationConfidence(selectedProof)}% confidence</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${confidenceBarClass(selectedProof)}`}
                              style={{ width: `${verificationConfidence(selectedProof)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {selectedProof.verification?.explanation || selectedProof.reason || proofFallbackNote(selectedProof)}
                      </p>
                    </div>
                    {['CONTRADICTS', 'OVERSTATED'].includes(verificationVerdict(selectedProof)) && (
                      <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                        <p className="text-xs text-red-400 font-bold">Critical issue: the source content contradicts or overstates the claim made in the paper.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 justify-end border-t border-white/5">
                <button 
                  onClick={() => setSelectedProof(null)}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-[10px] rounded-lg text-white uppercase tracking-wider cursor-pointer"
                >
                  Close Proof
                </button>
                <button 
                  onClick={() => { setSelectedProof(null); onNavigate('initiation', 'none'); }}
                  className="px-4 py-2 bg-primary text-dark font-bold text-[10px] rounded-lg uppercase tracking-wider cursor-pointer hover:scale-103"
                >
                  New Scan
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Diagnostics Panel Modal */}
      <AnimatePresence>
        {showAuditDetails && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuditDetails(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-0 m-auto max-w-2xl h-max max-h-[80vh] overflow-y-auto bg-[#160b0e] border border-white/10 z-50 rounded-2xl p-8 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold uppercase tracking-widest text-primary font-plus-jakarta">Diagnostics Panel</h2>
                  <p className="text-xs text-gray-500 uppercase mt-1">System Health & Metrics</p>
                </div>
                <button 
                  onClick={() => setShowAuditDetails(false)}
                  className="text-gray-500 hover:text-white px-2 py-1 leading-none rounded hover:bg-white/5 text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-bold">Groq Engine</p>
                    <p className={`text-sm font-bold ${activeReport?.groqStatus === 'ERROR' ? 'text-primary' : 'text-emerald-400'}`}>
                      {activeReport?.groqStatus || 'OK'}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-bold">CrossRef API</p>
                    <p className={`text-sm font-bold ${activeReport?.crossrefStatus === 'ERROR' ? 'text-primary' : 'text-emerald-400'}`}>
                      {activeReport?.crossrefStatus || 'OK'}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-bold">Semantic Scholar</p>
                    <p className={`text-sm font-bold ${activeReport?.semanticScholarStatus === 'ERROR' ? 'text-primary' : 'text-emerald-400'}`}>
                      {activeReport?.semanticScholarStatus || 'OK'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-black/30 rounded-xl border border-white/5 text-center">
                    <p className="text-xl font-bold text-white font-mono">{activeReport?.totalExtracted || 0}</p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Extracted</p>
                  </div>
                  <div className="p-4 bg-black/30 rounded-xl border border-white/5 text-center">
                    <p className="text-xl font-bold text-white font-mono">{activeReport?.totalResolved || 0}</p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Resolved</p>
                  </div>
                  <div className="p-4 bg-black/30 rounded-xl border border-white/5 text-center">
                    <p className="text-xl font-bold text-white font-mono">{currentVerified}</p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Verified</p>
                  </div>
                  <div className="p-4 bg-black/30 rounded-xl border border-white/5 text-center">
                    <p className="text-xl font-bold text-white font-mono">{currentProcessingTime.toFixed(1)}s</p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Processing</p>
                  </div>
                </div>

                {/* Match Quality Summary Report */}
                <div className="p-5 bg-black/30 rounded-xl border border-white/5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#ffb1c4]">Match Quality Report</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 bg-white/5 rounded-lg text-center">
                      <p className="text-lg font-bold text-white font-mono">{activeReport?.totalExtracted || displayLogs.length}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Total Extracted</p>
                    </div>
                    <div className="p-3 bg-emerald-500/5 rounded-lg text-center border border-emerald-500/10">
                      <p className="text-lg font-bold text-emerald-400 font-mono">{displayLogs.filter(l => l.accepted_match === true || l.status === 'Verified' || l.status === 'DOI Verified').length}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Accepted</p>
                    </div>
                    <div className="p-3 bg-orange-500/5 rounded-lg text-center border border-orange-500/10">
                      <p className="text-lg font-bold text-orange-300 font-mono">{derivedCounts.invalidMatch}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Invalid Match</p>
                    </div>
                    <div className="p-3 bg-gray-500/5 rounded-lg text-center border border-gray-500/10">
                      <p className="text-lg font-bold text-gray-400 font-mono">{derivedCounts.nonCitation}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Non-Citation</p>
                    </div>
                  </div>

                  {/* Per-citation debug fields table */}
                  <div className="overflow-x-auto max-h-[240px] overflow-y-auto">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider font-bold">
                          <th className="pb-2 px-2">ID</th>
                          <th className="pb-2 px-2">Extracted Title</th>
                          <th className="pb-2 px-2">CrossRef Title</th>
                          <th className="pb-2 px-2">Similarity</th>
                          <th className="pb-2 px-2">Accepted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayLogs.map(log => (
                          <tr key={`diag-${log.id}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="py-2 px-2 text-gray-400 font-mono">{log.id}</td>
                            <td className="py-2 px-2 text-gray-300 max-w-[160px] truncate" title={log.extracted_title || log.title || ''}>{log.extracted_title || log.title || '—'}</td>
                            <td className="py-2 px-2 text-gray-300 max-w-[160px] truncate" title={log.crossref_title || ''}>{log.crossref_title || '—'}</td>
                            <td className="py-2 px-2 font-mono font-bold">
                              <span className={log.title_similarity != null ? (log.title_similarity >= 0.85 ? 'text-emerald-400' : log.title_similarity >= 0.75 ? 'text-yellow-300' : 'text-red-400') : 'text-gray-600'}>
                                {log.title_similarity != null ? log.title_similarity.toFixed(3) : '—'}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              {log.accepted_match === true ? <span className="text-emerald-400 font-bold">✓</span> : log.accepted_match === false ? <span className="text-red-400 font-bold">✕</span> : <span className="text-gray-600">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

type DisplayStatus = 'Verified' | 'Weak Evidence' | 'Unverified' | 'Contradicted' | 'Fabricated Citation' | 'DOI Verified' | 'Invalid Match' | 'Non-Citation';

function normalizeCitationLog(log: CitationLog): CitationLog & { title: string; journal: string; status: DisplayStatus } {
  const status = normalizeStatus(log.status);
  const title = firstDisplayValue(log.title, log.reference, log.id);
  const journal = authorYear(log.authors, log.year) || 'Author data unavailable';
  const score = Math.max(0, Math.min(100, log.verification?.confidence ?? log.score ?? 0));

  return {
    ...log,
    title,
    journal,
    status,
    score,
  };
}

function hasVerification(proof: CitationLog): boolean {
  return Boolean(proof.verification || proof.verdict || (proof.claim && (proof.abstract || proof.reason)));
}

function verificationVerdict(proof: CitationLog): string {
  return String(proof.verification?.verdict || proof.verdict || proof.status || 'UNVERIFIED').toUpperCase();
}

function verdictClass(proof: CitationLog): string {
  const verdict = verificationVerdict(proof);
  if (verdict === 'SUPPORTS' || verdict === 'VERIFIED') {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }
  if (verdict === 'OVERSTATED' || verdict === 'WEAK EVIDENCE') {
    return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  }
  if (verdict === 'UNVERIFIED' || verdict === 'UNRELATED') {
    return 'bg-gray-500/10 text-gray-300 border-gray-500/20';
  }
  if (verdict === 'DOI VERIFIED' || verdict === 'DOI_VERIFIED') {
    return 'bg-teal-500/10 text-teal-300 border-teal-500/20';
  }
  if (verdict === 'INVALID MATCH' || verdict === 'INVALID_MATCH') {
    return 'bg-orange-500/10 text-orange-300 border-orange-500/20';
  }
  return 'bg-red-500/10 text-red-300 border-red-500/20';
}

function verdictIcon(proof: CitationLog): string {
  const verdict = verificationVerdict(proof);
  if (verdict === 'SUPPORTS' || verdict === 'VERIFIED') {
    return '✓';
  }
  if (verdict === 'OVERSTATED' || verdict === 'WEAK EVIDENCE') {
    return '⚠';
  }
  if (verdict === 'UNVERIFIED' || verdict === 'UNRELATED') {
    return '?';
  }
  if (verdict === 'DOI VERIFIED' || verdict === 'DOI_VERIFIED') {
    return '🔗';
  }
  if (verdict === 'INVALID MATCH' || verdict === 'INVALID_MATCH') {
    return '✕';
  }
  return '✕';
}

function evidenceQuoteClass(proof: CitationLog): string {
  const verdict = verificationVerdict(proof);
  if (verdict === 'SUPPORTS' || verdict === 'VERIFIED') {
    return 'border-l-emerald-400';
  }
  if (verdict === 'OVERSTATED' || verdict === 'WEAK EVIDENCE') {
    return 'border-l-amber-300';
  }
  if (verdict === 'UNVERIFIED' || verdict === 'UNRELATED') {
    return 'border-l-gray-400';
  }
  if (verdict === 'DOI VERIFIED' || verdict === 'DOI_VERIFIED') {
    return 'border-l-teal-400';
  }
  return 'border-l-red-400';
}

function verificationConfidence(proof: CitationLog): number {
  return Math.max(0, Math.min(100, Math.round(proof.verification?.confidence ?? proof.score ?? 0)));
}

function confidenceBarClass(proof: CitationLog): string {
  const verdict = verificationVerdict(proof);
  if (verdict === 'SUPPORTS' || verdict === 'VERIFIED') {
    return 'bg-emerald-400';
  }
  if (verdict === 'OVERSTATED' || verdict === 'WEAK EVIDENCE') {
    return 'bg-amber-300';
  }
  if (verdict === 'UNVERIFIED' || verdict === 'UNRELATED') {
    return 'bg-gray-400';
  }
  if (verdict === 'DOI VERIFIED' || verdict === 'DOI_VERIFIED') {
    return 'bg-teal-400';
  }
  return 'bg-red-400';
}

function truncateText(value?: string | null, limit = 300): string {
  const text = String(value ?? '').trim();
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit).trim()}...`;
}

function normalizeStatus(status: CitationLog['status']): DisplayStatus {
  const statusMap: Record<string, DisplayStatus> = {
    clean: 'Verified',
    suspect: 'Weak Evidence',
    ghost: 'Fabricated Citation',
    fraudulent: 'Contradicted',
    contradicted: 'Contradicted',
    unverified: 'Unverified',
    doi_verified: 'DOI Verified',
    invalid_match: 'Invalid Match',
    non_citation: 'Non-Citation',
    Verified: 'Verified',
    'Weak Evidence': 'Weak Evidence',
    Hallucinated: 'Fabricated Citation',
    'Fabricated Citation': 'Fabricated Citation',
    Contradicted: 'Contradicted',
    UNVERIFIED: 'Unverified',
    Unverified: 'Unverified',
    'DOI Verified': 'DOI Verified',
    'Invalid Match': 'Invalid Match',
    'Non-Citation': 'Non-Citation',
  };

  return statusMap[status] ?? 'Unverified';
}

function firstDisplayValue(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const cleaned = String(value ?? '').trim();
    if (cleaned && !['none', 'null', 'unknown', 'unknown academic venue'].includes(cleaned.toLowerCase())) {
      return cleaned;
    }
  }

  return 'Untitled reference';
}

function authorYear(authors?: string | null, year?: string | null): string | null {
  const cleanAuthors = cleanDisplayValue(authors);
  const cleanYear = cleanDisplayValue(year);
  if (cleanAuthors && cleanYear) {
    return `${cleanAuthors} \u00b7 ${cleanYear}`;
  }
  if (cleanAuthors) {
    return cleanAuthors;
  }
  return cleanYear;
}

function cleanDisplayValue(value?: string | null): string | null {
  const cleaned = String(value ?? '').trim();
  if (!cleaned || ['none', 'null', 'unknown', 'unknown academic venue'].includes(cleaned.toLowerCase())) {
    return null;
  }
  return cleaned;
}

function proofFallbackNote(proof: CitationLog): string {
  if (proof.status === 'Verified') {
    return 'The digital identifier has been confirmed against CrossRef indexes, and the claim matches with high validation confidence.';
  }
  if (proof.status === 'Weak Evidence') {
    return 'The publication exists, but cross-correlation checks indicate the cited line only weakly supports the claim.';
  }
  if (proof.status === 'Unverified') {
    return 'The publication metadata was found, but no usable abstract was available for claim verification.';
  }
  if (proof.status === 'Contradicted') {
    return 'The source exists, but the available source content contradicts how the paper cites it.';
  }
  if (proof.status === 'DOI Verified') {
    return '✓ DOI confirmed real via CrossRef. Abstract unavailable — claim support unverified.';
  }
  if (proof.status === 'Invalid Match') {
    return '✕ CrossRef returned a result with low title similarity. Match rejected — does not meet 0.75 threshold.';
  }
  if (proof.status === 'Non-Citation') {
    return 'This entry appears to be a figure, table, or structural reference, not an academic citation.';
  }
  return 'Critical citation integrity issue: this reference could not be verified against the available registries.';
}

function doiStatusLabel(proof: CitationLog): string {
  if (proof.doi_exists === false && !proof.doi) {
    return 'No DOI found in paper';
  }
  if (proof.doi_exists === false && proof.doi) {
    return 'DOI not in CrossRef';
  }
  if (proof.abstract_found === false || proof.sources?.semanticScholar === false) {
    return 'Abstract unavailable';
  }
  if (proof.doi_exists === true || proof.sources?.crossref || proof.doi) {
    return 'Registered with CrossRef';
  }
  return 'No DOI found in paper';
}

function countCitationStatuses(logs: Array<CitationLog & { status: DisplayStatus }>) {
  return {
    verified: logs.filter(log => log.status === 'Verified').length,
    weak: logs.filter(log => log.status === 'Weak Evidence').length,
    unverified: logs.filter(log => log.status === 'Unverified').length,
    contradicted: logs.filter(log => log.status === 'Contradicted').length,
    fabricated: logs.filter(log => log.status === 'Fabricated Citation').length,
    doiVerified: logs.filter(log => log.status === 'DOI Verified').length,
    invalidMatch: logs.filter(log => log.status === 'Invalid Match').length,
    nonCitation: logs.filter(log => log.status === 'Non-Citation').length,
  };
}

function computeIntegrityScore(counts: { verified: number; weak: number; unverified: number; contradicted: number; fabricated: number; doiVerified: number; invalidMatch: number; nonCitation: number }): number {
  const effectiveTotal = counts.verified + counts.weak + counts.unverified + counts.contradicted + counts.fabricated + counts.doiVerified;
  if (effectiveTotal === 0) {
    return 0;
  }
  const verifiedWeight = counts.verified + counts.doiVerified * 0.7;
  return Math.max(0, Math.min(100, (verifiedWeight / effectiveTotal) * 100));
}

function isCriticalCitation(log: CitationLog): boolean {
  const rawStatus = String(log.raw_status ?? '').toLowerCase();
  return rawStatus === 'ghost' || rawStatus === 'fraudulent' || rawStatus === 'contradicted' || rawStatus === 'invalid_match' || log.status === 'Fabricated Citation' || log.status === 'Contradicted' || log.status === 'Invalid Match';
}

function ghostAlerts(logs: Array<CitationLog & { title: string; journal: string; status: DisplayStatus }>): AlertItem[] {
  return logs.filter(isCriticalCitation).map(log => ({
    id: log.id,
    title: log.title,
    description: log.reason || `${log.id} could not be verified against the available citation records.`,
    severity: 'high',
  }));
}

function statusBadgeClass(status: DisplayStatus): string {
  if (status === 'Verified') {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }
  if (status === 'Weak Evidence') {
    return 'bg-[#7000ff]/10 text-secondary border-[#7000ff]/20';
  }
  if (status === 'Unverified') {
    return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
  }
  if (status === 'Contradicted') {
    return 'bg-red-500/10 text-red-300 border-red-500/20 animate-pulse';
  }
  if (status === 'DOI Verified') {
    return 'bg-teal-500/10 text-teal-300 border-teal-500/20';
  }
  if (status === 'Invalid Match') {
    return 'bg-orange-500/10 text-orange-300 border-orange-500/20';
  }
  if (status === 'Non-Citation') {
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
  return 'bg-primary/10 text-primary border-primary/20 animate-pulse';
}

function statusBarClass(status: DisplayStatus): string {
  if (status === 'Verified') {
    return 'bg-emerald-400';
  }
  if (status === 'Weak Evidence') {
    return 'bg-secondary';
  }
  if (status === 'Unverified') {
    return 'bg-sky-300';
  }
  if (status === 'Contradicted') {
    return 'bg-red-300';
  }
  if (status === 'DOI Verified') {
    return 'bg-teal-400';
  }
  if (status === 'Invalid Match') {
    return 'bg-orange-300';
  }
  if (status === 'Non-Citation') {
    return 'bg-gray-400';
  }
  return 'bg-primary';
}
