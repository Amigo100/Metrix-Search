# predictive_backend/ingest_policy_docs.py
"""
One‑shot utility to chunk every PDF under project/policy_documents/,
create embeddings with OpenAI, and upsert into Qdrant.
Run locally OR as a one‑off job on Render.
"""
import os, pathlib, logging, mimetypes, hashlib
from dotenv import load_dotenv; load_dotenv()

from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance, PointStruct
from unstructured.partition.pdf import partition_pdf

from my_rag_app.llm_wrapper import OpenAIEmbedding   # reuse wrapper
from my_rag_app.rag_config import Config             # has Qdrant settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

DOCS_DIR = pathlib.Path(__file__).parent.parent / "policy_documents"
COLLECTION = "policy_documents"
CHUNK_SIZE = 350
OVERLAP    = 50

cfg = Config()
embedder = cfg.rag.embedding_model       # same instance used in RAG
client   = QdrantClient(
    url=cfg.rag.url, 
    api_key=cfg.rag.api_key or None,
) if not cfg.rag.use_local else QdrantClient(path=cfg.rag.local_path)

# Ensure collection exists -----------------------------------------------
if COLLECTION not in [c.name for c in client.get_collections().collections]:
    client.create_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(size=cfg.rag.embedding_dim,
                                    distance=Distance.COSINE)
    )

def chunk(text: str) -> list[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + CHUNK_SIZE, len(words))
        chunks.append(" ".join(words[start:end]))
        start = end - OVERLAP
    return chunks

def process_one(pdf_path: pathlib.Path):
    logger.info("Processing %s", pdf_path.name)
    raw_pages = partition_pdf(filename=str(pdf_path))
    full_text = "\n".join(el.text for el in raw_pages if el.text)
    for i, c in enumerate(chunk(full_text)):
        vec  = embedder.embed_query(c)
        doc_id = int(hashlib.md5(f"{pdf_path.name}-{i}".encode()).hexdigest()[:16], 16)
        payload = {
            "document_title": pdf_path.stem,
            "page_number": None,
            "heading": "N/A",
            "url": f"/api/documents/view/{pdf_path.name}",
            "content": c,
        }
        client.upsert(COLLECTION, [PointStruct(id=doc_id, vector=vec, payload=payload)], wait=True)

if __name__ == "__main__":
    pdfs = [p for p in DOCS_DIR.glob("**/*") if mimetypes.guess_type(p.name)[0] == "application/pdf"]
    for p in pdfs:
        process_one(p)
    logger.info("✅  Finished ingesting %d PDFs", len(pdfs))
