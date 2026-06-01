import json
import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


load_dotenv()
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

DEFAULT_MODEL = "llama-3.3-70b-versatile"
EXTRACTION_MODEL = os.getenv("GROQ_EXTRACTION_MODEL", "llama-3.1-8b-instant")
MODEL_FALLBACKS = {
    "llama3-8b-8192": "llama-3.1-8b-instant",
    "llama3-70b-8192": DEFAULT_MODEL,
}


def _client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")
    return Groq(api_key=api_key)


def groq_json(system_prompt: str, user_prompt: str, model: str = DEFAULT_MODEL) -> dict:
    client = _client()
    try:
        response = _chat_completion(client, system_prompt, user_prompt, model)
    except Exception as exc:
        fallback = MODEL_FALLBACKS.get(model)
        if not fallback or "model_decommissioned" not in str(exc):
            raise
        response = _chat_completion(client, system_prompt, user_prompt, fallback)

    raw = response.choices[0].message.content or "{}"

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        clean = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)


def _chat_completion(client: Groq, system_prompt: str, user_prompt: str, model: str):
    return client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
        max_tokens=2048,
    )
