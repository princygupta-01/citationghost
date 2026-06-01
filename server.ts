import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { PDFParse } from 'pdf-parse';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3000;
const FASTAPI_BASE = process.env.BACKEND_API_BASE_URL || 'http://localhost:8000/api';

function timing(label: string, startedAt?: number): number {
  if (startedAt) {
    console.log(`[TIMING] ${label} end duration_ms=${Date.now() - startedAt}`);
    return startedAt;
  }
  console.log(`[TIMING] ${label} start t=${new Date().toISOString()}`);
  return Date.now();
}

// Enable JSON bodies up to 50MB for base64 PDFs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Standard native CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-Memory Report Cache/Database
let scanReports: any[] = [];

// Seed database with default reports
const DEFAULT_REPORTS = [
  {
    id: 'report-1',
    fileName: 'Vitamin_D_Cognitive_Enhancement_v2.pdf',
    paperTitle: 'The Effect of Vitamin D on Cognitive Performance',
    date: '2026-05-29 10:14',
    score: 94.8,
    verifiedCount: 142,
    weakCount: 12,
    hallucinatedCount: 3,
    confidenceIndex: 99.2,
    processingTime: 1.4,
    citations: [
      { id: '#01', title: 'Attention Is All You Need', journal: 'NIPS Proceedings, 2017', status: 'Verified', score: 98 },
      { id: '#09', title: 'Generative Models in High Energy Physics', journal: 'Physical Review Letters, 2023', status: 'Verified', score: 92 },
      { id: '#12', title: 'Probabilistic Graphical Models for Biology', journal: 'Oxford BioPress, 2021', status: 'Weak Evidence', score: 45 },
      { id: '#42', title: 'Neural Architectures in LLM Hallucination', journal: 'Journal of Computational Neurodynamics, 2024', status: 'Hallucinated', score: 12 }
    ],
    alerts: [
      { id: '1', title: 'Missing DOI for Ref #42', description: 'The source URL returns a 404. Identity could not be verified.', severity: 'high' },
      { id: '2', title: 'Source Contradiction in Section 3.1', description: 'Claimed result "p < 0.05" differs from actual source "p = 0.12".', severity: 'medium' },
      { id: '3', title: 'Hallucinated Author Attribution', description: '"Dr. Silas Vance" has no publication record for the cited journal.', severity: 'high' }
    ]
  },
  {
    id: 'report-2',
    fileName: 'Quantum_Computing_Cryptographic_Defense.pdf',
    paperTitle: 'Quantum Key Distribution and Post-Quantum Cryptographical Systems',
    date: '2026-05-28 17:35',
    score: 81.2,
    verifiedCount: 88,
    weakCount: 27,
    hallucinatedCount: 6,
    confidenceIndex: 91.5,
    processingTime: 2.1,
    citations: [
      { id: '#03', title: 'Post-Quantum Cryptography Architectures', journal: 'IEEE Trans on Info Theory, 2020', status: 'Verified', score: 95 },
      { id: '#15', title: 'Shor\'s Algorithm on Noisy Intermediate-Scale Quantum Computers', journal: 'Nature Physics, 2021', status: 'Verified', score: 91 },
      { id: '#22', title: 'Synthetic Lattice-Based Cryptography Signatures', journal: 'Journal of Cryptology, 2022', status: 'Weak Evidence', score: 58 },
      { id: '#37', title: 'A Polynomial-Time Solution to Lattice Decoding', journal: 'International Journal of Advanced Cryptography, 2025', status: 'Hallucinated', score: 8 }
    ],
    alerts: [
      { id: '1', title: 'Retracted Paper Citation in Bibliography', description: 'Ref #22 was retracted by editors in Feb 2024.', severity: 'medium' },
      { id: '2', title: 'Hallucinated Lattice Solvers', description: 'Ref #37 "A Polynomial-Time Solution to Lattice Decoding" has no DOI or publisher record.', severity: 'high' }
    ]
  },
  {
    id: 'report-3',
    fileName: 'SARS_CoV_2_Transmission_Dynamics.pdf',
    paperTitle: 'Epidemiological Modeling and Spatiotemporal Transmission Dynamics',
    date: '2026-05-27 11:22',
    score: 100.0,
    verifiedCount: 210,
    weakCount: 0,
    hallucinatedCount: 0,
    confidenceIndex: 99.9,
    processingTime: 3.2,
    citations: [
      { id: '#01', title: 'A Model of SARS-CoV-2 Spread Tendencies', journal: 'The Lancet Infectious Diseases, 2020', status: 'Verified', score: 100 },
      { id: '#02', title: 'Global Pandemic Dynamics and Intervention Effects', journal: 'Science, 2020', status: 'Verified', score: 99 }
    ],
    alerts: []
  }
];

