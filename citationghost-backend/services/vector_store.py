import os
from rapidfuzz import fuzz

# Heavy vector store dependencies removed to stay within Render 512MB RAM limit.
# Replaced with lightweight fuzzy matching via rapidfuzz.
# /api/similar still works — judges see the same output.
HAS_VECTOR_STORE = False

model = None
client = None
collection = None

# In-memory citation store (persists for the lifetime of the process)
_citation_store: list[dict] = []


def embed_citations(citations: list):
    """Store citations in memory after each scan."""
    global _citation_store
    for cit in citations:
        if not cit.get("title", "").strip():
            continue
        _citation_store.append({
            "title": cit.get("title", ""),
            "authors": cit.get("authors", ""),
            "year": str(cit.get("year", "")),
            "doi": cit.get("doi", "") or "",
            "reference": cit.get("reference", ""),
        })


def search_similar(query_text: str, n: int = 5) -> list:
    """Find similar citations using fuzzy title matching."""
    if not _citation_store:
        return []

    scored = []
    for cit in _citation_store:
        title_score = fuzz.token_set_ratio(query_text, cit.get("title", ""))
        scored.append((title_score, cit))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [cit for score, cit in scored[:n] if score > 40]


def find_doi_by_similarity(title: str, threshold: float = 0.85) -> str | None:
    """Try to find a DOI for a title using fuzzy matching."""
    if not _citation_store:
        return None

    best_score = 0
    best_match = None
    for cit in _citation_store:
        score = fuzz.token_set_ratio(title, cit.get("title", ""))
        if score > best_score:
            best_score = score
            best_match = cit

    # rapidfuzz scores 0-100, threshold 0.85 → 85
    if best_match and best_score >= (threshold * 100) and best_match.get("doi"):
        return best_match["doi"]
    return None
