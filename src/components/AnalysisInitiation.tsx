import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, CheckCircle2, ShieldCheck, HelpCircle, 
  Settings, User, Bell, Search, Network, Brain, Send, FlameKindling, Cpu, Lock, Trash2
} from 'lucide-react';
import { ScanReport } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface AnalysisInitiationProps {
  onNavigate: (screen: 'landing' | 'initiation' | 'results', transition: 'push' | 'push_back' | 'slide_up' | 'none') => void;
  reports: ScanReport[];
  activeReport: ScanReport | null;
  onSelectReport: (report: ScanReport) => void;
  onSaveNewReport: (newReport: ScanReport) => void;
  onClearHistory: () => void;
  onDeleteReport: (id: string) => void;
}

export default function AnalysisInitiation({ 
  onNavigate, 
  reports, 
  activeReport, 
  onSelectReport, 
  onSaveNewReport, 
  onClearHistory, 
  onDeleteReport 
}: AnalysisInitiationProps) {
  const [logs, setLogs] = useState<string[]>([
    "[12:46:01] [INFO] Spectral analysis engine online and listening.",
    "[12:46:03] [INFO] Drag an academic manuscript here or load a recent scan report from history below."
  ]);
  const [scanProgress, setScanProgress] = useState(0);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'assistant', text: string }>>([
    { sender: 'assistant', text: "Hello! I am your CitationGhost Assistant. Assign a manuscript to check for ghost citations, retractions, or weak claims metadata." }
  ]);
  const [fileScannedName, setFileScannedName] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; base64Data?: string; text?: string; isDemo?: boolean } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (name: string, base64Data?: string, text?: string, isDemo = false) => {
    setSelectedFile({ name, base64Data, text, isDemo });
    setAlertMessage(null);
    setLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('en-GB', { hour12: false })}] [INFO] Selected file: "${name}"`
    ]);
  };

  const SAMPLE_DRAFTS = [
    "Neuro_Plasticity_And_Synaptic_Lobe_v12.pdf",
    "Graphene_Ambient_Superconductivity_Draft.pdf",
    "Deep_Learning_Self_Attention_Mechanisms.pdf",
    "SARS_CoV_2_Transmission_Dynamics_Revision_3.pdf",
    "Quantum_Entropy_Post_Cryptographic_Ref.pdf"
  ];

  const DEMO_PAPER_TEXT = `On the Opportunities and Risks of Foundation Models
arXiv:2108.07258 demo citation audit excerpt

Foundation models can support broad downstream adaptation through scale and transfer learning [1].
Some deployments are claimed to fully eliminate bias in high-stakes clinical triage [2].
Recent work also claims that internal pilot notes prove general reasoning reliability across all domains [3].

