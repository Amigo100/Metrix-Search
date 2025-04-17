# predictive_backend/app/search_logic.py
"""
Lightweight RAG helper – keeps predictive‑insight ML endpoints untouched.
"""

from __future__ import annotations
import os, logging, urllib.parse
from typing import Any, Dict, List, Optional

from openai import OpenAI, APIError, RateLimitError
from app.qdrant_client import get_qdrant_client         # same module ML uses

# ---------------- config -----------------
log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")

OPENAI_KEY   = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    raise RuntimeError("OPENAI_API_KEY missing")

EMBED_MODEL  = "text-embedding-ada-002"
CHAT_MODEL   = "gpt-4"

# let ops override collection without code‑change
COLLECTION   = os.getenv("QDRANT_COLLECTION_NAME", "policy_documents")
TOP_K        = 5

openai_client = OpenAI(api_key=OPENAI_KEY)
log.info("OpenAI client ready; collection=%s", COLLECTION)

# -------------- main recoil ---------------
def perform_rag_search(
        query: str,
        collection: str = COLLECTION,
        limit: int   = TOP_K
) -> Dict[str, Any]:

    qc = get_qdrant_client()

    # 1) embed --------------------------------------------------------------
    try:
        emb_resp  = openai_client.embeddings.create(model=EMBED_MODEL, input=query)
        q_vector  = emb_resp.data[0].embedding
    except (APIError, RateLimitError) as e:
        err = f"Embedding API error: {e}"
        log.error(err, exc_info=True)
        return {"answer": "", "citations": [], "error": err}

    # 2) search -------------------------------------------------------------
    try:
        hits = qc.search(collection_name=collection,
                         query_vector=q_vector,
                         limit=limit,
                         with_payload=True)
    except Exception as e:
        err = f"Qdrant search failed: {e}"
        log.error(err, exc_info=True)
        return {"answer": "", "citations": [], "error": err}

    if not hits:
        return {
            "answer": "No relevant information found in policy documents.",
            "citations": [],
            "error": None
        }

    # 3) build context & citations -----------------------------------------
    ctx_lines, citations = [], []
    for idx, h in enumerate(hits, 1):
        pl       = h.payload or {}
        chunk    = pl.get("content") or pl.get("text") or "[No text]"
        title    = pl.get("document_title", "Unknown Document")
        page     = pl.get("page_number")
        heading  = pl.get("heading", "N/A")

        ctx_lines.append(f"[{idx}] {chunk}")

        url = None
        if title != "Unknown Document":
            fn = title.replace(" ", "_")
            if not fn.lower().endswith(".pdf"):
                fn += ".pdf"
            url = f"/predictive/api/documents/view/{urllib.parse.quote(fn)}"

        citations.append({
            "source_id"     : idx,
            "document_title": title,
            "page_number"   : page,
            "heading"       : heading,
            "qdrant_id"     : h.id,
            "score"         : h.score,
            "url"           : url,
        })

    # 4) ask LLM ------------------------------------------------------------
    system_prompt = (
        "You are a helpful assistant that answers ONLY from the provided "
        "hospital‑policy context. Cite source numbers [1] etc. If no answer "
        "is present, say so. After your answer suggest 1‑3 follow‑up questions."
    )
    user_msg = f"Context:\n{os.linesep.join(ctx_lines)}\n\nQuestion: {query}"

    try:
        chat = openai_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_msg},
            ]
        )
        answer = chat.choices[0].message.content.strip()
    except (APIError, RateLimitError) as e:
        err = f"ChatCompletion error: {e}"
        log.error(err, exc_info=True)
        return {"answer": "[LLM error]", "citations": citations, "error": err}

    return {"answer": answer, "citations": citations, "error": None}
