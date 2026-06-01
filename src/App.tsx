/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Check, ArrowRight, Play } from 'lucide-react';
import { ScreenType, TransitionType, ScanReport } from './types';
import { DEFAULT_REPORTS } from './data/defaultReports';
import LandingPage from './components/LandingPage';
import AnalysisInitiation from './components/AnalysisInitiation';
import ScanResults from './components/ScanResults';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenType, transition: TransitionType) => void;
}

function DemoModal({ isOpen, onClose, onNavigate }: DemoModalProps) {
  const [analyzed, setAnalyzed] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAnalyzed(false);
      setOpenId(null);
      const t = setTimeout(() => {
        setAnalyzed(true);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const citations = [
    {
      id: 1,
      author: "Smith et al. 2020",
      status: "verified",
      badge: "✓ Verified",
      color: "#22c55e",
      badgeClass: "border-[#22c55e]/20 text-[#22c55e] bg-[#22c55e]/10",
      hasDetail: false,
    },
    {
      id: 2,
      author: "Johnson 2019",
      status: "ghost",
      badge: "✗ Ghost — DOI 404",
      color: "#FF2D6B",
      badgeClass: "border-[#FF2D6B]/20 text-[#FF2D6B] bg-[#FF2D6B]/10",
      hasDetail: true,
      reason: "The DOI 10.1016/j.nutneuro.2019.04.721 returned HTTP 404. CrossRef has no record of this paper. OpenAlex title search also returned 0 results. This citation does not appear to exist.",
      checkCode: "GET https://doi.org/10.1016/j.nutneuro.2019.04.721\n→ 404 Not Found"
    },
    {
      id: 3,
      author: "Park et al. 2021",
      status: "misleading",
      badge: "⚠ Misleading",
      color: "#FF9500",
      badgeClass: "border-[#FF9500]/20 text-[#FF9500] bg-[#FF9500]/10",
      hasDetail: true,
      citingSentence: "Park et al. confirm that Vitamin D supplementation significantly improves memory scores in adults over 50.",
      originalSays: "Our double-blind RCT (n=18) found no statistically significant improvement in memory scores (p=0.12). Results suggest further research with larger samples is warranted.",
      verdict: "Groq: This abstract directly contradicts the claim being made. The paper reports p=0.12 (not significant) but is cited as confirmation of significance."
    },
    {
      id: 4,
      author: "Chen 2022",
      status: "verified",
      badge: "✓ Verified",
      color: "#22c55e",
      badgeClass: "border-[#22c55e]/20 text-[#22c55e] bg-[#22c55e]/10",
      hasDetail: false,
    },
    {
      id: 5,
      author: "Williams 2018",
      status: "ghost",
      badge: "✗ Ghost — Title not found",
      color: "#FF2D6B",
      badgeClass: "border-[#FF2D6B]/20 text-[#FF2D6B] bg-[#FF2D6B]/10",
      hasDetail: true,
      reason: "No DOI provided. Title search across CrossRef, OpenAlex, and Semantic Scholar returned 0 matches for 'Williams 2018 — Cognitive Effects of Micronutrient Supplementation'. This reference cannot be verified.",
      checkCode: "SEARCH: \"Williams 2018 Cognitive Micronutrient\"\nCrossRef    → 0 results\nOpenAlex    → 0 results  \nSem. Scholar → 0 results"
    }
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-[8px]"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative bg-[#0d0d18] border border-[#FF2D6B]/25 rounded-2xl w-full max-w-[820px] max-h-[88vh] overflow-y-auto shadow-[0_0_50px_rgba(255,45,107,0.15)] flex flex-col z-10"
      >
        {/* Header bar */}
        <div className="border-b border-white/5 bg-black/40 px-6 py-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
            <span className="w-3 h-3 rounded-full bg-[#10B981]" />
            <span className="w-[1px] h-3.5 bg-white/15 mx-1 animate-pulse" />
            <span className="text-[11px] text-white/50 tracking-wider font-mono">
              CitationGhost — Live Analysis
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {!analyzed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#FF2D6B]/10 text-[#FF2D6B] border border-[#FF2D6B]/20 tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D6B] animate-ping" />
                  ANALYZING...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider">
                  <Check className="w-3 h-3 animate-pulse" />
                  COMPLETE
                </span>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal content body */}
        <div className="p-6 md:p-8 space-y-6 flex-1">
          {/* Paper Info Block */}
          <div className="space-y-2 bg-white/[0.02] border border-white/[0.04] rounded-xl p-5">
            <span className="text-[#FF2D6B] font-bold text-[10px] tracking-widest uppercase font-mono block">
              PAPER UNDER AUDIT
            </span>
            <h3 className="text-lg md:text-xl font-display font-bold text-white leading-snug">
              The Effect of Vitamin D on Cognitive Performance: A Randomized Controlled Trial (2023)
            </h3>
            <div className="pt-1 space-y-0.5 text-xs text-white/50 font-normal">
              <p>Authors: Martinez, R., Chen, L., Patel, S.</p>
              <p>Journal: Journal of Nutritional Neuroscience · 24 citations</p>
            </div>
          </div>

          {/* Summary Stats Row */}
          <div className="h-auto md:h-[74px] overflow-hidden relative">
            <AnimatePresence>
              {analyzed && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-5 py-3 flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-mono text-white/40 font-semibold">COGNITIVE INDEX</p>
                    <p className="text-sm font-bold text-white mt-0.5">5 Citations Analyzed</p>
                  </div>
                  <div className="bg-white/[0.02] border border-[#FF2D6B]/30 rounded-xl px-5 py-3 flex flex-col justify-center shadow-[0_0_15px_rgba(255,45,107,0.05)]">
                    <p className="text-[10px] uppercase font-mono text-[#FF2D6B] font-bold">CRITICAL RETRACTION</p>
                    <p className="text-sm font-bold text-[#FF2D6B] mt-0.5 animate-pulse">2 Ghost Citations</p>
                  </div>
                  <div className="bg-white/[0.02] border border-[#FF9500]/30 rounded-xl px-5 py-3 flex flex-col justify-center shadow-[0_0_15px_rgba(255,149,0,0.05)]">
                    <p className="text-[10px] uppercase font-mono text-[#FF9500] font-bold">CLAIM MISMATCH</p>
                    <p className="text-sm font-bold text-[#FF9500] mt-0.5">1 Misleading Claim</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Citation List block */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 font-mono block">
              CITATION ANNOTATIONS (STAGGERED NLP STREAM)
            </span>

            <div className="space-y-3">
              {citations.map((c, index) => {
                const isExpanded = openId === c.id;
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                    className={`border rounded-xl transition-all overflow-hidden ${
                      isExpanded
                        ? `bg-white/[0.03] shadow-md`
                        : `bg-white/[0.01]`
                    }`}
                    style={{
                      borderColor: isExpanded ? `${c.color}25` : 'rgba(255,255,255,0.04)',
                      borderByLeft: isExpanded ? `4px solid ${c.color}` : undefined
                    }}
                  >
                    {/* Header bar button */}
                    <button
                      onClick={() => {
                        if (c.hasDetail || c.status === 'verified') {
                          setOpenId(isExpanded ? null : c.id);
                        }
                      }}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors outline-none cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="text-xs sm:text-sm font-semibold text-white/90">
                          [{c.id}] {c.author}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${c.badgeClass} font-semibold`}>
                          {c.badge}
                        </span>
                        {(c.hasDetail || c.status === 'verified') && (
                          <ChevronDown
                            className={`w-4 h-4 text-white/30 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white/80' : ''}`}
                          />
                        )}
                      </div>
                    </button>

                    {/* Accordion panel */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ maxHeight: 0, opacity: 0 }}
                          animate={{ maxHeight: 400, opacity: 1 }}
                          exit={{ maxHeight: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="px-5 pb-5 pt-1 space-y-4 border-t border-white/[0.03] text-xs leading-relaxed bg-[#0a0a14]/40 font-light">
                            {c.status === 'verified' && (
                              <div className="space-y-1">
                                <p className="text-[10px] font-mono uppercase text-white/40 block">INTEGRITY REPORT</p>
                                <p className="text-white/80">
                                  This citation index reference is 100% genuine and fully cross-referenced with catalog records in real-time. Matches context sentence perfectly.
                                </p>
                              </div>
                            )}

                            {c.status === 'ghost' && (
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] font-mono uppercase text-[#FF2D6B] font-semibold">WHY IT'S FLAGGED</p>
                                  <p className="text-white/80 mt-1">{c.reason}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-mono uppercase text-white/30">MOCK SEARCH METADATA</p>
                                  <pre className="p-3 bg-[#05050c] border border-white/5 rounded-lg text-[11px] font-mono text-rose-400 overflow-x-auto select-all leading-normal whitespace-pre">
                                    {c.checkCode}
                                  </pre>
                                </div>
                              </div>
                            )}

                            {c.status === 'misleading' && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-4 rounded-xl border border-[#FF9500]/10 bg-[#FF9500]/5 space-y-1">
                                    <p className="text-[10px] font-mono uppercase text-[#FF9500] font-semibold">CITING SENTENCE IN YOUR PAPER</p>
                                    <p className="text-white/90 italic leading-relaxed">
                                      "{c.citingSentence}"
                                    </p>
                                  </div>
                                  <div className="p-4 rounded-xl border border-[#FF2D6B]/10 bg-[#FF2D6B]/5 space-y-1">
                                    <p className="text-[10px] font-mono uppercase text-[#FF2D6B] font-semibold">WHAT THE PAPER ACTUALLY SAYS</p>
                                    <p className="text-white/90 leading-relaxed">
                                      "{c.originalSays}"
                                    </p>
                                  </div>
                                </div>

                                <div className="p-3 rounded-lg border border-[#FF2D6B]/20 bg-[#FF2D6B]/10 flex items-start gap-2 text-[#FF2D6B]">
                                  <span className="text-sm">💡</span>
                                  <p className="text-xs font-semibold leading-normal">
                                    {c.verdict}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/5 bg-black/50 px-6 py-4.5 flex flex-col sm:flex-row gap-4 items-center justify-between z-10">
          <span className="text-[11px] text-white/35 font-mono text-center sm:text-left select-none">
            This is a live simulation of CitationGhost's analysis pipeline
          </span>
          <button
            onClick={() => {
              onClose();
              onNavigate('initiation', 'push');
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#FF2D6B] hover:bg-[#ff1659] text-white rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md shadow-[#FF2D6B]/25 hover:scale-103 cursor-pointer"
          >
            Analyze Your Own Paper <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('landing');
  const [activeTransition, setActiveTransition] = useState<TransitionType>('none');
  const [demoOpen, setDemoOpen] = useState(false);

  // Load initial reports or defaults from persistent browser storage
  const [reports, setReports] = useState<ScanReport[]>([]);
  const [activeReport, setActiveReport] = useState<ScanReport | null>(null);

  useEffect(() => {
    fetch('/api/reports')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('API server status check failed');
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setReports(data);
          setActiveReport(data[0]);
          localStorage.setItem('citationghost_reports', JSON.stringify(data));
        } else {
          throw new Error('Report array empty');
        }
      })
      .catch(() => {
        const raw = localStorage.getItem('citationghost_reports');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setReports(parsed);
              setActiveReport(parsed[0]);
              return;
            }
          } catch (e) {
            console.error("Failed to parse stored reports", e);
          }
        }
        setReports(DEFAULT_REPORTS);
        setActiveReport(DEFAULT_REPORTS[0]);
        localStorage.setItem('citationghost_reports', JSON.stringify(DEFAULT_REPORTS));
      });
  }, []);

  const handleSaveReports = (updated: ScanReport[]) => {
    setReports(updated);
    localStorage.setItem('citationghost_reports', JSON.stringify(updated));
  };

  const handleSelectReport = (report: ScanReport) => {
    setActiveReport(report);
  };

  const handleSaveNewReport = (newReport: ScanReport) => {
    const updated = [newReport, ...reports];
    handleSaveReports(updated);
    setActiveReport(newReport);
  };

  const handleClearHistory = () => {
    fetch('/api/reports/clear', { method: 'POST' }).catch(err => console.error(err));
    handleSaveReports([]);
    setActiveReport(null);
  };

  const handleDeleteReport = (id: string) => {
    fetch(`/api/reports/${id}`, { method: 'DELETE' }).catch(err => console.error(err));
    const updated = reports.filter(r => r.id !== id);
    handleSaveReports(updated);
    if (activeReport?.id === id) {
      setActiveReport(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleNavigation = (screen: ScreenType, transition: TransitionType) => {
    setActiveTransition(transition);
    setCurrentScreen(screen);
  };

  React.useEffect(() => {
    const titles = {
      landing: "CitationGhost | Expose Fake Citations",
      initiation: "Forensic Workspace | CitationGhost",
      results: "Audit Ledger & Graph | CitationGhost",
    };
    document.title = titles[currentScreen] || "CitationGhost";
  }, [currentScreen]);

  // Variants mapped for different prototype navigation requirements
  const getVariants = () => {
    switch (activeTransition) {
      case 'push':
        return {
          initial: { x: '100vw', opacity: 0.8 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '-100vw', opacity: 0.8 },
          transition: { type: 'spring', damping: 25, stiffness: 120 }
        };
      case 'push_back':
        return {
          initial: { x: '-100vw', opacity: 0.8 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '100vw', opacity: 0.8 },
          transition: { type: 'spring', damping: 25, stiffness: 120 }
        };
      case 'slide_up':
        return {
          initial: { y: '100vh', opacity: 0.8 },
          animate: { y: 0, opacity: 1 },
          exit: { y: '-100vh', opacity: 0.8 },
          transition: { type: 'spring', damping: 22, stiffness: 100 }
        };
      case 'none':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.25 }
        };
    }
  };

  const currentVariants = getVariants();

  return (
    <div className="bg-[#050816] text-white w-full min-h-screen overflow-x-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={currentVariants.initial}
          animate={currentVariants.animate}
          exit={currentVariants.exit}
          transition={currentVariants.transition}
          className="w-full min-h-screen"
        >
          {currentScreen === 'landing' && (
            <LandingPage 
              onNavigate={handleNavigation} 
              onOpenDemo={() => setDemoOpen(true)}
            />
          )}
          {currentScreen === 'initiation' && (
            <AnalysisInitiation 
              onNavigate={handleNavigation} 
              reports={reports}
              activeReport={activeReport}
              onSelectReport={handleSelectReport}
              onSaveNewReport={handleSaveNewReport}
              onClearHistory={handleClearHistory}
              onDeleteReport={handleDeleteReport}
            />
          )}
          {currentScreen === 'results' && (
            <ScanResults 
              onNavigate={handleNavigation} 
              activeReport={activeReport}
              reports={reports}
              onSelectReport={handleSelectReport}
              onDeleteReport={handleDeleteReport}
              onClearHistory={handleClearHistory}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {demoOpen && (
          <DemoModal 
            isOpen={demoOpen} 
            onClose={() => setDemoOpen(false)} 
            onNavigate={handleNavigation}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
