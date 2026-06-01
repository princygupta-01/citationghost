import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, Sparkles, CheckCircle2, ShieldCheck, 
  HelpCircle, ChevronDown, RefreshCw, Layers, FileText,
  AlertTriangle, Play, HelpCircle as HelpIcon, Lock, 
  ExternalLink, Github, Twitter, Mail, Check, MessageSquare
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (screen: 'landing' | 'initiation' | 'results', transition: 'push' | 'push_back' | 'slide_up' | 'none') => void;
  onOpenDemo: () => void;
}

// Ease out cubic function for stats
function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start: number | null = null;
    let rafId: number;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return count;
}

export default function LandingPage({ onNavigate, onOpenDemo }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeCitationIndex, setActiveCitationIndex] = useState<number>(2); // Default is Johnson or Park
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  
  // Track scroll position for navbar backdrop blur
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 1. CANVAS WAVE BACKGROUND (bezier curves animation loop)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;
    let rafId: number;

    const draw = () => {
      if (!canvas || !ctx) return;
      
      // Dynamic resize update inside animation loop
      const parent = canvas.parentElement;
      canvas.width = parent ? parent.offsetWidth : window.innerWidth;
      canvas.height = parent ? parent.offsetHeight : 640;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Waves config (3 bezier curves with varying offsets and speeds)
      const waves = [
        {
          color: 'rgba(255, 45, 107, 0.12)', // Pink
          speed: 0.006,
          yOffset: height * 0.5,
          amplitude: 60,
          frequency: 0.003
        },
        {
          color: 'rgba(123, 47, 190, 0.08)', // Purple
          speed: 0.004,
          yOffset: height * 0.55,
          amplitude: 80,
          frequency: 0.002
        },
        {
          color: 'rgba(255, 107, 53, 0.06)', // Orange
          speed: 0.008,
          yOffset: height * 0.48,
          amplitude: 45,
          frequency: 0.004
        }
      ];

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.fillStyle = wave.color;

        // Draw bezier path
        ctx.moveTo(0, height);
        ctx.lineTo(0, wave.yOffset);

        // Subdivide horizontal space into segments to draw smooth wave via quadratic curves
        const points = 6;
        const segmentWidth = width / points;

        const horizontalShift = width * 0.03;
        for (let i = 0; i <= points; i++) {
          const x = i * segmentWidth;
          const shift = t * wave.speed * 100;
          // Calculate dynamic amplitude wave heights with a balanced shift
          const targetY = wave.yOffset + Math.sin((x + horizontalShift) * wave.frequency + t + (i * 0.8)) * wave.amplitude;
          
          if (i === 0) {
            ctx.lineTo(x, targetY);
          } else {
            const prevX = (i - 1) * segmentWidth;
            const prevY = wave.yOffset + Math.sin((prevX + horizontalShift) * wave.frequency + t + ((i - 1) * 0.8)) * wave.amplitude;
            const cpX = (prevX + x) / 2;
            const cpY = (prevY + targetY) / 2;
            
            if (i === points) {
              ctx.quadraticCurveTo(prevX, prevY, x, targetY);
            } else {
              ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
            }
          }
        }

        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      });

      t += 0.015;
      rafId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Stats Counters
  const ghostCount = useCountUp(4200);
  const existenceAccuracy = useCountUp(98);
  const claimAccuracy = useCountUp(87);

  // Demo Section State
  const citations = [
    {
      id: 1,
      author: "Smith et al. 2020",
      status: "verified",
      badge: "✓ Verified",
      color: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5",
      dot: "bg-emerald-500",
      citingSentence: "Smith et al. prove Vitamin D plays a catalytic function in boosting neurological response times during standard reaction tests.",
      actualAbstract: "We observed a significant decrease in reaction times for subjects administered structured Vitamin D therapy (p < 0.05, n=120) compared to placebo control."
    },
    {
      id: 2,
      author: "Johnson 2019",
      status: "ghost",
      badge: "✗ Ghost — DOI 404",
      color: "border-rose-500/20 text-rose-400 bg-rose-500/5",
      dot: "bg-rose-500",
      citingSentence: "Additional studies (Johnson 2019) reinforce that consistent intake correlates heavily to improved long-term cognitive score retention.",
      actualAbstract: "Error 404: DOI destination not found in Crossref registry. The publisher's listed DOI redirects to a suspended academic server domain. Paper has no authenticated citation index record."
    },
    {
      id: 3,
      author: "Park et al. 2021",
      status: "misleading",
      badge: "⚠ Misleading — Abstract contradicts claim",
      color: "border-amber-500/20 text-amber-400 bg-amber-500/5",
      dot: "bg-amber-500",
      citingSentence: "Park et al. confirm that Vitamin D significantly improves memory scores in adult cohorts.",
      actualAbstract: "Our double-blind study evaluated cognitive scores in 600 participants. We did not find any statistically significant memory score improvement after 12 months (p=0.12, n=18)."
    },
    {
      id: 4,
      author: "Chen 2022",
      status: "verified",
      badge: "✓ Verified",
      color: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5",
      dot: "bg-emerald-500",
      citingSentence: "Furthermore, Chen 2022 highlights that secondary calcitriol synthesis supports neural pathway maintenance.",
      actualAbstract: "Our findings validate that active calcitriol synthesis directly influences neuroprotection, maintaining high synaptic spine densities in cortical neurons."
    },
    {
      id: 5,
      author: "Williams 2018",
      status: "ghost",
      badge: "✗ Ghost — Title not found",
      color: "border-rose-500/20 text-rose-400 bg-rose-500/5",
      dot: "bg-rose-500",
      citingSentence: "Lastly, historical retrospectives by Williams 2018 documented a clear, sustained baseline enhancement inside urban groups.",
      actualAbstract: "Database Search Error: No article titled 'Vitamin D baselines in metropolitan populations: a decade review' found in PubMed, OpenAlex, or Scopus index catalog matching author Williams (2018)."
    }
  ];

  const activeCitation = citations.find(c => c.id === activeCitationIndex) || citations[2];

  return (
    <div className="min-h-screen bg-[#080810] text-[#FFFFFF] font-body relative overflow-x-hidden selection:bg-[#FF2D6B] selection:text-white">
      
      {/* 1. STYLES FOR THE FLOATING MAP LINES & PIPELINES */}
      <style>{`
        @keyframes strokeDash {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes customPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        @keyframes flowDash {
          to {
            stroke-dashoffset: -80;
          }
        }
        @keyframes pulseCircle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.3; }
        }
        @keyframes orbitFlow {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -1759;
          }
        }
        .animate-dash {
          stroke-dasharray: 6 4;
          stroke-dashoffset: 40;
          animation: strokeDash 1.8s linear infinite;
        }
        .animate-pulse-dot {
          animation: customPulse 1.8s ease-in-out infinite;
        }
        .animate-flow-dash {
          stroke-dasharray: 8 12;
          animation: flowDash 2s linear infinite;
        }
        .animate-pulse-circle {
          animation: pulseCircle 2s infinite ease-in-out;
        }
        .glow-pink-btn {
          box-shadow: 0 0 25px rgba(255, 45, 107, 0.45);
        }
        .glow-pink-btn:hover {
          box-shadow: 0 0 35px rgba(255, 45, 107, 0.7);
        }
        .text-glow-purple {
          text-shadow: 0 0 15px rgba(123, 47, 190, 0.5);
        }
      `}</style>

      {/* Ambient background glow points */}
      <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] z-0 pointer-events-none rounded-full blur-[160px] opacity-[0.25]" style={{ background: 'radial-gradient(circle, #7B2FBE 0%, transparent 70%)' }}></div>
      <div className="absolute top-[40%] right-[-20%] w-[70vw] h-[70vw] z-0 pointer-events-none rounded-full blur-[160px] opacity-[0.2]" style={{ background: 'radial-gradient(circle, #FF2D6B 0%, transparent 70%)' }}></div>
      <div className="absolute bottom-[-10%] left-[10%] w-[60vw] h-[60vw] z-0 pointer-events-none rounded-full blur-[150px] opacity-[0.18]" style={{ background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)' }}></div>

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'py-4 bg-[#080810]/85 backdrop-blur-md border-b border-white/[0.08] shadow-lg' : 'py-6 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-12 flex justify-between items-center">
          
          {/* Logo with ghost SVG */}
          <div 
            onClick={() => onNavigate('landing', 'push_back')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF2D6B] via-[#7B2FBE] to-[#FF6B35] p-[1.5px] shadow-lg shadow-[#FF2D6B]/10 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
              <div className="w-full h-full bg-[#080810] rounded-[10px] flex items-center justify-center">
                <svg className="w-5.5 h-5.5 text-[#FF2D6B]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C7.58172 2 4 5.58172 4 10V22L8 19L12 22L16 19L20 22V10C20 5.58172 16.4183 2 12 2ZM9 12C8.44772 12 8 11.5523 8 11C8 10.4477 8.44772 10 9 10C9.55228 10 10 10.4477 10 11C10 11.5523 9.55228 12 9 12ZM15 12C14.4477 12 14 11.5523 14 11C14 10.4477 14.4477 10 15 10C15.5523 10 16 10.4477 16 11C16 11.5523 15.5523 12 15 12Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-black tracking-tight bg-gradient-to-r from-white via-white to-[#FF2D6B]/80 bg-clip-text text-transparent">
                CitationGhost
              </span>
              <span className="text-[9px] font-semibold tracking-[0.08em] text-[#FF6B35] uppercase">
                Academic Integrity
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-normal text-white/70">
            <a href="#how-it-works" className="hover:text-[#FF2D6B] hover:text-glow-purple transition-all duration-300 font-medium">How It Works</a>
            <a href="#features" className="hover:text-[#FF2D6B] hover:text-glow-purple transition-all duration-300 font-medium">Features</a>
            <button onClick={(e) => { e.preventDefault(); onOpenDemo(); }} className="hover:text-[#FF2D6B] hover:text-glow-purple transition-all duration-300 font-medium uppercase text-xs font-semibold tracking-normal text-white/70 cursor-pointer text-left bg-transparent border-none p-0 outline-none">Demo</button>
            <a href="#pricing" className="hover:text-[#FF2D6B] hover:text-glow-purple transition-all duration-300 font-medium font-body">Pricing</a>
          </div>

          {/* CTA Try Free Pill button with glow */}
          <div>
            <button 
              onClick={() => onNavigate('initiation', 'push')}
              className="px-6 py-2.5 bg-gradient-to-r from-[#FF2D6B] to-[#FF6B35] rounded-full text-sm font-bold tracking-normal hover:scale-105 transition-all duration-300 ease-out text-white cursor-pointer glow-pink-btn"
            >
              Try Free
            </button>
          </div>

        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center pt-32 pb-20 px-6 sm:px-12 z-10 overflow-hidden">
        
        {/* Canvas Wave background, absolutely positioned below hero graphics */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#080810] to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
          
          {/* Hero Left Side */}
          <div className="space-y-8 text-center lg:text-left">
            
            {/* Animated Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md max-w-max mx-auto lg:mx-0"
            >
              <div className="flex -space-x-1">
                <div className="w-5 h-5 rounded-full bg-[#FF2D6B] flex items-center justify-center font-bold text-[8px] text-white">N</div>
                <div className="w-5 h-5 rounded-full bg-[#7B2FBE] flex items-center justify-center font-bold text-[8px] text-white">O</div>
                <div className="w-5 h-5 rounded-full bg-[#FF6B35] flex items-center justify-center font-bold text-[8px] text-white">D</div>
              </div>
              <div className="w-[1px] h-3.5 bg-white/20" />
              <span className="text-[11px] font-semibold tracking-normal text-white/80">
                100+ Papers Analyzed <span className="text-[#FF2D6B] mx-1">|</span> ★ 4.9 Accuracy
              </span>
            </motion.div>

            {/* Headline */}
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-[1.05] tracking-[-0.02em] text-white"
              >
                Expose The Citations <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2D6B] via-[#FF6B35] to-[#7B2FBE] filter drop-shadow-[0_0_15px_rgba(255,45,107,0.3)]">
                  That Don't Exist.
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-white/60 text-base sm:text-lg max-w-xl leading-relaxed font-normal mx-auto lg:mx-0"
              >
                Two-layer AI verification: we automatically check if citations actually exist across global catalogs AND whether they genuinely support the scientific claims made in your text.
              </motion.p>
            </div>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2"
            >
              <button 
                onClick={() => onNavigate('initiation', 'push')}
                className="px-8 py-4 rounded-full bg-[#FF2D6B] text-white font-bold text-sm tracking-normal shadow-lg shadow-[#FF2D6B]/30 hover:bg-[#ff1659] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer glow-pink-btn"
              >
                Analyze a Paper
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); onOpenDemo(); }}
                className="px-8 py-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold text-sm tracking-normal border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                See Demo <Play className="w-4 h-4 text-[#FF6B35]" />
              </button>
            </motion.div>
          </div>

          {/* Hero Right Side - SVG Paper Map Node Graphic */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center items-center"
          >
            {/* Purple background aura */}
            <div className="absolute w-80 h-80 bg-[#7B2FBE]/10 rounded-full blur-3xl -z-10 animate-pulse duration-[6s]" />

            {/* Sleek dashboard glass enclosure */}
            <div className="w-full max-w-[420px] bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[32px] p-8 shadow-2xl relative">
              <div className="absolute top-4 left-6 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF2D6B] animate-pulse" />
                <span className="text-[10px] font-semibold text-white/45 tracking-[0.05em] uppercase">INTEGRITY GRAPH VIEW</span>
              </div>
              <div className="absolute top-4 right-6 text-xs text-white/50 font-mono">
                Scanned: v1.02
              </div>

              {/* The Paper Map SVG */}
              <div className="w-full aspect-square mt-6 flex justify-center items-center">
                <svg viewBox="0 0 320 320" className="w-[280px] h-[280px]">
                  {/* Central Node to Outer Nodes Connecting Lines (Standardised angles starting from top)
                      Center is 160, 160. Radius = 120
                      Using math:
                      i=0 angle=-90deg => (160, 40)
                      i=1 angle=-30deg => (264, 100)
                      i=2 angle=30deg  => (264, 220)
                      i=3 angle=90deg  => (160, 280)
                      i=4 angle=150deg => (56, 220)
                      i=5 angle=210deg => (56, 100)
                  */}
                  
                  {/* Outer connections lines with glow stroke dashes */}
                  <line x1="160" y1="160" x2="160" y2="40" stroke="#10B981" strokeWidth="1.5" className="animate-dash" style={{ animationDelay: '0s' }} />
                  <line x1="160" y1="160" x2="264" y2="100" stroke="#10B981" strokeWidth="1.5" className="animate-dash" style={{ animationDelay: '0.3s' }} />
                  <line x1="160" y1="160" x2="264" y2="220" stroke="#10B981" strokeWidth="1.5" className="animate-dash" style={{ animationDelay: '0.6s' }} />
                  
                  <line x1="160" y1="160" x2="160" y2="280" stroke="#F59E0B" strokeWidth="1.5" className="animate-dash" style={{ animationDelay: '0.9s' }} />
                  
                  <line x1="160" y1="160" x2="56" y2="220" stroke="#EF4444" strokeWidth="1.5" className="animate-dash" style={{ animationDelay: '1.2s' }} />
                  <line x1="160" y1="160" x2="56" y2="100" stroke="#EF4444" strokeWidth="1.5" className="animate-dash" style={{ animationDelay: '1.5s' }} />

                  {/* Pulsing glow rings around ghost fake nodes */}
                  <circle cx="56" cy="220" r="14" fill="none" stroke="#EF4444" strokeWidth="1" className="animate-pulse-dot" />
                  <circle cx="56" cy="100" r="14" fill="none" stroke="#EF4444" strokeWidth="1" className="animate-pulse-dot" />

                  {/* Outer Node i=0 (Green - Verified) */}
                  <circle cx="160" cy="40" r="10" fill="#080810" stroke="#10B981" strokeWidth="3" />
                  {/* Outer Node i=1 (Green - Verified) */}
                  <circle cx="264" cy="100" r="10" fill="#080810" stroke="#10B981" strokeWidth="3" />
                  {/* Outer Node i=2 (Green - Verified) */}
                  <circle cx="264" cy="220" r="10" fill="#080810" stroke="#10B981" strokeWidth="3" />
                  
                  {/* Outer Node i=3 (Yellow - Misleading / Abstract Contradicts) */}
                  <circle cx="160" cy="280" r="10" fill="#080810" stroke="#F59E0B" strokeWidth="3" />
                  
                  {/* Outer Node i=4 (Red - Ghost Citation 404) */}
                  <circle cx="56" cy="220" r="10" fill="#080810" stroke="#EF4444" strokeWidth="3" />
                  {/* Outer Node i=5 (Red - Ghost Citation 404) */}
                  <circle cx="56" cy="100" r="10" fill="#080810" stroke="#EF4444" strokeWidth="3" />

                  {/* Center Base Anchor Node containing the Paper */}
                  <circle cx="160" cy="160" r="24" fill="#FFFFFF" className="filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
                  <text x="160" y="165" fill="#080810" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">MANUSCRIPT</text>

                  {/* Small inner decorations for nodes */}
                  <circle cx="160" cy="40" r="3" fill="#10B981" />
                  <circle cx="264" cy="100" r="3" fill="#10B981" />
                  <circle cx="264" cy="220" r="3" fill="#10B981" />
                  <circle cx="160" cy="280" r="3" fill="#F59E0B" />
                  <circle cx="56" cy="220" r="3" fill="#EF4444" />
                  <circle cx="56" cy="100" r="3" fill="#EF4444" />
                </svg>
              </div>

              {/* Dynamic HUD feedback inside right card */}
              <div className="mt-6 p-4.5 bg-black/50 border border-white/[0.06] rounded-2.5xl space-y-2">
                <div className="flex justify-between text-[11px] font-mono text-white/50">
                  <span>ANALYSIS LEVEL</span>
                  <span className="text-[#FF2D6B]">DEEP FLOW ENCRYPTED</span>
                </div>
                <div className="h-[1px] bg-white/10" />
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-white/40 font-mono">VERIFIED</p>
                    <p className="font-bold text-emerald-400 font-mono mt-0.5">3 / 6</p>
                  </div>
                  <div className="border-x border-white/10">
                    <p className="text-[10px] text-white/40 font-mono">MISLEADING</p>
                    <p className="font-bold text-amber-400 font-mono mt-0.5">1 / 6</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-mono">GHOSTS</p>
                    <p className="font-bold text-rose-500 font-mono mt-0.5">2 / 6</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* TRUST BAR */}
      <section className="relative py-12 px-6 sm:px-12 border-t border-b border-white/[0.08] bg-[#080810]/60 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-white/40 text-xs uppercase tracking-[0.08em] font-semibold text-center md:text-left">
            Trusted by research authors at world class institutes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-14">
            {["MIT", "Stanford", "Oxford", "IIT"].map((uni, idx) => (
              <span 
                key={idx} 
                className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white/20 select-none hover:text-white/85 transition-colors duration-300 cursor-default"
              >
                {uni}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION (Two Layers of Truth) */}
      <section id="features" className="py-28 px-6 sm:px-12 relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          
          {/* Header */}
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-[#FF2D6B] text-xs uppercase tracking-[0.08em] font-bold block">Rigorous Forensic Engine</span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">Two Layers of Truth</h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-[#FF2D6B] to-[#FF6B35] mx-auto mt-4" />
          </div>

          {/* Cards Grid */}
          <div className="grid lg:grid-cols-3 gap-8 items-stretch pt-4">
            
            {/* Card 1: Existence Check (Dimmed) */}
            <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-[28px] p-8 hover:-translate-y-2 hover:bg-white/[0.04] transition-all duration-300 relative group flex flex-col justify-between">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] p-0.5 flex items-center justify-center border border-white/10 group-hover:bg-white/[0.08] transition-colors">
                  <Layers className="w-6 h-6 text-white/50" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase text-[#FF6B35] tracking-[0.05em]">LAYER 01</p>
                  <h3 className="text-xl font-display font-semibold text-white">Existence Check</h3>
                  <p className="text-white/60 text-sm leading-relaxed font-light">
                    Every DOI parsed is verified live against registry catalogs. We confirm index registration in real-time through CrossRef, OpenAlex, and PubMed.
                  </p>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-white/[0.05] flex items-center gap-1.5 text-[10px] text-white/40">
                <span className="font-semibold">INDEX CHECKS:</span>
                <span className="text-white/80 font-bold">9.4M DATABASE RECORDS</span>
              </div>
            </div>

            {/* Card 2: Accuracy Check (HIGHLIGHTED - PINK GLOW) */}
            <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.01] hover:to-white/[0.03] backdrop-blur-md border-2 border-[#FF2D6B]/40 rounded-[28px] p-8 hover:-translate-y-2 transition-all duration-500 relative flex flex-col justify-between shadow-[0_0_40px_rgba(255,45,107,0.15)] group">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-[#FF2D6B] text-[#FFFFFF] text-[9px] tracking-[0.05em] uppercase rounded-full font-bold shadow-lg shadow-[#FF2D6B]/30">
                HOT AI MATCHING
              </span>
              
              <div className="space-y-6 mt-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FF2D6B]/15 flex items-center justify-center border border-[#FF2D6B]/40 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-[#FF2D6B]" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] uppercase text-[#FF2D6B] tracking-[0.05em] font-bold animate-pulse">LAYER 02</p>
                  <h3 className="text-xl font-display font-semibold text-white">Accuracy Check</h3>
                  <p className="text-white/80 text-sm leading-relaxed font-light">
                    Using advanced language models, we read the actual arguments of the cited text to prove whether it supports your citing claims or flatly contradicts them.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-[#FF2D6B]">
                <span className="font-semibold">ENGINES COMPILING:</span>
                <span className="text-white/90 font-bold">GROQ REAL-TIME AUDITING</span>
              </div>
            </div>

            {/* Card 3: Hallucination Score (Dimmed) */}
            <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-[28px] p-8 hover:-translate-y-2 hover:bg-white/[0.04] transition-all duration-300 relative group flex flex-col justify-between">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] p-0.5 flex items-center justify-center border border-white/10 group-hover:bg-white/[0.08] transition-colors">
                  <ShieldCheck className="w-6 h-6 text-white/50" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] uppercase text-[#7B2FBE] tracking-[0.05em] font-bold">INTEGRITY MATRIX</p>
                  <h3 className="text-xl font-display font-semibold text-white">Hallucinated Score</h3>
                  <p className="text-white/60 text-sm leading-relaxed font-light">
                    Get an instant rating from 0 to 100 on the credibility risk of your entire manuscript. Perfect for pre-submission checks prior to peer review.
                  </p>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-white/[0.05] flex items-center gap-1.5 text-[10px] text-white/40">
                <span className="font-semibold">RATING CLASSIFICATION:</span>
                <span className="text-white/80 font-bold">PRE-PEER PRESET METRICS</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-28 px-6 sm:px-12 bg-white/[0.01] border-t border-b border-white/[0.05] relative z-10 mb-8 overflow-visible">
        <div className="max-w-7xl mx-auto">
          
          {/* DESKTOP VIEW: Circular Orbit Constellation */}
          <div className="hidden lg:block relative min-h-[960px] w-full overflow-visible">
            
            {/* Left description text block - positioned on top left with z-index 1 */}
            <div className="absolute top-0 left-0 max-w-[340px] z-10 space-y-6 pointer-events-auto">
              <span className="text-[#FF2D6B] text-xs uppercase tracking-[0.08em] font-bold block">Frictionless Flow</span>
              <h2 className="text-3xl sm:text-4.5xl font-display font-black leading-tight text-white select-none">
                All-In-One Pipeline For Citation Truth
              </h2>
              <p className="text-white/60 font-light text-sm leading-relaxed">
                We compile manuscripts in seconds, identifying self-referencing loops, missing indices, and AI-fabricated references so your articles sail cleanly through publication.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => onNavigate('initiation', 'push')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF2D6B] hover:bg-[#ff1659] text-white rounded-full font-bold text-xs tracking-normal uppercase transition-all duration-300 shadow-md shadow-[#FF2D6B]/10 hover:shadow-[#FF2D6B]/25"
                >
                  Analyze Paper Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Orbit Constellation - Anchored in the center of the right layout */}
            <div className="absolute top-0 right-0 w-[680px] h-[900px] overflow-visible">
              <div className="relative w-[600px] h-[900px] mx-auto overflow-visible">
                
                {/* SVG orbiting line */}
                <svg width="600" height="900" viewBox="0 0 600 900" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 0, zIndex: 0, overflow: 'visible' }}>
                  <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur"/>
                      <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Static faint base circle arc — full circle, very dim */}
                  <circle
                    cx="300"
                    cy="450"
                    r="280"
                    fill="none"
                    stroke="rgba(255,45,107,0.15)"
                    strokeWidth="1.5"
                  />

                  {/* Animated flowing arc on top — same circle, moving dash */}
                  <circle
                    cx="300"
                    cy="450"
                    r="280"
                    fill="none"
                    stroke="#FF2D6B"
                    strokeWidth="2.5"
                    filter="url(#glow)"
                    strokeDasharray="60 1699"
                    style={{
                      animation: 'orbitFlow 4s linear infinite',
                      transformOrigin: '300px 450px'
                    }}
                  />

                  {/* Step Nodes circles with inner pulsing anim */}
                  {/* Step 1: y = 170 */}
                  <circle cx="300" cy="170" r="8" fill="#FF2D6B" filter="url(#glow)"/>
                  <circle cx="300" cy="170" r="16" fill="rgba(255,45,107,0.15)">
                    <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite"/>
                  </circle>

                  {/* Step 2: x = 580, y = 450 */}
                  <circle cx="580" cy="450" r="8" fill="#FF2D6B" filter="url(#glow)"/>
                  <circle cx="580" cy="450" r="16" fill="rgba(255,45,107,0.15)">
                    <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite"/>
                  </circle>

                  {/* Step 3: y = 730 */}
                  <circle cx="300" cy="730" r="8" fill="#FF2D6B" filter="url(#glow)"/>
                  <circle cx="300" cy="730" r="16" fill="rgba(255,45,107,0.15)">
                    <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite"/>
                  </circle>

                  {/* Step 4: x = 20, y = 450 */}
                  <circle cx="20" cy="450" r="8" fill="#FF2D6B" filter="url(#glow)"/>
                  <circle cx="20" cy="450" r="16" fill="rgba(255,45,107,0.15)">
                    <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite"/>
                  </circle>
                </svg>

                {/* Orbiting Step Cards */}
                {/* Step 1 (top): y=170, Card sits centered above it */}
                <div className="absolute w-[280px] bg-white/[0.02] backdrop-blur-md border border-white/[0.04] p-5.5 rounded-2.5xl space-y-2 hover:bg-white/[0.04] transition-all duration-300" style={{ top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 5 }}>
                  <p className="text-[10px] font-medium tracking-[0.05em] text-[#FF2D6B]">STEP 01</p>
                  <h4 className="text-base font-display font-semibold text-white">Upload PDF</h4>
                  <p className="text-white/60 text-xs font-light leading-relaxed">
                    Drag and drop your academic draft into our verified workspace portal. Your manuscripts are processed over private memory space.
                  </p>
                </div>

                {/* Step 2 (right): x=580, y=450, Card sits to the right */}
                <div className="absolute w-[280px] bg-white/[0.02] backdrop-blur-md border border-white/[0.04] p-5.5 rounded-2.5xl space-y-2 hover:bg-white/[0.04] transition-all duration-300" style={{ top: '380px', right: '-130px', zIndex: 5 }}>
                  <p className="text-[10px] font-medium tracking-[0.05em] text-[#7B2FBE]">STEP 02</p>
                  <h4 className="text-base font-display font-semibold text-white">Citations Extracted</h4>
                  <p className="text-white/60 text-xs font-light leading-relaxed">
                    Our document parsing engine automatically scans down bibliography lines, bibliography hooks, and parenthetical marks in seconds.
                  </p>
                </div>

                {/* Step 3 (bottom): y=730, Card sits centered below it */}
                <div className="absolute w-[280px] bg-white/[0.02] backdrop-blur-md border border-white/[0.04] p-5.5 rounded-2.5xl space-y-2 hover:bg-white/[0.04] transition-all duration-300" style={{ top: '775px', left: '50%', transform: 'translateX(-50%)', zIndex: 5 }}>
                  <p className="text-[10px] font-medium tracking-[0.05em] text-[#7B2FBE]">STEP 03</p>
                  <h4 className="text-base font-display font-semibold text-white">DOIs Verified</h4>
                  <p className="text-white/60 text-xs font-light leading-relaxed">
                    Each citation reference is mapped against global databases to guarantee the cited papers exist and retrieve metadata coordinates instantly.
                  </p>
                </div>

                {/* Step 4 (left): x=20, y=450, Card sits to the left */}
                <div className="absolute w-[280px] bg-white/[0.02] backdrop-blur-md border border-white/[0.04] p-5.5 rounded-2.5xl space-y-2 hover:bg-white/[0.04] transition-all duration-300" style={{ top: '380px', left: '-130px', zIndex: 5 }}>
                  <p className="text-[10px] font-medium tracking-[0.05em] text-[#FF6B35]">STEP 04</p>
                  <h4 className="text-base font-display font-semibold text-white">Claims Checked by AI</h4>
                  <p className="text-white/60 text-xs font-light leading-relaxed">
                    State-of-the-art NLP matches the context sentence in your draft against the findings inside the original cited text. Outliers are instantly highlighted.
                  </p>
                </div>

              </div>
            </div>

          </div>

          {/* MOBILE VIEW: Traditional vertical stacked pipeline list */}
          <div className="block lg:hidden space-y-16">
            
            {/* Description stacked on top */}
            <div className="space-y-6">
              <span className="text-[#FF2D6B] text-xs uppercase tracking-[0.08em] font-bold block">Frictionless Flow</span>
              <h2 className="text-3xl sm:text-4.5xl font-display font-black leading-tight text-white">
                All-In-One Pipeline For Citation Truth
              </h2>
              <p className="text-white/60 font-light text-sm sm:text-base leading-relaxed">
                We compile manuscripts in seconds, identifying self-referencing loops, missing indices, and AI-fabricated references so your articles sail cleanly through publication.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => onNavigate('initiation', 'push')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF2D6B] hover:bg-[#ff1659] text-white rounded-full font-bold text-xs tracking-normal uppercase transition-all duration-300 shadow-md shadow-[#FF2D6B]/10 hover:shadow-[#FF2D6B]/25"
                >
                  Analyze Paper Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vertical timeline card collection */}
            <div className="relative pl-8 md:pl-10 space-y-12">
              <div className="absolute left-[13px] md:left-[21px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#FF2D6B] via-[#7B2FBE] to-[#FF6B35] filter drop-shadow-[0_0_8px_rgba(255,45,107,0.3)]" />

              {/* Step 1 */}
              <div className="relative group">
                <div className="absolute -left-[27px] md:-left-[35px] top-1.5 w-[14px] h-[14px] rounded-full bg-[#080810] border-2 border-[#FF2D6B] group-hover:scale-125 transition-transform z-10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF2D6B] animate-ping" />
                </div>
                <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.04] p-6 rounded-2xl space-y-2">
                  <p className="text-xs font-medium tracking-[0.05em] text-[#FF2D6B]">STEP 01</p>
                  <h4 className="text-base font-display font-semibold text-white">Upload PDF</h4>
                  <p className="text-white/60 text-sm font-light">
                    Drag and drop your academic draft into our verified workspace portal. Your manuscripts are processed over private memory space.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="absolute -left-[27px] md:-left-[35px] top-1.5 w-[14px] h-[14px] rounded-full bg-[#080810] border-2 border-[#7B2FBE] group-hover:scale-125 transition-transform z-10" />
                <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.04] p-6 rounded-2xl space-y-2">
                  <p className="text-xs font-medium tracking-[0.05em] text-[#7B2FBE]">STEP 02</p>
                  <h4 className="text-base font-display font-semibold text-white">Citations Extracted</h4>
                  <p className="text-white/60 text-sm font-light">
                    Our document parsing engine automatically scans down bibliography lines, bibliography hooks, and parenthetical marks in seconds.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="absolute -left-[27px] md:-left-[35px] top-1.5 w-[14px] h-[14px] rounded-full bg-[#080810] border-2 border-[#7B2FBE] group-hover:scale-125 transition-transform z-10" />
                <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.04] p-6 rounded-2xl space-y-2">
                  <p className="text-xs font-medium tracking-[0.05em] text-[#7B2FBE]">STEP 03</p>
                  <h4 className="text-base font-display font-semibold text-white">DOIs Verified</h4>
                  <p className="text-white/60 text-sm font-light">
                    Each citation reference is mapped against global databases to guarantee the cited papers exist and retrieve metadata coordinates instantly.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative group">
                <div className="absolute -left-[27px] md:-left-[35px] top-1.5 w-[14px] h-[14px] rounded-full bg-[#080810] border-2 border-[#FF6B35] group-hover:scale-125 transition-transform z-10" />
                <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.04] p-6 rounded-2xl space-y-2">
                  <p className="text-xs font-medium tracking-[0.05em] text-[#FF6B35]">STEP 04</p>
                  <h4 className="text-base font-display font-semibold text-white">Claims Checked by AI</h4>
                  <p className="text-white/60 text-sm font-light">
                    State-of-the-art NLP matches the context sentence in your draft against the findings inside the original cited text. Outliers are instantly highlighted.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* LIVE STATS BAR */}
      <section className="py-24 px-6 sm:px-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            
            {/* Stat Card 1 */}
            <div className="bg-[#080810]/40 backdrop-blur-sm border border-white/[0.06] rounded-[24px] p-8 text-center relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF2D6B] to-transparent opacity-40 group-hover:opacity-75 transition-opacity" />
              <p className="text-white/40 text-[10px] uppercase tracking-[0.05em] font-semibold">DISCOVERED AUDITS</p>
              <h3 className="text-4xl sm:text-5xl font-display font-bold text-white mt-3 select-none">
                {ghostCount.toLocaleString()}+
              </h3>
              <p className="text-white/60 text-sm font-light mt-2">Ghost Citations Discovered</p>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-[#080810]/40 backdrop-blur-sm border border-white/[0.06] rounded-[24px] p-8 text-center relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7B2FBE] to-transparent opacity-40 group-hover:opacity-75 transition-opacity" />
              <p className="text-white/40 text-[10px] uppercase tracking-[0.05em] font-semibold">REGISTRY SYNCHRONIZATION</p>
              <h3 className="text-4xl sm:text-5xl font-display font-bold text-[#10B981] mt-3 select-none">
                {existenceAccuracy}%
              </h3>
              <p className="text-white/60 text-sm font-light mt-2">Existence Verification Accuracy</p>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-[#080810]/40 backdrop-blur-sm border border-white/[0.06] rounded-[24px] p-8 text-center relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF6B35] to-transparent opacity-40 group-hover:opacity-75 transition-opacity" />
              <p className="text-white/40 text-[10px] uppercase tracking-[0.05em] font-semibold">SEMANTIC NLP PRECISION</p>
              <h3 className="text-4xl sm:text-5xl font-display font-bold text-[#FF6B35] mt-3 select-none">
                {claimAccuracy}%
              </h3>
              <p className="text-white/60 text-sm font-light mt-2">Claim Support Claim Accuracy</p>
            </div>

          </div>

        </div>
      </section>

      {/* DEMO SECTION REMOVED */}

      {/* PRICING SECTION */}
      <section id="pricing" className="py-28 px-6 sm:px-12 relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-[#FF2D6B] font-mono text-xs uppercase tracking-[0.3em] block">Accessible Access</span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">Structured Plans</h2>
            <p className="text-white/60 text-sm">Clear pricing for single researchers or research labs</p>
            <div className="w-16 h-[2px] bg-gradient-to-r from-[#FF2D6B] to-[#7B2FBE] mx-auto mt-4" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            
            {/* Plan 1 */}
            <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-3xl p-8 flex flex-col justify-between group hover:border-white/10 transition-colors">
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-display font-semibold text-white/50">Scholar Basic</h4>
                  <h3 className="text-3xl font-display font-extrabold text-white mt-1">Free</h3>
                  <p className="text-xs text-white/40 mt-1">Analyze standard drafts instantly</p>
                </div>
                <div className="h-[1px] bg-white/[0.05]" />
                <ul className="space-y-3.5 text-xs text-white/70">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> 3 manuscript checks per month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> Automated DOI Existence auditing</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> Citation count summary charts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> Scrubbed memory space</li>
                </ul>
              </div>
               <button 
                onClick={() => onNavigate('initiation', 'push')}
                className="w-full mt-8 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold text-xs tracking-normal uppercase transition-colors cursor-pointer text-center"
              >
                Get Started Free
              </button>
            </div>

            {/* Plan 2: Highlighted */}
            <div className="bg-[#0c0c16] backdrop-blur-md border-2 border-[#FF2D6B] rounded-3xl p-8 flex flex-col justify-between relative shadow-[0_0_40px_rgba(255,45,107,0.15)]">
              <span className="absolute -top-3 right-6 px-3.5 py-1 bg-gradient-to-r from-[#FF2D6B] to-[#FF6B35] text-white text-[9px] tracking-[0.05em] uppercase rounded-full font-bold shadow-lg">
                MOST POPULAR
              </span>
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-display font-semibold text-[#FF2D6B]">Investigator Pro</h4>
                  <h3 className="text-3xl font-display font-extrabold text-white mt-1">$49<span className="text-sm font-medium text-white/50">/mo</span></h3>
                  <p className="text-xs text-white/40 mt-1">For active paper authors and reviewers</p>
                </div>
                <div className="h-[1px] bg-white/10" />
                <ul className="space-y-3.5 text-xs text-white/80">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> <strong>Unlimited</strong> manuscript submissions</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> Complete 2-layer AI text matches</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> Detailed contradiction logs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> Priority Crossref API connections</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> Exclude-self Citation analyzer</li>
                </ul>
              </div>
              <button 
                onClick={() => onNavigate('initiation', 'push')}
                className="w-full mt-8 py-3 rounded-full bg-[#FF2D6B] text-white font-bold text-xs tracking-normal uppercase hover:bg-[#ff1659] hover:scale-102 transition-transform cursor-pointer text-center shadow-md shadow-[#FF2D6B]/20 pointer"
              >
                Unlock Pro Access
              </button>
            </div>

            {/* Plan 3 */}
            <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-3xl p-8 flex flex-col justify-between group hover:border-white/10 transition-colors md:col-span-2 lg:col-span-1">
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-display font-semibold text-white/50">University Division</h4>
                  <h3 className="text-3xl font-display font-extrabold text-white mt-1">$299<span className="text-sm font-medium text-white/50">/mo</span></h3>
                  <p className="text-xs text-white/40 mt-1">Multi-seat verification for university labs</p>
                </div>
                <div className="h-[1px] bg-white/[0.05]" />
                <ul className="space-y-3.5 text-xs text-white/70">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> Up to <strong>40 seats</strong> per lab group</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> Dedicated workspace admin dashboards</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> Turnitin & retraction webhook pings</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> Custom metadata taxonomy keys</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF2D6B]" /> Priority enterprise support SLAs</li>
                </ul>
              </div>
              <a 
                href="mailto:contact@citationghost.app"
                className="w-full mt-8 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold text-xs tracking-normal uppercase transition-colors cursor-pointer text-center block"
              >
                Contact Institution
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-32 px-6 sm:px-12 relative z-10 bg-gradient-to-t from-[#05050c] to-transparent overflow-hidden">
        
        {/* Dynamic mesh lines beneath CTA */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none flex justify-center items-center">
          <div className="w-[120vw] h-[120vw] border border-dashed border-white/20 rounded-full animate-spin duration-[60s]" />
          <div className="w-[80vw] h-[80vw] absolute border border-dotted border-white/10 rounded-full animate-spin duration-[40s] reverse" />
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-4xl sm:text-5xl font-display font-bold leading-tight text-white">
            Ready to Find the Ghosts?
          </h2>
          <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-normal">
            No account or credit card needed. Upload your academic research draft in PDF format now and audit references under 60 seconds.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => onNavigate('initiation', 'push')}
              onMouseEnter={() => setIsCtaHovered(true)}
              onMouseLeave={() => setIsCtaHovered(false)}
              className="px-10 py-5 bg-gradient-to-r from-[#FF2D6B] to-[#FF6B35] rounded-full text-white font-bold text-sm tracking-normal uppercase shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer glow-pink-btn flex items-center gap-2.5 mx-auto"
            >
              Analyze Your Paper Free 
              <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isCtaHovered ? 'translate-x-1.5' : ''}`} />
            </button>
          </div>
          <p className="text-white/35 text-[11px] font-semibold tracking-[0.02em]">
            *Processed securely in high speed volatile RAM. Papers scrubbed off instantly.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.08] bg-[#05050c] relative z-10 py-16 px-6 sm:px-12 text-white/50 text-xs">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10">
          
          <div className="md:col-span-5 space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF2D6B] via-[#7B2FBE] to-[#FF6B35] p-[1.2px] flex items-center justify-center">
                <div className="w-full h-full bg-[#080810] rounded-[7px] flex items-center justify-center text-white text-xs font-semibold">
                  👻
                </div>
              </div>
              <span className="text-base font-display font-bold tracking-tight text-white">
                CitationGhost
              </span>
            </div>
            
            <p className="text-[#fbdae1]/45 leading-relaxed max-w-sm font-normal">
              Bringing forensic biological, physiological, and technical precision to global academic bibliography chains.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[10px] uppercase tracking-wider text-white font-bold">RESOURCES</h4>
            <div className="space-y-2 flex flex-col text-white/60">
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#features" className="hover:text-white transition-colors">Integrity Layers</a>
              <button onClick={(e) => { e.preventDefault(); onOpenDemo(); }} className="hover:text-white transition-colors text-left bg-transparent border-none p-0 outline-none text-white/60 text-xs cursor-pointer">Interactive Draft Scan</button>
              <a href="#pricing" className="hover:text-white transition-colors">Forensic Pricing</a>
            </div>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="text-[10px] uppercase tracking-wider text-white font-bold">CONNECT & LEGAL</h4>
            <div className="flex items-center gap-4 text-white/60">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                <Github className="w-4 h-4" /> GitHub
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                <Twitter className="w-4 h-4" /> Twitter
              </a>
              <a href="mailto:contact@citationghost.app" className="hover:text-white transition-colors flex items-center gap-1">
                <Mail className="w-4 h-4" /> contact@citationghost.app
              </a>
            </div>
            <p className="text-[10px] text-white/30 leading-relaxed font-normal">
              © 2026 CitationGhost. All scholarly rights reserved. Crossref API & PubMed indexing powered by real-time federation servers.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
