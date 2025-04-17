# predictive_backend/ingest_policy_docs.py
"""
Ingest every PDF under predictive_backend/app/policy_documents/,
chunk into ~350‑token slices, embed with OpenAI, and upsert to Qdrant.

Run once (locally or as a one‑off Render Job). It is NOT imported by FastAPI.
"""

from __future__ import annotations
import os, pathlib, hashlib, logging, mimetypes
from dotenv import load_dotenv

load_dotenv()                              # read .env if present

# ----------------- configuration -----------------
PDF_DIR      = pathlib.Path(__file__).parent / "app" / "policy_documents"
COLLECTION   = os.getenv("QDRANT_COLLECTION_NAME", "policy_documents")
CHUNK_SIZE   = 350     # ~tokens / 5 ≈ words
OVERLAP      = 50
EMBED_MODEL  = "text-embedding-ada-002"

# ----------------- logging -----------------------
logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
log = logging.getLogger("ingest")

# ----------------- deps --------------------------
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance, PointStruct

from app.qdrant_client import get_qdrant_client      # absolute import
from app.qdrant_client import ensure_collection_exists
from openai import OpenAI

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    raise RuntimeError("OPENAI_API_KEY not set")

openai_client = OpenAI(api_key=OPENAI_KEY)

# ----------------- helpers -----------------------
def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = OVERLAP) -> list[str]:
    words = text.split()
    i, out = 0, []
    while i < len(words):
        out.append(" ".join(words[i : i + size]))
        i += size - overlap
    return out


def embed(texts: list[str]) -> list[list[float]]:
    """Batch‑embed; OpenAI lets up to 2048 tokens / request, so we call per chunk."""
    resp = openai_client.embeddings.create(model=EMBED_MODEL, input=texts)
    return [d.embedding for d in resp.data]


def process_pdf(pdf_path: pathlib.Path, qc: QdrantClient):
    import pdfplumber

    log.info("▶ %s", pdf_path.name)
    with pdfplumber.open(pdf_path) as pdf:
        raw_text = "\n".join(p.extract_text() or "" for p in pdf.pages)

    chunks = chunk_text(raw_text)
    vectors = embed(chunks)

    points = []
    for idx, (c_text, vec) in enumerate(zip(chunks, vectors)):
        # reproducible 64‑bit ID
        pid = int(hashlib.sha256(f"{pdf_path}:{idx}".encode()).hexdigest()[:16], 16)
        payload = {
            "document_title": pdf_path.stem,
            "page_number"   : None,
            "heading"       : "N/A",
            "content"       : c_text,
            # backend url will be generated at query‑time
        }
        points.append(PointStruct(id=pid, vector=vec, payload=payload))

    qc.upsert(collection_name=COLLECTION, points=points, wait=True)
    log.info("   ↳ upserted %d chunks", len(chunks))


# ----------------- main --------------------------
def main():
    qc = get_qdrant_client()
    ensure_collection_exists(qc, COLLECTION, vector_size=1536, distance=Distance.COSINE)

    pdf_files = [
        p for p in PDF_DIR.glob("**/*") if mimetypes.guess_type(p.name)[0] == "application/pdf"
    ]
    if not pdf_files:
        log.warning("No PDF files found under %s", PDF_DIR)
        return

    for pdf in pdf_files:
        process_pdf(pdf, qc)

    log.info("✅ Done. Ingested %d PDFs into collection '%s'.", len(pdf_files), COLLECTION)


if __name__ == "__main__":
    main()
