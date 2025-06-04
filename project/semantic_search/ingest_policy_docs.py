# project/semantic_search/ingest_policy_docs.py
"""
Run once to ingest PDFs in policy_documents/ into Qdrant.

    $ python -m project.semantic_search.ingest_policy_docs

Works independently of other backends.
"""

from __future__ import annotations
import os, pathlib, hashlib, logging, mimetypes, textwrap
from dotenv import load_dotenv
from openai import OpenAI

from qdrant_client.http.models import PointStruct, Distance
from .vector_client import get_qdrant_client, ensure_collection_exists, COLLECTION

# ────────────── env & logging ───────────────────────────────────
load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
log = logging.getLogger("ingest")

BASE_DIR   = pathlib.Path(__file__).parent
PDF_DIR    = BASE_DIR / "policy_documents"
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-ada-002")
CHUNK_SIZE  = 350
OVERLAP     = 50

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    raise RuntimeError("OPENAI_API_KEY missing")
openai = OpenAI(api_key=OPENAI_KEY)

# ────────────── helpers ─────────────────────────────────────────
def chunk_text(text: str) -> list[str]:
    words, out, i = text.split(), [], 0
    while i < len(words):
        out.append(" ".join(words[i : i + CHUNK_SIZE]))
        i += CHUNK_SIZE - OVERLAP
    return out

def embed(batch: list[str]) -> list[list[float]]:
    resp = openai.embeddings.create(model=EMBED_MODEL, input=batch)
    return [d.embedding for d in resp.data]

def process_pdf(pdf_path: pathlib.Path, qc):
    import pdfplumber

    log.info("▶ %s", pdf_path.name)
    with pdfplumber.open(pdf_path) as pdf_obj:
        raw = "\n".join(p.extract_text() or "" for p in pdf_obj.pages)

    chunks  = chunk_text(raw)
    vectors = embed(chunks)

    pts: list[PointStruct] = []
    for n, (chunk, vec) in enumerate(zip(chunks, vectors)):
        pid = int(hashlib.sha256(f"{pdf_path}:{n}".encode()).hexdigest()[:16], 16)
        pts.append(
            PointStruct(
                id=pid,
                vector=vec,
                payload={
                    "document_title": pdf_path.stem,
                    "page_number": None,
                    "heading": "N/A",
                    "content": chunk,
                },
            )
        )

    qc.upsert(collection_name=COLLECTION, points=pts, wait=True)
    log.info("   ↳ upserted %d chunks", len(pts))

# ────────────── main ────────────────────────────────────────────
def main():
    qc = get_qdrant_client()
    ensure_collection_exists(qc, COLLECTION)

    pdfs = [
        p for p in PDF_DIR.glob("**/*")
        if mimetypes.guess_type(p.name)[0] == "application/pdf"
    ]
    if not pdfs:
        log.warning("No PDFs under %s", PDF_DIR)
        return

    for p in pdfs:
        process_pdf(p, qc)

    log.info("✅ Ingested %d PDFs into '%s'", len(pdfs), COLLECTION)


if __name__ == "__main__":
    main()
