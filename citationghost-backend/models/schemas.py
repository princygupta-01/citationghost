from typing import Any, List, Optional

from pydantic import BaseModel


class Citation(BaseModel):
    id: str
    reference: str
    claim: str
    doi: Optional[str] = None
    authors: Optional[str] = None
    year: Optional[str] = None
    title: Optional[str] = None


class ExtractRequest(BaseModel):
    text: str


class ExtractResponse(BaseModel):
    citations: List[Citation]


class ResolveRequest(BaseModel):
    doi: str


class ResolveResponse(BaseModel):
    exists: bool
    title: Optional[str] = None
    year: Optional[str] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    reason: Optional[str] = None


class AbstractRequest(BaseModel):
    doi: Optional[str] = None
    title: Optional[str] = None


class AbstractResponse(BaseModel):
    abstract: Optional[str] = None
    found: bool
    title: Optional[str] = None
    reason: Optional[str] = None


class VerifyRequest(BaseModel):
    claim: str
    abstract: str
    reference: str


class VerifyResponse(BaseModel):
    verdict: str
    confidence: int
    explanation: str
    quote: Optional[str] = None


class ScanRequest(BaseModel):
    text: str


class CitationResult(BaseModel):
    id: str
    reference: str
    claim: str
    doi: Optional[str] = None
    title: Optional[str] = None
    authors: Optional[str] = None
    year: Optional[str] = None
    status: str
    doi_exists: Optional[bool] = None
    abstract: Optional[str] = None
    ghost_reason: Optional[str] = None
    verification: Optional[VerifyResponse] = None
    crossref_match: Optional[dict[str, Any]] = None


class ScanResponse(BaseModel):
    citations: List[CitationResult]
    stats: dict[str, Any]
    slop_score: int


class AnalyzeRequest(BaseModel):
    filename: str
    base64Data: Optional[str] = None
    text: Optional[str] = None
    isMock: bool = False


class FrontendCitation(BaseModel):
    id: str
    title: str
    journal: str
    status: str
    score: int
    raw_status: Optional[str] = None
    claim: Optional[str] = None
    reason: Optional[str] = None
    year: Optional[str] = None
    reference: Optional[str] = None
    authors: Optional[str] = None
    doi: Optional[str] = None
    doi_exists: Optional[bool] = None
    abstract_found: Optional[bool] = None
    abstract: Optional[str] = None
    verdict: Optional[str] = None
    verification: Optional[VerifyResponse] = None
    sources: Optional[dict[str, Any]] = None
    crossref_match: Optional[dict[str, Any]] = None
    extracted_title: Optional[str] = None
    crossref_title: Optional[str] = None
    title_similarity: Optional[float] = None
    accepted_match: Optional[bool] = None


class FrontendReport(BaseModel):
    id: str
    fileName: str
    paperTitle: str
    date: str
    score: int
    verifiedCount: int
    weakCount: int
    hallucinatedCount: int
    fabricatedCount: int = 0
    contradictedCount: int = 0
    unverifiedCount: int = 0
    doiVerifiedCount: int = 0
    invalidMatchCount: int = 0
    nonCitationCount: int = 0
    confidenceIndex: float
    processingTime: float
    citations: List[FrontendCitation]
    alerts: list[dict[str, Any]]
    analysisMode: str
    groqStatus: str
    crossrefStatus: str
    semanticScholarStatus: str
    totalExtracted: int
    totalResolved: int