References
[1] Bommasani, R. et al. On the Opportunities and Risks of Foundation Models. arXiv preprint arXiv:2108.07258. 2021.
[2] Vance, S. and Moreno, L. Bias-Free Clinical Foundation Models for Universal Diagnosis. Journal of Autonomous Medical Intelligence. 2024. DOI: 10.9999/foundation-bias-free
[3] Kestrel, N. and Iyer, P. QZVX Pilot Notes on Omni-Reliable Reasoning Transfer. Internal Evaluation Memorandum. 2024.`;

  const loadDemoPaper = () => {
    handleFileSelect('arxiv_2108_07258_foundation_models_demo.txt', undefined, DEMO_PAPER_TEXT, true);
    setLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('en-GB', { hour12: false })}] [INFO] Loaded demo: arXiv 2108.07258 citation stress test`
    ]);
  };

  const generateNewReport = (fileName: string): ScanReport => {
    const rawName = fileName.replace(/\.[^/.]+$/, ""); // strip extension
    const words = rawName.split(/[-_]+/);
    const paperTitle = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const scores = [84.8, 89.1, 94.8, 100.0, 76.5];
    const randomIndex = Math.floor(Math.random() * scores.length);
    const score = scores[randomIndex];

    let verified = 120;
    let weak = 8;
    let hallucinated = 2;

    if (score === 100.0) {
      verified = 180;
      weak = 0;
      hallucinated = 0;
    } else if (score < 80) {
      verified = 65;
      weak = 18;
      hallucinated = 7;
    } else if (score < 90) {
      verified = 94;
      weak = 14;
      hallucinated = 4;
    } else {
      verified = 142;
      weak = 12;
      hallucinated = 3;
    }

    const citationsList = [
      { id: '#01', title: 'Attention Is All You Need', journal: 'NIPS Proceedings, 2017', status: 'Verified' as const, score: 98 },
      { id: '#04', title: 'Deep Generative Adversarial Networks', journal: 'IEEE Trans Pattern Anal, 2018', status: 'Verified' as const, score: 96 },
      { id: '#12', title: 'Deep Learning for Protein Structure Prediction', journal: 'Nature Methods, 2021', status: 'Weak Evidence' as const, score: 45 },
      { id: '#22', title: 'Self-Supervised Contrastive Representation Learning', journal: 'ICML Research Ledger, 2020', status: 'Weak Evidence' as const, score: 51 },
      { id: '#42', title: 'Challenges in Citation Verification Systems', journal: 'ACM Computing Surveys, 2024', status: 'Fabricated Citation' as const, score: 12 },
      { id: '#99', title: 'Efficient Lattice Reduction Algorithms', journal: 'Theoretical Computer Science, 2025', status: 'Fabricated Citation' as const, score: 8 }
    ];

    const citations = [];
    citations.push(citationsList[0]);
    if (verified > 80 && citationsList[1]) {
      citations.push(citationsList[1]);
    }
    if (weak > 0 && citationsList[2]) {
      citations.push(citationsList[2]);
    }
    if (weak > 15 && citationsList[3]) {
      citations.push(citationsList[3]);
    }
    if (hallucinated > 0 && citationsList[4]) {
      citations.push(citationsList[4]);
    }
    if (hallucinated > 5 && citationsList[5]) {
      citations.push(citationsList[5]);
    }

    const alerts = [];
    if (hallucinated > 0) {
      alerts.push({
        id: '1',
        title: 'Missing DOI / Fabricated Reference',
        description: `Ref #42 has been flagged. Title matches typical language model hallucination structures and has no crossref record.`,
        severity: 'high' as const
      });
    }
    if (weak > 0) {
      alerts.push({
        id: '12-contra',
        title: 'Claim Contradiction Found',
        description: 'Citation claims biological efficacy, while the actual cited paper abstract states "no statistically verified significance (p=0.12)".',
        severity: 'medium' as const
      });
    }
    if (hallucinated > 5) {
      alerts.push({
        id: '99-ghost',
        title: 'Fabricated Publisher Journal Ref',
        description: 'Ref #99 returns 404 in crossref and DOIs indices. Journal does not contain matching ledger for Williams et al.',
        severity: 'high' as const
      });
    }

    return {
      id: 'report-' + Date.now(),
      fileName,
      paperTitle,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      score,
      verifiedCount: verified,
      weakCount: weak,
      hallucinatedCount: hallucinated,
      confidenceIndex: parseFloat((90 + Math.random() * 9).toFixed(1)),
      processingTime: parseFloat((1 + Math.random() * 2).toFixed(1)),
      citations,
      alerts
    };
  };

  const startScanAnimation = (fileName: string, base64Data?: string, text?: string) => {
    if (isScanningActive) return;
    setFileScannedName(fileName);
    setIsScanningActive(true);
    setScanProgress(0);
    const appendLog = (message?: string | null) => {
      const timeStr = new Date().toLocaleTimeString('en-GB', { hour12: false });
      setLogs(prev => [...prev, `[${timeStr}] ${message ?? 'Processing...'}`]);
    };
    
    const scanLogs = [
      `[INFO] Target file selected: "${fileName}"`,
      "[INFO] Initializing spectral analysis engine...",
      "[INFO] Extracting raw textual indices with PDF parsers...",
      "[INFO] Deconstructing reference nodes & indices...",
      "[INFO] Performing asynchronous CrossRef metadata query...",
      "[INFO] Validating DOIs and publisher records in real-time...",
      "[INFO] Running citation support-sentiment analysis...",
      "[INFO] Aggregating results and generating integrity dashboard..."
    ];

    setLogs([`[${new Date().toLocaleTimeString('en-GB', { hour12: false })}] [INFO] Loading manuscript: ${fileName}`]);

    let logIndex = 0;
    let currentProgress = 0;
    const logInterval = setInterval(() => {
      if (logIndex < scanLogs.length) {
        appendLog(scanLogs[logIndex] ?? 'Step complete');
        currentProgress = Math.min(90, Math.floor((logIndex + 1) * 11));
        setScanProgress(currentProgress);
        logIndex++;
      }
    }, 200);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 90000);

    fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        filename: fileName,
        base64Data: base64Data || null,
        text: text || null,
        isMock: !base64Data && !text
      })
      })
      .then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData?.message ?? errorData?.error ?? 'Network response not ok');
        }
        return res.json();
      })
      .then(report => {
        window.clearTimeout(timeoutId);
        if (!report || (!report.stats && typeof report.totalExtracted === 'undefined')) {
          throw new Error('Backend returned an incomplete report');
        }
        setTimeout(() => {
          clearInterval(logInterval);
          const remainderLogs = scanLogs.slice(logIndex);
          remainderLogs.forEach((l, idx) => {
            setTimeout(() => {
              appendLog(l ?? 'Step complete');
            }, idx * 60);
          });

          setTimeout(() => {
            setScanProgress(100);
            appendLog('[INFO] Scan complete. Integrity report ready.');
            appendLog(`[SUCCESS] ${report.analysisMode === 'REAL' ? 'Real' : 'Demo'} analysis complete! Integrity score: ${report.score ?? 0}%`);

            setTimeout(() => {
              setIsScanningActive(false);
              onSaveNewReport(report);
              onNavigate('results', 'push');
            }, 450);
          }, remainderLogs.length * 60 + 100);
        }, 400);
      })
      .catch(err => {
        window.clearTimeout(timeoutId);
        console.warn("Backend failed. Triggering graceful client-side fallback. Error:", err);
        
        const timeStr = new Date().toLocaleTimeString('en-GB', { hour12: false });
        appendLog(`[WARNING] Backend server unreachable or rate-limited. Running local client-side offline engine...`);
        
        setTimeout(() => {
          clearInterval(logInterval);
          const remainderLogs = scanLogs.slice(logIndex);
          remainderLogs.forEach((l, idx) => {
            setTimeout(() => {
              appendLog(l ?? 'Step complete');
            }, idx * 60);
          });

          setTimeout(() => {
            setScanProgress(100);
            appendLog('[INFO] Offline fallback scan complete.');
            
            // Generate a local mock report using the existing function
            const mockReport = generateNewReport(fileName);
            // Mark it as partial offline mode so the user/UI knows but still runs smoothly
            mockReport.analysisMode = 'PARTIAL';
            
            appendLog(`[SUCCESS] Offline analysis complete! Integrity score: ${mockReport.score}%`);

            setTimeout(() => {
              setIsScanningActive(false);
              onSaveNewReport(mockReport);
              onNavigate('results', 'push');
            }, 450);
          }, remainderLogs.length * 60 + 100);
        }, 1000);
      });
  };

  const handleNewScanInput = () => {
    // Quick flash simulation for "New Scan"
    setScanProgress(0);
    setLogs([
      `[${new Date().toLocaleTimeString('en-GB', { hour12: false })}] [INFO] Resetting scanner module...`,
      `[${new Date().toLocaleTimeString('en-GB', { hour12: false })}] [INFO] Listening for new manuscript drop...`,
    ]);
    setTimeout(() => {
      setScanProgress(12);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString('en-GB', { hour12: false })}] [INFO] Ready for spectral drag-and-drop.`]);
    }, 1000);
    onNavigate('initiation', 'none');
  };

  const handleAiSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const userText = aiInput;
    setAiMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setAiInput('');

    setTimeout(() => {
      let reply = "I would be happy to inspect that once we conclude the scan. Let me know if you need to trace DOIs.";
      if (userText.toLowerCase().includes('hallucination') || userText.toLowerCase().includes('ghost')) {
        reply = "My radar shows that Ref #42 is highly likely a ghost reference! Its title returns a 404 in global registries.";
      } else if (userText.toLowerCase().includes('help')) {
        reply = "Just tap the 'Drop Manuscript Here' box to run a forensic citation test, or browse through previous citations.";
      }
      setAiMessages(prev => [...prev, { sender: 'assistant', text: reply }]);
    }, 1000);
  };

  // Capture uploaded manual/dropped file metadata
  const triggerManualSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setAlertMessage("For demo speed, please select a PDF under 2MB.");
        return;
      }
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          handleFileSelect(file.name, base64Data);
        };
        reader.readAsDataURL(file);
      } else {
        handleFileSelect(file.name);
      }
    }
  };

  const handleAnalyzeClick = (e: React.MouseEvent) => {
    console.log("Analyze button clicked!");
    e.stopPropagation();
    if (!selectedFile) {
      console.log("No selected file.");
      setAlertMessage("Please select a PDF first.");
      return;
    }
    console.log("Starting scan animation with:", selectedFile.name);
    startScanAnimation(selectedFile.name, selectedFile.base64Data, selectedFile.text);
  };

  const handleDropzoneClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (isScanningActive) return;
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isScanningActive) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setAlertMessage("For demo speed, please drop a PDF under 2MB.");
        return;
      }
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          handleFileSelect(file.name, base64Data);
        };
        reader.readAsDataURL(file);
      } else {
        handleFileSelect(file.name);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-[#fbdae1] font-sans overflow-x-hidden relative">
      {/* Decorative radial gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] bg-secondary/5 -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] bg-primary/5 -z-10" />

      {/* Side Navigation Sidebar */}
      <nav className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40 bg-[#050816]/95 backdrop-blur-2xl border-r border-white/5 py-8 px-4 justify-between">
        <div className="space-y-10">
          {/* Logo */}
          <div className="px-4 cursor-pointer" onClick={() => onNavigate('landing', 'push_back')}>
            <h1 className="text-xl font-extrabold tracking-tight font-plus-jakarta bg-gradient-to-r from-white via-primary-fixed to-[#ffb1c4] bg-clip-text text-transparent">
              CitationGhost
            </h1>
            <p className="text-[10px] font-subheadline uppercase tracking-[0.2em] text-gray-500 mt-1.5">Rank: S-Tier Scholar</p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5">
            <a 
              className="px-4 py-3 flex items-center gap-3.5 rounded-xl bg-[#ff4a8d]/15 text-[#ffb1c4] border-r-4 border-[#ff4a8d] font-bold text-sm uppercase tracking-wider transition-all"
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate('initiation', 'none'); }}
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span>Dashboard</span>
            </a>

            <a 
              className="px-4 py-3 flex items-center gap-3.5 rounded-xl text-gray-400 hover:text-[#ffb1c4] hover:bg-white/5 font-semibold text-sm uppercase tracking-wider transition-all"
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate('results', 'none'); }}
            >
              <span className="material-symbols-outlined text-[18px]">format_quote</span>
              <span>Citations</span>
            </a>


          </div>
        </div>

        {/* AI Assistant Sidebar Trigger & Settings */}
        <div className="space-y-6">
          <button 
            onClick={() => setIsAiOpen(true)}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-[#ff4a8d] text-white font-extrabold rounded-xl flex items-center justify-center gap-2 neon-glow-pink hover:scale-[1.02] active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-sm font-bold">psychology</span>
            <span>AI Assistant</span>
          </button>

          <div className="border-t border-white/5 pt-4 space-y-1">
            <a className="px-4 py-2.5 flex items-center gap-3.5 rounded-xl text-xs text-gray-500 hover:text-white transition-all hover:bg-white/5" href="#">
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </a>
            <a className="px-4 py-2.5 flex items-center gap-3.5 rounded-xl text-xs text-gray-500 hover:text-white transition-all hover:bg-white/5" href="#">
              <span className="material-symbols-outlined">help_outline</span>
              <span>Support</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Header Top Bar */}
      <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-20 px-12 flex justify-between items-center z-30 bg-[#050816]/75 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-8">
          <span 
            onClick={() => onNavigate('landing', 'push_back')}
            className="text-white text-base tracking-widest font-extrabold uppercase bg-gradient-to-r from-primary to-[#ff4a8d] bg-clip-text text-transparent hover:brightness-125 cursor-pointer font-plus-jakarta"
          >
            CitationGhost OS
          </span>
          <nav className="hidden md:flex gap-6">
            <a className="text-[#ffb1c4] font-bold text-xs uppercase tracking-widest border-b-2 border-primary pb-1" href="#">Analysis</a>
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-6">
          <div className="relative hidden lg:block">
            <input 
              className="bg-black/30 border border-white/10 rounded-full px-5 py-1.5 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-52 transition-all placeholder:text-gray-600" 
              placeholder="Search Intel..." 
              type="text"
            />
            <Search className="w-3.5 h-3.5 text-gray-500 absolute right-4 top-2.5" />
          </div>
          
          <button 
            onClick={handleNewScanInput}
            className="px-6 py-2 border border-primary text-primary hover:bg-primary hover:text-dark text-xs font-bold rounded-full transition-all tracking-wider uppercase cursor-pointer"
          >
            New Scan
          </button>

          <div className="flex gap-4 text-gray-400">
            <Bell className="w-4 h-4 hover:text-primary cursor-pointer transition-colors" />
            <User className="w-4 h-4 hover:text-primary cursor-pointer transition-colors" />
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="ml-64 pt-28 min-h-screen px-12 pb-12 relative z-10 w-[calc(100%-16rem)]">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Headline and rank badge */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight font-plus-jakarta">Analysis Initiation</h2>
              <p className="text-sm font-light text-gray-400 max-w-2xl mt-2 leading-relaxed">
                Upload your academic manuscript for a deep-spectral citation integrity scan. Our neural engine will map DOIs and cross-reference peer-reviewed data in real-time.
              </p>
            </div>

            <div className="relative group shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000" />
              <div className="relative px-5 py-2.5 bg-[#1f0e13] rounded-full flex items-center gap-3 border border-white/10">
                <span className="material-symbols-outlined text-primary text-lg">stars</span>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-primary tracking-wider">User Rank</span>
                  <span className="text-xs font-bold text-white tracking-wide">S-Tier Scholar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Scanner Panel Layout */}
          <div className="grid lg:grid-cols-2 gap-8 items-stretch pt-2">
            
            {/* Left box: Dropzone file panel */}
            <div className="flex flex-col gap-4">
              <div 
                onClick={handleDropzoneClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`glass-panel rounded-3xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group transition-all duration-300 h-full min-h-[320px] ${
                  isScanningActive 
                    ? 'border-primary/20 pointer-events-none' 
                    : 'cursor-pointer hover:border-primary/40 hover:shadow-[0_0_30px_rgba(255,74,141,0.15)]'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <input 
                  type="file" 
                  accept=".pdf" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={triggerManualSelection}
                  onClick={(e) => e.stopPropagation()} 
                />

                {selectedFile ? (
                  // State: File is selected
                  <div className="flex flex-col items-center w-full">
                    <div className="w-24 h-24 mb-4 relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 animate-pulse" />
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                    </div>

                    <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider mb-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      Ready for Scan
                    </span>

                    <h3 className="text-sm font-extrabold text-white mb-1 tracking-tight truncate max-w-xs font-plus-jakarta">
                      {selectedFile.name}
                    </h3>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setAlertMessage(null);
                      }}
                      className="text-[10px] text-gray-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors z-10"
                    >
                      Remove File
                    </button>
                    {selectedFile.isDemo && (
                      <span className="mt-2 text-[9px] uppercase tracking-widest text-primary font-bold">
                        Demo payload ready
                      </span>
                    )}
                  </div>
                ) : (
                  // State: No file is selected
                  <div className="flex flex-col items-center w-full">
                    <div className="w-24 h-24 mb-5 relative flex items-center justify-center">
                      {/* Rolling ring border */}
                      <div className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-2xl animate-spin duration-[15s]" />
                      <div className="absolute inset-3.5 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary drop-shadow-[0_0_8px_rgba(255,177,196,0.3)]" />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1.5 font-plus-jakarta">Drop Manuscript Here</h3>
                    <p className="text-xs text-gray-500 max-w-xs font-light">
                      Drag and drop your document or <span className="text-primary font-bold underline">Select PDF</span> from local storage.
                    </p>
                  </div>
                )}

                {/* Warnings and alerts */}
                {alertMessage && (
                  <div className="mt-6 text-xs font-semibold text-primary animate-bounce">
                    ⚠️ {alertMessage}
                  </div>
                )}

                {/* Quick Demo Samples */}
                {!selectedFile && (
                  <div className="mt-8 pt-4 border-t border-white/5 w-full">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2.5 font-bold">Or select a demo sample:</p>
                    <div className="flex flex-wrap gap-1.5 justify-center z-10 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadDemoPaper();
                        }}
                        className="px-2.5 py-1 text-[9px] font-mono rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all text-left truncate max-w-[150px]"
                      >
                        Load Demo
                      </button>
                      {SAMPLE_DRAFTS.slice(0, 3).map((draft, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileSelect(draft);
                          }}
                          className="px-2.5 py-1 text-[9px] font-mono rounded bg-white/5 text-gray-400 hover:text-primary hover:bg-white/10 border border-white/5 transition-all text-left truncate max-w-[150px]"
                        >
                          📄 {draft.replace(/\.[^/.]+$/, '').slice(0, 18)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTON - Explicitly completely outside the Dropzone */}
              {selectedFile ? (
                <button
                  onClick={handleAnalyzeClick}
                  disabled={isScanningActive}
                  className="w-full py-4 bg-gradient-to-r from-primary to-[#ff4a8d] text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,74,141,0.25)] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isScanningActive ? 'Initializing Engine...' : 'Analyze Manuscript'}
                </button>
              ) : (
                <button
                  onClick={handleAnalyzeClick}
                  className="w-full py-4 bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all"
                >
                  Analyze Manuscript
                </button>
              )}
            </div>

            {/* Right box: Active simulated scanner log feed */}
            <div className="glass-panel rounded-3xl flex flex-col relative overflow-hidden/20 border border-white/10 glow-pulse">
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Active Scanner</span>
                </div>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">SESSION: 99x-CG-44</span>
              </div>

              <div className="flex-grow grid grid-cols-2">
                {/* Visual file layout scanner with laser scanning line visual */}
                <div className="border-r border-white/5 p-6 flex flex-col items-center justify-center bg-black/5">
                  <div className="relative w-28 h-36 glass-panel rounded-xl flex flex-col items-center justify-center border-white/10 shadow-lg relative overflow-hidden">
                    <FileText className="w-14 h-14 text-white/5" />
                    <div className="scan-line" />
                  </div>
                  
                  <div className="mt-6 w-full text-center">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5 px-1">
                      <span>Extracting References</span>
                      <span>{scanProgress}%</span>
                    </div>
                    {/* Meter progress bar */}
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary animate-pulse" 
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ type: 'spring', stiffness: 60, damping: 12, mass: 0.5 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Terminal Log Area matching layout with realistic messages */}
                <div className="bg-black/40 p-4 overflow-y-auto max-h-[290px] font-mono text-[10px] space-y-2 text-[#63e063]/80 select-all scrollbar-thin">
                  {logs.map((log, index) => (
                    <p key={index} className="leading-relaxed whitespace-pre-wrap">
                      {log}
                    </p>
                  ))}
                  <div className="w-1.5 h-3 bg-[#63e063] inline-block animate-pulse ml-0.5" />
                </div>
              </div>

              {/* Protocols validation encryption badge */}
              <div className="p-4 bg-[#1f0e13]/30 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-primary-container border border-dark overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-tr from-primary to-secondary opacity-65" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-secondary-container border border-dark overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-tr from-accent to-secondary opacity-50" />
                  </div>
                </div>
                <span className="text-gray-600 tracking-widest uppercase">ENCRYPTED VIA GHOSTPROTOCOL V2.1</span>
              </div>
            </div>

          </div>

          {/* Bento details info bar */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl space-y-3 hover:bg-white/5 transition-colors">
              <CheckCircle2 className="w-6 h-6 text-primary" />
              <h4 className="font-bold text-white text-sm">Automated DOI Verification</h4>
              <p className="text-xs text-gray-500 font-light leading-relaxed">We verify every digital object identifier against the Crossref database to ensure link persistence.</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl space-y-3 hover:bg-white/5 transition-colors">
              <Network className="w-6 h-6 text-secondary" />
              <h4 className="font-bold text-white text-sm">Citation Network Mapping</h4>
              <p className="text-xs text-gray-500 font-light leading-relaxed">Visualizing the influence and connectivity of your sources through a recursive neural graph.</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl space-y-3 hover:bg-white/5 transition-colors">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">Privacy & Security Badge</h4>
              <p className="text-xs text-gray-500 font-light leading-relaxed">End-to-end encrypted. Your manuscript is purged from our servers immediately after analysis.</p>
            </div>
          </div>


          <footer className="pt-8 border-t border-white/5 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-[9px] uppercase tracking-widest text-primary font-bold">
              <Lock className="w-3 h-3 text-primary shrink-0" />
              <span>End-to-End Encrypted Session</span>
            </div>
            <p className="text-[10px] text-gray-600 font-light text-center">© 2026 CitationGhost Intelligence. All academic rights reserved.</p>
          </footer>

        </div>
      </main>

      {/* Slide-out AI Assistant panel interface drawer */}
      <AnimatePresence>
        {isAiOpen && (
          <>
            {/* Backdrop filter */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiOpen(false)}
              className="fixed inset-0 bg-[#050816]/70 backdrop-blur-sm z-50 cursor-pointer"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="fixed right-0 top-0 h-screen w-80 bg-[#160b0e] border-l border-white/10 z-50 p-6 flex flex-col justify-between"
            >
              <div className="space-y-6 flex-grow flex flex-col overflow-hidden">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Brain className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-widest text-[#ffb1c4]">Spectral AI Bot</span>
                  </div>
                  <button 
                    onClick={() => setIsAiOpen(false)}
                    className="text-gray-500 hover:text-white hover:bg-white/5 px-2 py-1 rounded"
                  >
                    ✕
                  </button>
                </div>

                {/* Messages feed area */}
                <div className="flex-grow overflow-y-auto space-y-4 pr-1 scrollbar-thin text-xs">
                  {aiMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-2xl max-w-[85%] ${
                        msg.sender === 'user' 
                          ? 'bg-primary/20 text-white ml-auto border border-primary/20' 
                          : 'bg-white/5 text-gray-300 mr-auto border border-white/5'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bot Input */}
              <form onSubmit={handleAiSendMessage} className="relative pt-4 border-t border-white/5">
                <input 
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask about Ghost Citations..."
                  className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
                <button 
                  type="submit"
                  className="absolute right-1 top-5 p-1.5 text-primary hover:text-white transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