// Initialize scan reports with the defaults
scanReports.push(...DEFAULT_REPORTS);

// Procedural generator for simulated scans
function generateProceduralReport(fileName: string): any {
  const rawName = fileName.replace(/\.[^/.]+$/, ""); // strip extension
  const words = rawName.split(/[-_]+/);
  const paperTitle = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const scores = [84.8, 89.1, 94.8, 100.0, 76.5];
  const score = scores[Math.floor(Math.random() * scores.length)];

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

  const citations = [
    { id: '#01', title: 'Attention Is All You Need', journal: 'NIPS Proceedings, 2017', status: 'Verified', score: 98 },
    { id: '#04', title: 'Deep Generative Adversarial Networks', journal: 'IEEE Trans Pattern Anal, 2018', status: 'Verified', score: 96 }
  ];

  if (weak > 0) {
    citations.push({ id: '#12', title: 'Probabilistic Graphical Models for Biology', journal: 'Oxford BioPress, 2021', status: 'Weak Evidence', score: 45 });
  }
  if (weak > 15) {
    citations.push({ id: '#22', title: 'Self-Supervised Contrastive Representation Learning', journal: 'ICML Research Ledger, 2020', status: 'Weak Evidence', score: 51 });
  }
  if (hallucinated > 0) {
    citations.push({ id: '#42', title: 'Neural Architectures in LLM Hallucination', journal: 'Journal of Computational Neurodynamics, 2024', status: 'Hallucinated', score: 12 });
  }

  const alerts: any[] = [];
  if (hallucinated > 0) {
    alerts.push({
      id: '1',
      title: 'Missing DOI / Hallucinated Reference',
      description: 'Ref #42 has been flagged. Title matches typical language model hallucination structures and has no crossref record.',
      severity: 'high'
    });
  }
  if (weak > 0) {
    alerts.push({
      id: '12-contra',
      title: 'Claim Contradiction Found',
      description: 'Citation claims biological efficacy, while the actual cited paper abstract states "no statistically verified significance (p=0.12)".',
      severity: 'medium'
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
}

function extractJsonBlock(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const arrayStart = raw.indexOf('[');
  const arrayEnd = raw.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return raw.slice(arrayStart, arrayEnd + 1);
  }

  const objectStart = raw.indexOf('{');
  const objectEnd = raw.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd > objectStart) {
    return raw.slice(objectStart, objectEnd + 1);
  }

  return raw.trim();
}

async function callGroq(YOUR_PROMPT_HERE: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured. Add it to .env and restart the server.');
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: YOUR_PROMPT_HERE }],
      max_tokens: 1000
    })
  });
  const data: any = await res.json();

  if (!res.ok) {
    throw new Error(`Groq API error: ${res.status} ${JSON.stringify(data)}`);
  }

  const result = data.choices?.[0]?.message?.content;
  if (!result) {
    throw new Error(`Groq API returned no message content: ${JSON.stringify(data)}`);
  }

  return result;
}

async function extractTextFromPdf(pdfBase64: string): Promise<string> {
  const started = timing('PDF text extraction');
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  const parser = new PDFParse({ data: pdfBuffer });
  const parsed = await parser.getText();
  await parser.destroy();
  const text = parsed.text.replace(/\s+/g, ' ').trim();
  timing('PDF text extraction', started);
  return text;
}

async function extractCitationsWithGroq(pdfBase64: string, filename: string): Promise<any[]> {
  const manuscriptText = await extractTextFromPdf(pdfBase64);
  if (!manuscriptText) {
    throw new Error('Could not extract text from PDF.');
  }

  const prompt = `You are CitationGhost's citation extraction engine.
Analyze the uploaded manuscript text and extract up to 8 bibliography references.

Filename: ${filename}
Manuscript text:
${manuscriptText.slice(0, 45000)}

Return ONLY a valid JSON array. Each item must use this exact shape:
{ "index": string, "title": string, "year": number | null, "doi": string | null, "claim": string, "raw_text": string }

If you cannot determine a value, use null for year/doi and concise best-effort text for other fields.`;

  const result = await callGroq(prompt);
  const parsed = JSON.parse(extractJsonBlock(result));
  if (!Array.isArray(parsed)) {
    throw new Error('Groq citation extraction did not return a JSON array.');
  }

  return parsed;
}

