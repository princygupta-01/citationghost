# CitationGhost Backend

FastAPI backend for the CitationGhost citation integrity pipeline.

## Architecture

- FastAPI routes under `routes/`
- Groq for citation extraction and claim verification
- CrossRef for DOI resolution
- Semantic Scholar for abstract lookup
- In-memory caching for CrossRef and Semantic Scholar lookups

## Run

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend reads `GROQ_API_KEY` from this folder's `.env` or the parent repo `.env`.

## Endpoints

- `GET /health`
- `GET /api/health`
- `POST /api/extract`
- `POST /api/resolve`
- `POST /api/abstract`
- `POST /api/verify`
- `POST /api/scan`
- `POST /api/analyze` for the current React PDF-upload UI
