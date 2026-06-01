import asyncio
import hashlib
import os
from typing import Optional
from urllib.parse import quote

import httpx

from services.crossref import normalize_doi


SS_BASE = "https://api.semanticscholar.org/graph/v1/paper"
FIELDS = "abstract,title,year,authors"
RETRY_DELAYS = (1, 2, 4)

_abstract_cache: dict[str, dict] = {}
_semantic_cache: dict[str, dict] = {}


def _headers() -> dict[str, str]:
    api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
    return {"x-api-key": api_key} if api_key else {}


async def fetch_abstract(doi: Optional[str] = None, title: Optional[str] = None) -> dict:
    cache_key_raw = (doi or title or "").strip().lower()
    cache_key = hashlib.md5(cache_key_raw.encode()).hexdigest()
    if cache_key in _semantic_cache:
        return _semantic_cache[cache_key]

    if doi:
        doi = normalize_doi(doi)

    cache_key_legacy = (doi or title or "").lower().strip()
    if cache_key_legacy in _abstract_cache:
        result = _abstract_cache[cache_key_legacy]
        _semantic_cache[cache_key] = result
        return result

    result = {"found": False, "abstract": None}

    async with httpx.AsyncClient(timeout=10.0) as client:
        if doi:
            try:
                response = await _get_with_backoff(
                    client,
                    f"{SS_BASE}/DOI:{quote(doi, safe='')}",
                    params={"fields": FIELDS},
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("abstract"):
                        result = {
                            "found": True,
                            "abstract": data["abstract"],
                            "title": data.get("title"),
                        }
                        _abstract_cache[cache_key_legacy] = result
                        _semantic_cache[cache_key] = result
                        return result
                elif response.status_code == 429:
                    result = {"found": False, "abstract": None, "reason": "rate_limited"}
                    _abstract_cache[cache_key_legacy] = result
                    _semantic_cache[cache_key] = result
                    return result
                elif response.status_code == 403:
                    result = {"found": False, "abstract": None, "reason": "Semantic Scholar returned 403"}
                    _abstract_cache[cache_key_legacy] = result
                    _semantic_cache[cache_key] = result
                    return result
            except Exception as exc:
                result = {"found": False, "abstract": None, "reason": str(exc)}

        if title and not result["found"]:
            try:
                response = await _get_with_backoff(
                    client,
                    f"{SS_BASE}/search",
                    params={"query": title, "fields": FIELDS, "limit": 1},
                )
                if response.status_code == 200:
                    papers = response.json().get("data", [])
                    if papers and papers[0].get("abstract"):
                        result = {
                            "found": True,
                            "abstract": papers[0]["abstract"],
                            "title": papers[0].get("title"),
                        }
                    elif papers:
                        result = {"found": False, "abstract": None, "title": papers[0].get("title"), "reason": "Semantic Scholar result has no abstract"}
                    else:
                        result = {"found": False, "abstract": None, "reason": "No Semantic Scholar title match"}
                elif response.status_code == 429:
                    result = {"found": False, "abstract": None, "reason": "rate_limited"}
                elif response.status_code == 403:
                    result = {"found": False, "abstract": None, "reason": "Semantic Scholar returned 403"}
            except Exception as exc:
                result = {"found": False, "abstract": None, "reason": str(exc)}

    _abstract_cache[cache_key_legacy] = result
    _semantic_cache[cache_key] = result
    return result


async def _get_with_backoff(client: httpx.AsyncClient, url: str, params: dict) -> httpx.Response:
    response = await client.get(url, params=params, headers=_headers())
    for delay in RETRY_DELAYS:
        if response.status_code != 429:
            return response
        await asyncio.sleep(delay)
        response = await client.get(url, params=params, headers=_headers())
    return response