async function verifyClaimWithGroq(
  claim: string,
  paperTitle: string,
  abstract: string,
  citationCount?: number | string,
  year?: number | string
): Promise<{ verdict: 'Verified' | 'Weak Evidence' | 'Contradicts'; confidence: number; reason: string }> {
  const prompt = `Analyze academic statement matching.
Citing Statement in Paper: "${claim}"
Sourced Article Title: "${paperTitle}"
Sourced Article Abstract: "${abstract.slice(0, 1000)}"
Citation Count: ${citationCount || 'Unknown'}
Publication Year: ${year || 'Unknown'}

Does the abstract support, contradict, or have very little/weak evidence for the claiming statement?
Return ONLY a valid JSON object:
{
  "verdict": "Verified" | "Weak Evidence" | "Contradicts",
  "confidence": number,
  "reason": "precise explanation of verdict in 1 sentence"
}`;

  const result = await callGroq(prompt);
  const parsed = JSON.parse(extractJsonBlock(result));

  return {
    verdict: ['Verified', 'Weak Evidence', 'Contradicts'].includes(parsed.verdict) ? parsed.verdict : 'Weak Evidence',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 60,
    reason: parsed.reason || 'Verification completed with standard confidence.',
  };
}

// ---------------------- API REQUEST HANDLERS ----------------------

// Server health check with provider status
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasGroqKey: !!process.env.GROQ_API_KEY,
    currentProvider: 'Groq',
    providers: [{ name: 'Groq', available: !!process.env.GROQ_API_KEY }]
  });
});

// Provider status and management endpoint
app.get('/api/providers', (req, res) => {
  res.json({
    currentProvider: 'Groq',
    providers: [{ name: 'Groq', available: !!process.env.GROQ_API_KEY }],
    availableKeys: {
      groq: !!process.env.GROQ_API_KEY,
    }
  });
});

// Provider reset is a no-op because Groq is the only configured provider.
app.post('/api/providers/reset', async (req, res) => {
  res.json({ 
    success: true, 
    currentProvider: 'Groq' 
  });
});

// List all reports
app.get('/api/reports', (req, res) => {
  res.json(scanReports);
});

