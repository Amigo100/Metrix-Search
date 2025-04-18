# ── file: project/predictive_backend/ingest_policy_docs.py ───────────
"""
One‑shot utility that

▪ walks through  project/predictive_backend/policy_documents/
▪ slices every PDF into ~350‑token overlapping chunks
▪ embeds each chunk with OpenAI
▪ upserts the vectors into your Qdrant collection

Run locally:
    source .venv/bin/activate          # or however you activate the venv
    python -m project.predictive_backend.ingest_policy_docs
"""

from __future__ import annotations
import os, pathlib, hashlib, logging, mimetypes
from dotenv import load_dotenv

# ───────────────────────── env & logging ────────────────────────────
load_dotenv()                                  # reads ./‑root‑/.env
logging.basicConfig(level=logging.INFO,
                    format="%(levelname)s | %(message)s")
log = logging.getLogger("ingest")

# ───────────────────────── settings ─────────────────────────────────
BASE_DIR   = pathlib.Path(__file__).parent          # …/predictive_backend
PDF_DIR    = BASE_DIR / "policy_documents"
COLLECTION = os.getenv("QDRANT_COLLECTION_NAME", "policy_documents")

CHUNK_SIZE  = 350
OVERLAP     = 50
EMBED_MODEL = "text-embedding-ada-002"

# ───────────────────────── dependencies ─────────────────────────────
from openai import OpenAI
from qdrant_client.http.models import VectorParams, Distance, PointStruct

# *CRITICAL* – relative import so the package path is correct
from .app.qdrant_client import get_qdrant_client, ensure_collection_exists

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    raise RuntimeError("OPENAI_API_KEY missing – add it to .env or export")
openai = OpenAI(api_key=OPENAI_KEY)

# ───────────────────────── helpers ──────────────────────────────────
def chunk_text(text: str) -> list[str]:
    words, i, out = text.split(), 0, []
    while i < len(words):
        out.append(" ".join(words[i : i + CHUNK_SIZE]))
        i += CHUNK_SIZE - OVERLAP
    return out


def embed(batch: list[str]) -> list[list[float]]:
    resp = openai.embeddings.create(model=EMBED_MODEL, input=batch)
    return [d.embedding for d in resp.data]


def process_pdf(pdf: pathlib.Path, qc):
    import pdfplumber

    log.info("▶  %s", pdf.name)
    with pdfplumber.open(pdf) as pdf_obj:
        raw_text = "\n".join(p.extract_text() or "" for p in pdf_obj.pages)

    chunks  = chunk_text(raw_text)
    vectors = embed(chunks)

    points = []
    for idx, (chunk, vec) in enumerate(zip(chunks, vectors)):
        pid = int(hashlib.sha256(f"{pdf}:{idx}".encode())
                       .hexdigest()[:16], 16)
        points.append(
            PointStruct(
                id=pid,
                vector=vec,
                payload={
                    "document_title": pdf.stem,
                    "page_number": None,
                    "heading": "N/A",
                    "content": chunk,
                },
            )
        )

    qc.upsert(collection_name=COLLECTION, points=points, wait=True)
    log.info("   ↳ upserted %d chunks", len(points))


# ───────────────────────── main ─────────────────────────────────────
def main():
    qc = get_qdrant_client()
    ensure_collection_exists(qc, COLLECTION, vector_size=1536,
                             distance=Distance.COSINE)

    pdf_files = [
        p for p in PDF_DIR.glob("**/*")
        if mimetypes.guess_type(p.name)[0] == "application/pdf"
    ]
    if not pdf_files:
        log.warning("No PDFs found under %s", PDF_DIR)
        return

    for pdf in pdf_files:
        process_pdf(pdf, qc)

    log.info("✅  Finished ingesting %d PDFs into '%s'.",
             len(pdf_files), COLLECTION)


if __name__ == "__main__":
    main()
