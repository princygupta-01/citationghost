export type ScreenType = 'landing' | 'initiation' | 'results';
export type TransitionType = 'push' | 'push_back' | 'slide_up' | 'none';

export interface ScanCard {
  id: string;
  type: 'verified' | 'hallucinated' | 'weak';
  text: string;
}

export interface MetricCard {
  label: string;
  value: string;
  change: string;
  type: 'verified' | 'weak' | 'hallucinated' | 'score';
}

export interface CitationLog {
  id: string;
  title?: string | null;
  reference?: string | null;
  journal?: string | null;
  venue?: string | null;
  authors?: string | null;
  year?: string | null;
  doi?: string | null;
  doi_exists?: boolean | null;
  abstract_found?: boolean | null;
  abstract?: string | null;
  verdict?: string | null;
  status: 'Verified' | 'Weak Evidence' | 'Fabricated Citation' | 'Contradicted' | 'Unverified' | 'Hallucinated' | 'UNVERIFIED' | 'DOI Verified' | 'Invalid Match' | 'Non-Citation' | 'clean' | 'suspect' | 'ghost' | 'fraudulent' | 'contradicted' | 'unverified' | 'doi_verified' | 'invalid_match' | 'non_citation';
  raw_status?: 'clean' | 'suspect' | 'ghost' | 'fraudulent' | 'contradicted' | 'unverified' | 'doi_verified' | 'invalid_match' | 'non_citation' | string | null;
  score: number; // percentage out of 100
  verification?: {
    confidence?: number | null;
    verdict?: string | null;
    explanation?: string | null;
    quote?: string | null;
  } | null;
  claim?: string | null;
  reason?: string | null;
  sources?: {
    crossref?: boolean;
    semanticScholar?: boolean;
  } | null;
  crossref_match?: {
    extracted?: string | null;
    crossref_title?: string | null;
    confidence?: number | null;
    title_similarity?: number | null;
    year_match?: boolean | null;
    reason?: string | null;
  } | null;
  extracted_title?: string | null;
  crossref_title?: string | null;
  title_similarity?: number | null;
  accepted_match?: boolean | null;
}

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium';
}

export interface ScanReport {
  id: string;
  fileName: string;
  paperTitle: string;
  date: string;
  score: number;
  verifiedCount: number;
  weakCount: number;
  hallucinatedCount: number;
  fabricatedCount?: number;
  contradictedCount?: number;
  unverifiedCount?: number;
  doiVerifiedCount?: number;
  invalidMatchCount?: number;
  nonCitationCount?: number;
  confidenceIndex: number;
  processingTime: number;
  citations: CitationLog[];
  alerts: AlertItem[];
  analysisMode?: 'REAL' | 'PARTIAL' | 'SIMULATED' | 'FAILED' | 'UNAVAILABLE';
  groqStatus?: string;
  crossrefStatus?: string;
  semanticScholarStatus?: string;
  totalExtracted?: number;
  totalResolved?: number;
}
