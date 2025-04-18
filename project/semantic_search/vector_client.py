# project/semantic_search/vector_client.py
"""
Singleton helper that hands back an authenticated QdrantClient.
Keeps all Qdrant settings in ONE place.
"""

from __future__ import annotations
import os, functools, logging
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance

log = logging.getLogger(__name__)

# ────────────── env vars with sensible fall‑backs ──────────────
QDRANT_URL   = os.getenv("QDRANT_URL",   "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY") or None

COLLECTION       = os.getenv("QDRANT_COLLECTION_NAME", "policy_chunks")
DEFAULT_VEC_SIZE = int(os.getenv("QDRANT_VECTOR_SIZE", "1536"))  # ada‑002

# ────────────── lazy‑initialised singleton ─────────────────────
@functools.lru_cache(maxsize=1)
def get_qdrant_client() -> QdrantClient:
    log.info("Connecting to Qdrant at %s", QDRANT_URL)
    return QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
        timeout=30,
    )

def ensure_collection_exists(
    client: QdrantClient,
    name: str = COLLECTION,
    vector_size: int = DEFAULT_VEC_SIZE,
):
    if name in {c.name for c in client.get_collections().collections}:
        return
    log.warning("Collection '%s' missing – creating it", name)
    client.create_collection(
        collection_name=name,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
    )
