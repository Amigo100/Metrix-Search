# predictive_backend/ingest_policy_docs.py
"""
One‑shot script that reads every PDF under predictive_backend/policy_documents/,
splits into chunks, gets OpenAI embeddings and upserts into the Qdrant
collection given by $QDRANT_COLLECTION_NAME (default 'policy_documents').
"""

from __future__ import annotations
import os, pathlib, hashlib, logging, mimetypes
from dotenv import load_dotenv
load_dotenv()

PDF_DIR    = pathlib.Path(__file__).parent / "policy_documents"
COLLECTION = os.getenv("QDRANT_COLLECTION_NAME", "policy_documents")
CHUNK      = 350
OVERLAP    = 50
EMBED_MODEL= "text-embedding-ada-002"

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(message)s")
log = logging.getLogger("ingest")

from openai import OpenAI
from qdrant_client.http.models import VectorParams, Distance, PointStruct
# ✔ absolute import path
from predictive_backend.app.qdrant_client import get_qdrant_client, ensure_collection_exists    

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    raise RuntimeError("OPENAI_API_KEY not set")
openai = OpenAI(api_key=OPENAI_KEY)

def chunk_text(txt: str) -> list[str]:
    words, out, i = txt.split(), [], 0
    while i < len(words):
        out.append(" ".join(words[i:i+CHUNK]))
        i += CHUNK - OVERLAP
    return out

def embed(batch: list[str]) -> list[list[float]]:
    resp = openai.embeddings.create(model=EMBED_MODEL, input=batch)
    return [d.embedding for d in resp.data]

def process_pdf(pdf: pathlib.Path, qc):
    import pdfplumber
    log.info("▶ %s", pdf.name)
    text = ""
    with pdfplumber.open(pdf) as p:
        for pg in p.pages:
            text += (pg.extract_text() or "") + "\n"
    chunks = chunk_text(text)
    vecs   = embed(chunks)

    pts = []
    for n, (c, v) in enumerate(zip(chunks, vecs)):
        pid = int(hashlib.sha256(f"{pdf}:{n}".encode()).hexdigest()[:16], 16)
        pts.append(
            PointStruct(
                id=pid,
                vector=v,
                payload={
                    "document_title": pdf.stem,
                    "page_number"   : None,
                    "heading"       : "N/A",
                    "content"       : c,
                },
            )
        )
    qc.upsert(COLLECTION, points=pts, wait=True)
    log.info("   ↳ %d chunks", len(pts))

def main():
    qc = get_qdrant_client()
    ensure_collection_exists(qc, COLLECTION, vector_size=1536,
                             distance=Distance.COSINE)

    pdfs = [p for p in PDF_DIR.glob("**/*")
            if mimetypes.guess_type(p.name)[0] == "application/pdf"]
    if not pdfs:
        log.warning("No PDFs found in %s", PDF_DIR); return
    for p in pdfs: process_pdf(p, qc)
    log.info("✅ Done (%d PDFs).", len(pdfs))

if __name__ == "__main__":
    main()
