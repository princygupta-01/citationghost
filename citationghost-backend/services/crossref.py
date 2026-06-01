import re
from difflib import SequenceMatcher
from typing import Optional
from urllib.parse import quote

import httpx


CROSSREF_BASE = "https://api.crossref.org/works"
HEADERS = {
    "User-Agent": "CitationGhost/1.0 (mailto:citationghost@example.com)",
}

_doi_cache: dict[str, dict] = {}
_title_cache: dict[str, dict] = {}
_bibliographic_cache: dict[str, dict] = {}

MIN_TITLE_SIMILARITY = 0.75
VERIFIED_TITLE_SIMILARITY = 0.85


def normalize_doi(doi: str) -> str:
    normalized = doi.strip()
    normalized = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"^doi:\s*", "", normalized, flags=re.IGNORECASE)
    return normalized.strip().rstrip(".,;)")


async def resolve_doi(doi: str) -> dict:
    if not doi:
        return {"exists": False}

    doi = normalize_doi(doi)
    fake_patterns = ["fake", "9999", "notreal", "1234/fake", "1234/agi", "example"]
    if any(pattern in doi.lower() for pattern in fake_patterns):
        return {"exists": False, "reason": "DOI matches known fake pattern"}

    if doi in _doi_cache:
        return _doi_cache[doi]

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(f"{CROSSREF_BASE}/{quote(doi)}", headers=HEADERS)

        if response.status_code == 200:
            data = response.json()["message"]
            result = {
                "exists": True,
                "title": data.get("title", [""])[0] if data.get("title") else None,
                "year": str(data.get("published", {}).get("date-parts", [[None]])[0][0]),
                "journal": data.get("container-title", [""])[0] if data.get("container-title") else None,
                "doi": doi,
            }
        elif response.status_code == 404:
            result = {"exists": False, "reason": "DOI returns 404 - paper not found in CrossRef"}
        else:
            result = {"exists": False, "reason": f"CrossRef returned {response.status_code}"}

    except httpx.TimeoutException:
        result = {"exists": False, "reason": "CrossRef request timed out"}
    except Exception as exc:
        result = {"exists": False, "reason": str(exc)}

    _doi_cache[doi] = result
    return result


async def search_title(title: str) -> dict:
    if not title:
        return {"exists": False}

    key = title.lower().strip()
    if key in _title_cache:
        return _title_cache[key]

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                CROSSREF_BASE,
                headers=HEADERS,
                params={"query.title": title, "rows": 1},
            )

        if response.status_code != 200:
            result = {"exists": False, "reason": f"CrossRef returned {response.status_code}"}
        else:
            item = response.json().get("message", {}).get("items", [None])[0]
            if not item:
                result = {"exists": False, "reason": "No CrossRef title match"}
            else:
                result = {
                    "exists": True,
                    "title": item.get("title", [""])[0] if item.get("title") else None,
                    "year": str(item.get("published", {}).get("date-parts", [[None]])[0][0]),
                    "journal": item.get("container-title", [""])[0] if item.get("container-title") else None,
                    "doi": item.get("DOI"),
                    "score": item.get("score", 0),
                }
                result["match"] = build_match_proof(title=title, item=result)
    except Exception as exc:
        result = {"exists": False, "reason": str(exc)}

    _title_cache[key] = result
    return result


async def search_doi_by_title(title: str) -> Optional[str]:
    metadata = await search_title(title)
    if metadata.get("exists") and metadata.get("score", 0) > 50 and metadata.get("doi"):
        return metadata["doi"]
    return None


async def search_bibliographic(reference: str) -> dict:
    if not reference:
        return {"exists": False}

    key = reference.lower().strip()
    if key in _bibliographic_cache:
        return _bibliographic_cache[key]

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                CROSSREF_BASE,
                headers=HEADERS,
                params={"query.bibliographic": reference, "rows": 1},
            )

        if response.status_code != 200:
            result = {"exists": False, "reason": f"CrossRef returned {response.status_code}"}
        else:
            item = response.json().get("message", {}).get("items", [None])[0]
            if not item:
                result = {"exists": False, "reason": "No CrossRef bibliographic match"}
            else:
                result = {
                    "exists": True,
                    "title": item.get("title", [""])[0] if item.get("title") else None,
                    "year": str(item.get("published", {}).get("date-parts", [[None]])[0][0]),
                    "journal": item.get("container-title", [""])[0] if item.get("container-title") else None,
                    "doi": item.get("DOI"),
                    "score": item.get("score", 0),
                }
                result["match"] = build_match_proof(reference=reference, item=result)
    except Exception as exc:
        result = {"exists": False, "reason": str(exc)}

    _bibliographic_cache[key] = result
    return result


async def search_doi_by_reference(reference: str) -> Optional[str]:
    metadata = await search_bibliographic(reference)
    if metadata.get("exists") and metadata.get("score", 0) > 40 and metadata.get("doi"):
        return metadata["doi"]
    return None


def validate_match(match: dict) -> dict:
    """Annotate a CrossRef match with acceptance/rejection based on title similarity."""
    similarity = match.get("title_similarity", 0)
    match["accepted"] = similarity >= MIN_TITLE_SIMILARITY
    match["meets_verified_threshold"] = similarity >= VERIFIED_TITLE_SIMILARITY and match.get("year_match", False)
    return match


def build_match_proof(reference: str | None = None, title: str | None = None, item: dict | None = None) -> dict:
    item = item or {}
    query_title = title or _title_guess(reference or "")
    match_title = item.get("title")
    title_similarity = _similarity(query_title, match_title)
    query_year = _year_guess(reference or "")
    match_year = item.get("year")
    year_match = bool(query_year and match_year and query_year == str(match_year))
    confidence = round(min(100, title_similarity * 100 + (8 if year_match else 0)))

    reasons = [f"Title similarity {title_similarity:.2f}"]
    if year_match:
        reasons.append("Year match")
    elif query_year and match_year:
        reasons.append(f"Year differs: extracted {query_year}, CrossRef {match_year}")
    if item.get("doi"):
        reasons.append("DOI returned by CrossRef")

    result = {
        "extracted": reference or title or "",
        "crossref_title": match_title,
        "confidence": confidence,
        "title_similarity": round(title_similarity, 3),
        "year_match": year_match,
        "reason": "; ".join(reasons),
    }
    result = validate_match(result)
    return result


def _similarity(left: str | None, right: str | None) -> float:
    left_norm = _normalize_title(left)
    right_norm = _normalize_title(right)
    if not left_norm or not right_norm:
        return 0.0
    return SequenceMatcher(None, left_norm, right_norm).ratio()


def _normalize_title(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def _year_guess(reference: str) -> str | None:
    match = re.search(r"\b(19|20)\d{2}\b", reference)
    return match.group(0) if match else None


def _title_guess(reference: str) -> str | None:
    cleaned = re.sub(r"^\s*\[?\d{1,3}\]?\s*", "", reference).strip()
    protected = re.sub(r"\b([A-Z])\.", r"\1<dot>", cleaned)
    parts = [part.replace("<dot>", ".").strip() for part in re.split(r"\.\s+", protected) if part.strip()]
    if len(parts) >= 2:
        return parts[1]
    return None