// Get detailed report
app.get('/api/reports/:id', (req, res) => {
  const report = scanReports.find(r => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

// Delete report from history
app.delete('/api/reports/:id', (req, res) => {
  scanReports = scanReports.filter(r => r.id !== req.params.id);
  res.json({ success: true, id: req.params.id });
});

// Clear history
app.post('/api/reports/clear', (req, res) => {
  scanReports = [];
  res.json({ success: true });
});

// Real/Simulated PDF Citation Scanning Engine
app.post('/api/analyze', async (req, res) => {
  const { filename, base64Data, isMock } = req.body;
  const startTime = Date.now();
  const reportStarted = timing('Report generation');

  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  if (!process.env.GROQ_API_KEY && !isMock) {
    return res.status(500).json({ 
      error: 'Groq provider not configured', 
      analysisMode: 'UNAVAILABLE',
      message: 'Real analysis requires GROQ_API_KEY in .env. Groq is the only supported provider.',
      providers: [{ name: 'Groq', available: false }]
    });
  }

  if (!base64Data && !isMock) {
    return res.status(400).json({ 
      error: 'No PDF data provided', 
      analysisMode: 'UNAVAILABLE',
      message: 'Real analysis requires PDF file upload'
    });
  }

  // Only allow explicit demo mode
  if (isMock) {
    console.log(`[ANALYZER] Running DEMO MODE for ${filename}`);
    const simulatedReport = generateProceduralReport(filename);
    simulatedReport.analysisMode = 'SIMULATED';
    
    // Cache it in our in-memory list
    scanReports.unshift(simulatedReport);
    return res.json(simulatedReport);
  }

  try {
    const backendStarted = timing('FastAPI analyze proxy');
    const backendResponse = await fetch(`${FASTAPI_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, base64Data, isMock: false }),
    });
    timing('FastAPI analyze proxy', backendStarted);
    const report = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return res.status(backendResponse.status).json(report ?? {
        error: 'Backend error',
        message: 'Backend returned an invalid error payload.',
      });
    }

    if (!report || !report.stats && typeof report.totalExtracted === 'undefined') {
      return res.status(502).json({
        error: 'Invalid backend report',
        analysisMode: 'FAILED',
        message: 'Backend returned a report without stats or totals.',
      });
    }

    scanReports.unshift(report);
    timing('Report generation', reportStarted);
    return res.json(report);
  } catch (err: any) {
    return res.status(502).json({
      error: 'Backend unavailable',
      analysisMode: 'UNAVAILABLE',
      message: `Could not reach FastAPI backend at ${FASTAPI_BASE}: ${err?.message || 'unknown error'}`,
    });
  }

  // REAL INTEGRITY PIPELINE WITH GROQ ONLY
  try {
    console.log(`[ANALYZER] Beginning multi-modal citation analysis on ${filename}...`);

    // STEP 1: Extract citations using Groq only
    const rawCitations = await extractCitationsWithGroq(base64Data, filename);
    
    console.log(`[ANALYZER] Extracted ${rawCitations.length} citations using Groq`);

    if (!Array.isArray(rawCitations) || rawCitations.length === 0) {
      throw new Error('Unable to extract structured references from PDF.');
    }

    // STEP 2 & 3: Resolve DOIs via CrossRef & analyze claims semantic intent
    const citations: any[] = [];
    let crossrefStatus = 'OK';
    let semanticScholarStatus = 'OK';
    let verifiedCount = 0;
    let weakCount = 0;
    let hallucinatedCount = 0;
    const alerts: any[] = [];

    for (const cite of rawCitations) {
      const indexStr = cite.index || 'unspecified';
      const parsedDoi = cite.doi || null;
      const parsedTitle = cite.title || 'Untitled Reference';
      const claim = cite.claim || '';
      const rawText = cite.raw_text || '';

      let doiResolves = false;
      let crossrefMeta: any = null;
      let semanticScholarMeta: any = null;
      let apiErrorThisCitation = false;

      // Try CrossRef DOI check
      if (parsedDoi) {
        try {
          const cleanDoi = encodeURIComponent(parsedDoi.trim());
          const crossrefRes = await fetch(`https://api.crossref.org/works/${cleanDoi}`);
          if (crossrefRes.ok) {
            const data = await crossrefRes.json();
            crossrefMeta = data.message;
            doiResolves = true;
          } else {
            crossrefStatus = 'ERROR';
            apiErrorThisCitation = true;
          }
        } catch (err) {
          console.error(`[CrossRef Error] Failed to resolve DOI ${parsedDoi}`, err);
          crossrefStatus = 'ERROR';
          apiErrorThisCitation = true;
        }
      }

      // If CrossRef failed but we have a title, query CrossRef title search as fallback
      if (!doiResolves && parsedTitle) {
        try {
          const searchTitle = encodeURIComponent(parsedTitle);
          const searchRes = await fetch(`https://api.crossref.org/works?query=${searchTitle}&rows=1`);
          if (searchRes.ok) {
            const data = await searchRes.json();
            const topMatch = data.message?.items?.[0];
            if (topMatch) {
              const score = topMatch.score || 0;
              // Title must be decently matching (greater than some standard indexing strength)
              if (score > 60) {
                crossrefMeta = topMatch;
                doiResolves = true;
              }
            }
          } else {
            crossrefStatus = 'ERROR';
            apiErrorThisCitation = true;
          }
        } catch (err) {
          console.error(`[CrossRef Search Error] Title query failed`, err);
          crossrefStatus = 'ERROR';
          apiErrorThisCitation = true;
        }
      }

      // Try Semantic Scholar search for additional metadata and abstract
      if (parsedTitle) {
        try {
          const semanticTitle = encodeURIComponent(parsedTitle);
          const semanticRes = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${semanticTitle}&limit=1&fields=title,abstract,citationCount,year,authors`);
          if (semanticRes.ok) {
            const semanticData = await semanticRes.json();
            const topResult = semanticData.data?.[0];
            if (topResult && topResult.title) {
              semanticScholarMeta = topResult;
              console.log(`[Semantic Scholar] Found metadata for: ${topResult.title}`);
            }
          } else {
            semanticScholarStatus = 'ERROR';
            apiErrorThisCitation = true;
          }
        } catch (err) {
          console.error(`[Semantic Scholar Error] Search failed for ${parsedTitle}`, err);
          semanticScholarStatus = 'ERROR';
          apiErrorThisCitation = true;
        }
      }

      // STEP 4: Call Groq semantic alignment engine to cross-correlate abstract supporting claim
      let verdict = 'WEAK_EVIDENCE';
      let confidenceScore = 50;
      let explanation = 'Unverified reference';

      if (doiResolves && (crossrefMeta || semanticScholarMeta)) {
        const refTitle = crossrefMeta?.title?.[0] || semanticScholarMeta?.title || parsedTitle;
        // Prefer Semantic Scholar abstract, fallback to CrossRef
        const refAbstract = semanticScholarMeta?.abstract || crossrefMeta?.abstract || 'No abstract available from sources.';
        const citationCount = semanticScholarMeta?.citationCount || 'Unknown';
        const year = semanticScholarMeta?.year || crossrefMeta?.published?.['date-parts']?.[0]?.[0] || 'Unknown';

        try {
          const verificationResult = await verifyClaimWithGroq(
            claim,
            refTitle,
            refAbstract,
            citationCount,
            year
          );
          
          verdict = verificationResult.verdict;
          confidenceScore = verificationResult.confidence;
          explanation = `${verificationResult.reason} (via Groq)`;
          
          console.log(`[ANALYZER] Claim verified using Groq: ${verdict}`);
          
        } catch (verifyError) {
          console.error('[ANALYZER] Groq failed for claim verification:', verifyError);
          verdict = 'Weak Evidence';
          confidenceScore = 50;
          explanation = 'Verification failed - Groq unavailable or returned invalid output.';
        }

        if (verdict === 'Verified') {
          verifiedCount++;
        } else if (verdict === 'Contradicts') {
          hallucinatedCount++;
          alerts.push({
            id: `alert-${indexStr}`,
            title: `Claim Contradiction on Ref #${indexStr}`,
            description: `The source abstract contradicts claims made here: "${explanation}"`,
            severity: 'high',
          });
        } else {
          weakCount++;
        }
      } else {
        if (apiErrorThisCitation) {
          // APIs failed, so we can't definitively call it hallucinated
          verdict = 'UNVERIFIED';
          confidenceScore = 0;
          weakCount++;
          explanation = `External service unavailable. Could not verify reference metadata.`;
          
          alerts.push({
            id: `alert-${indexStr}`,
            title: `Service Unavailable (Ref #${indexStr})`,
            description: `CrossRef or Semantic Scholar could not be reached to verify this citation.`,
            severity: 'medium',
          });
        } else {
          // DOI could not resolve -> Hallucinated citation
          verdict = 'Hallucinated';
          confidenceScore = 95;
          hallucinatedCount++;
          explanation = `Reference DOI/title has no searchable registration in CrossRef metadata registries.`;
          
          alerts.push({
            id: `alert-${indexStr}`,
            title: `Hallucinated Citation Flagged (Ref #${indexStr})`,
            description: `No DOIs register found in CrossRef database. Potentially hallucinated by LLM or manual typo limit warning.`,
            severity: 'high',
          });
        }
      }

      citations.push({
        id: `#${indexStr}`,
        title: parsedTitle,
        journal: crossrefMeta?.['container-title']?.[0] || 'Unknown Academic Venue',
        status: verdict,
        score: confidenceScore,
        claim,
        reason: explanation,
        citationCount: semanticScholarMeta?.citationCount,
        year: semanticScholarMeta?.year || crossrefMeta?.published?.['date-parts']?.[0]?.[0],
        sources: {
          crossref: !!crossrefMeta,
          semanticScholar: !!semanticScholarMeta
        }
      });
    }

    // Build real final integrity report metadata
    const processingTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));
    const totalCount = citations.length;
    const finalScore = totalCount === 0 ? 100 : Math.round(
      ((verifiedCount * 1.0 + weakCount * 0.4) / totalCount) * 100
    );

    const fullReport = {
      id: 'report-' + Date.now(),
      fileName: filename,
      paperTitle: filename.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      score: finalScore,
      verifiedCount,
      weakCount,
      hallucinatedCount,
      confidenceIndex: parseFloat((85 + Math.random() * 14).toFixed(1)),
      processingTime,
      citations,
      alerts,
      analysisMode: (crossrefStatus === 'ERROR' || semanticScholarStatus === 'ERROR') ? 'PARTIAL' : 'REAL',
      groqStatus: 'OK',
      crossrefStatus,
      semanticScholarStatus,
      totalExtracted: totalCount,
      totalResolved: verifiedCount + weakCount
    };

    scanReports.unshift(fullReport);
    res.json(fullReport);

  } catch (error: any) {
    console.error('[REAL ANALYZER FAIL] Analysis failed:', error);
    return res.status(500).json({
      error: 'Analysis pipeline failed',
      analysisMode: 'FAILED',
      message: `Real analysis failed: ${error.message}`,
      details: error.toString()
    });
  }
});

// ---------------------- VITE AND PRODUCTION SERVING ----------------------

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const buildPath = path.join(process.cwd(), 'dist');
    app.use(express.static(buildPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CitationGhost] Full-stack server active on port ${PORT}`);
  });
}

start();
