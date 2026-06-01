import asyncio

from fastapi import APIRouter, HTTPException

from models.schemas import VerifyRequest, VerifyResponse
from services.groq_client import groq_json


router = APIRouter()

SYSTEM_PROMPT = """You are a rigorous academic fact-checker.
Determine whether a paper's abstract actually supports the claim made about it.
Return JSON only. Be strict."""

USER_PROMPT_TEMPLATE = """A paper makes this claim about a source:
CLAIM: "{claim}"

The cited paper is: {reference}

The cited paper's actual abstract:
"{abstract}"

Does the abstract support the claim?

VERDICT OPTIONS:
- SUPPORTS: abstract genuinely backs the claim
- CONTRADICTS: abstract says something different or opposite
- OVERSTATED: paper exists but claim exaggerates what it actually shows
- UNRELATED: abstract has nothing to do with how it's being cited

Return JSON:
{{
  "verdict": "SUPPORTS|CONTRADICTS|OVERSTATED|UNRELATED",
  "confidence": 0-100,
  "explanation": "One sentence explaining the verdict",
  "quote": "Most relevant phrase from the abstract that proves your verdict, or null"
}}"""


@router.post("/verify", response_model=VerifyResponse)
async def verify_claim(req: VerifyRequest):
    if not req.abstract:
        raise HTTPException(400, "Abstract required")

    try:
        result = await asyncio.to_thread(
            groq_json,
            system_prompt=SYSTEM_PROMPT,
            user_prompt=USER_PROMPT_TEMPLATE.format(
                claim=req.claim,
                reference=req.reference,
                abstract=req.abstract[:1500],
            ),
        )

        verdict = result.get("verdict", "UNRELATED")
        if verdict not in ["SUPPORTS", "CONTRADICTS", "OVERSTATED", "UNRELATED"]:
            verdict = "UNRELATED"

        return VerifyResponse(
            verdict=verdict,
            confidence=_confidence(result.get("confidence", 50)),
            explanation=result.get("explanation", "Unable to determine"),
            quote=result.get("quote"),
        )

    except Exception as exc:
        raise HTTPException(500, f"Verification failed: {str(exc)}") from exc


def _confidence(value) -> int:
    try:
        confidence = int(float(str(value).strip().rstrip("%")))
    except (TypeError, ValueError):
        confidence = 50
    return max(0, min(100, confidence))
