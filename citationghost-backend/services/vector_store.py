import os
import sys

try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    HAS_VECTOR_STORE = True
except ImportError as e:
    print(f"[WARNING] Vector store dependencies not fully installed: {e}. Running in graceful fallback mode without Vector DB.", flush=True)
    HAS_VECTOR_STORE = False

if HAS_VECTOR_STORE:
    model = SentenceTransformer("all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path=os.getenv("CHROMA_DB_PATH", "./chroma_db"))
    collection = client.get_or_create_collection("citations")
else:
    model = None
    client = None
    collection = None


def embed_citations(citations: list):
    """Store citations in vector DB after each scan"""
    if not HAS_VECTOR_STORE or collection is None:
        print("[WARNING] Vector store disabled. Skipping embedding.", flush=True)
        return
    for cit in citations:
        text = f"{cit.get('title','')} {cit.get('authors','')} {cit.get('year','')}"
        if not text.strip():
            continue
        embedding = model.encode(text).tolist()
        collection.upsert(
            ids=[str(cit.get("id", ""))],
            embeddings=[embedding],
            metadatas=[
                {
                    "title": cit.get("title", ""),
                    "authors": cit.get("authors", ""),
                    "year": str(cit.get("year", "")),
                    "doi": cit.get("doi", "") or "",
                    "reference": cit.get("reference", ""),
                }
            ],
        )


def search_similar(query_text: str, n: int = 5) -> list:
    """Find semantically similar citations from past scans"""
    if not HAS_VECTOR_STORE or collection is None or collection.count() == 0:
        return []
    embedding = model.encode(query_text).tolist()
    results = collection.query(
        query_embeddings=[embedding],
        n_results=min(n, collection.count()),
    )
    return results.get("metadatas", [[]])[0]


def find_doi_by_similarity(title: str, threshold: float = 0.85) -> str | None:
    """Try to find a DOI for a title using semantic similarity"""
    if not HAS_VECTOR_STORE or collection is None:
        return None
    similar = search_similar(title, n=1)
    if not similar:
        return None
    top = similar[0]
    if top.get("doi"):
        title_embedding = model.encode(title)
        match_embedding = model.encode(top.get("title", ""))
        similarity = float(
            (title_embedding @ match_embedding)
            / (
                sum(x**2 for x in title_embedding) ** 0.5
                * sum(x**2 for x in match_embedding) ** 0.5
            )
        )
        if similarity >= threshold:
            return top["doi"]
    return None
