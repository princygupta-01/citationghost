import re

from fastapi import APIRouter, HTTPException

from models.schemas import Citation, ExtractRequest, ExtractResponse
from services.groq_client import EXTRACTION_MODEL, groq_json


router = APIRouter()

SYSTEM_PROMPT = """You are a precise academic citation parser.
Extract citation references from the paper text, especially numbered bibliography entries.
Return valid JSON only. No markdown. No explanation."""

USER_PROMPT_TEMPLATE = """Extract citations from this paper.

Pay special attention to bibliography entries with this format:
[number] Author(s). Title. Journal or Conference, pages, year.

Example:
[13] Sepp Hochreiter and Jürgen Schmidhuber. Long short-term memory. Neural computation, 9(8):1735-1780, 1997.

For that example, return:
- id: "13"
- reference: the complete reference text
- authors: "Hochreiter, Schmidhuber"
- title: "Long short-term memory"
- year: "1997"
- doi: null

For each citation return:
- id: reference number or key (e.g. "1", "Smith2019")
- reference: full reference text exactly as written
- claim: a complete sentence from the paper body that USES this citation as evidence for a specific point. It should contain action words like 'shown', 'demonstrated', 'proposed', 'achieve', 'improves', 'outperforms'. NEVER extract mathematical notation or variable definitions (e.g. "where x and y are..."). NEVER extract figure captions or table headers. If no valid claim sentence found, return the sentence containing the citation number [X] verbatim, or "Referenced in paper body"
- doi: DOI string if present, else null
- authors: first author last name + "et al." or full if <=2 authors
- year: publication year as string
- title: paper title if extractable, else null

PAPER TEXT:
{text}

Return JSON: {{"citations": [...]}}"""


@router.post("/extract", response_model=ExtractResponse)
async def extract_citations(req: ExtractRequest):
    if len(req.text) < 50:
        raise HTTPException(400, "Text too short")

    text = _relevant_text(req.text, limit=12000)

    try:
        result = groq_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=USER_PROMPT_TEMPLATE.format(text=text),
            model=EXTRACTION_MODEL,
        )

        citations = []
        for c in result.get("citations", []):
            if not c.get("reference") and not c.get("title"):
                continue
            citation = Citation(
                id=str(c.get("id", "")),
                reference=c.get("reference", ""),
                claim=c.get("claim") or "Referenced in paper body",
                doi=c.get("doi"),
                authors=c.get("authors"),
                year=str(c.get("year")) if c.get("year") else None,
                title=c.get("title"),
            )
            citation.claim = _claim_for_citation(req.text, citation.id, citation.claim)
            citations.append(_clean_reference_citation(citation))

        if not citations:
            citations = regex_fallback(req.text)

        return ExtractResponse(citations=citations)

    except Exception as exc:
        citations = regex_fallback(req.text)
        if citations:
            return ExtractResponse(citations=citations)
        raise HTTPException(500, f"Extraction failed: {str(exc)}") from exc


def regex_fallback(text: str) -> list[Citation]:
    refs: list[Citation] = []
    ref_match = re.search(r"\bReferences\b", text, re.IGNORECASE)
    if not ref_match:
        return refs

    ref_text = re.sub(r"\s+", " ", text[ref_match.end():]).strip()
    numbered_refs = re.findall(r"(\[\d{1,3}\]\s*.*?)(?=\s*\[\d{1,3}\]\s*|$)", ref_text)

    if numbered_refs:
        for reference in numbered_refs:
            citation = _citation_from_reference(reference.strip(), len(refs) + 1)
            citation.claim = _claim_for_citation(text, citation.id, citation.claim)
            refs.append(citation)
    else:
        lines = text[ref_match.end():].splitlines()
        current = ""

        for line in lines:
            stripped = line.strip()
            starts_ref = re.match(r"^\[?(\d{1,3})\]?[.\s]", stripped)
            if starts_ref and current:
                citation = _citation_from_reference(current, len(refs) + 1)
                citation.claim = _claim_for_citation(text, citation.id, citation.claim)
                refs.append(citation)
                current = stripped
            elif stripped:
                current = f"{current} {stripped}".strip()

        if current:
            citation = _citation_from_reference(current, len(refs) + 1)
            citation.claim = _claim_for_citation(text, citation.id, citation.claim)
            refs.append(citation)

    return refs


def _citation_from_reference(reference: str, fallback_id: int) -> Citation:
    doi_match = re.search(r"\b10\.\d{4,9}/[-._;()/:A-Z0-9]+\b", reference, re.IGNORECASE)
    year_match = re.search(r"\b(19|20)\d{2}\b", reference)
    id_match = re.match(r"^\[?(\d{1,3})\]?", reference)
    title = _title_from_numbered_reference(reference) or reference[:160]

    return _clean_reference_citation(Citation(
        id=id_match.group(1) if id_match else str(fallback_id),
        reference=reference,
        claim="Referenced in paper body",
        doi=doi_match.group(0) if doi_match else None,
        authors=_authors_from_numbered_reference(reference) or "Unknown",
        year=year_match.group(0) if year_match else None,
        title=title,
    ))


def _relevant_text(text: str, limit: int) -> str:
    reference_match = re.search(r"\bReferences\b", text, re.IGNORECASE)
    if not reference_match:
        return text[:limit]

    intro_budget = min(3000, limit // 4)
    references_budget = limit - intro_budget
    intro = text[:intro_budget]
    references = text[reference_match.start(): reference_match.start() + references_budget]
    return f"{intro}\n\n{references}"


def _clean_reference_citation(citation: Citation) -> Citation:
    citation.reference = _normalize_reference_text(citation.reference or "")
    if citation.reference:
        citation.title = _title_from_numbered_reference(citation.reference) or citation.title
        citation.authors = _authors_from_numbered_reference(citation.reference) or citation.authors
    return citation


def _normalize_reference_text(reference: str) -> str:
    cleaned = re.sub(r"\s+", " ", reference).strip()
    cleaned = re.sub(r"\b([A-Z])\s+\.", r"\1.", cleaned)
    cleaned = re.sub(r"(?<=\w)-\s+(?=\w)", "", cleaned)
    cleaned = re.sub(r"\s+([,.;:])", r"\1", cleaned)
    return cleaned


def _claim_for_citation(text: str, citation_id: str, current_claim: str | None) -> str:
    if current_claim and current_claim != "Referenced in paper body":
        return current_claim

    body = _paper_body(text)
    marker = re.escape(str(citation_id))
    sentence_pattern = re.compile(rf"([^.!?\n]*(?:\[{marker}\]|\({marker}\)|\bcitation\s+{marker}\b)[^.!?]*(?:[.!?]|$))", re.IGNORECASE)
    match = sentence_pattern.search(body)
    if match:
        extracted = re.sub(r"\s+", " ", match.group(1)).strip()
        # Reject garbage claims that are math notation or variable definitions
        if not re.match(r"^(where |let |given |here |for |note that )", extracted, re.IGNORECASE):
            return extracted

    return current_claim or "Referenced in paper body"


def _paper_body(text: str) -> str:
    ref_match = re.search(r"\bReferences\b", text, re.IGNORECASE)
    return text[:ref_match.start()] if ref_match else text


def _reference_parts(reference: str) -> list[str]:
    cleaned = re.sub(r"^\s*\[?\d{1,3}\]?\s*", "", reference).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    protected = re.sub(r"\b([A-Z])\.", r"\1<dot>", cleaned)
    protected = re.sub(r"\b(vs|e\.g|i\.e)\.", lambda m: m.group(0).replace(".", "<dot>"), protected, flags=re.IGNORECASE)
    parts = [part.replace("<dot>", ".").strip() for part in re.split(r"\.\s+", protected) if part.strip()]
    return parts


def _title_from_numbered_reference(reference: str) -> str | None:
    parts = _reference_parts(reference)
    if len(parts) >= 2:
        return parts[1].rstrip(".")
    return None


def _authors_from_numbered_reference(reference: str) -> str | None:
    parts = _reference_parts(reference)
    if not parts:
        return None

    authors = parts[0]
    authors = re.sub(r"\bet\s+al\.?$", "", authors, flags=re.IGNORECASE).strip()
    names = [name.strip(" ,") for name in re.split(r"\s+and\s+|,\s*", authors) if name.strip(" ,")]
    last_names = []
    for name in names[:3]:
        tokens = name.replace(".", "").split()
        if tokens:
            last_names.append(tokens[-1])

    return ", ".join(last_names) if last_names else None
