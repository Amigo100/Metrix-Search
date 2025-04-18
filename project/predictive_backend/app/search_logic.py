# predictive_backend/app/search_logic.py
"""
Semantic‑search helper – DOES NOT interfere with the ML endpoints.

1. Embed query with OpenAI
2. Similarity‑search in Qdrant (collection = policy_documents)
3. Ask GPT‑4 to answer, citing the numbered chunks
"""

from __future__ import annotations

import os, logging, urllib.parse
from typing import List, Dict, Any, Optional
from openai import OpenAI, APIError, RateLimitError

# ✔  FIXED absolute path – matches folder layout in § 1
from predictive_backend.app.qdrant_client import get_qdrant_client

# ───────────────────────── CONFIG ──────────────────────────
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    raise RuntimeError("OPENAI_API_KEY must be set")

COLLECTION   = os.getenv("QDRANT_COLLECTION_NAME", "policy_documents")
EMBED_MODEL  = "text-embedding-ada-002"
CHAT_MODEL   = "gpt-4"
SEARCH_LIMIT = 5

openai = OpenAI(api_key=OPENAI_KEY)
log.info("OpenAI client ready")

# ───────────────────────── RAG SEARCH ──────────────────────
def perform_rag_search(query: str,
                       collection: str = COLLECTION,
                       limit: int = SEARCH_LIMIT) -> Dict[str, Any]:
    """
    Returns { answer, citations[], error }
    """
    try:
        qc = get_qdrant_client()

        # 1️⃣ embed -----------------------------------------------------------
        try:
            emb = openai.embeddings.create(model=EMBED_MODEL, input=query)
            vec = emb.data[0].embedding
        except (APIError, RateLimitError) as e:
            msg = f"OpenAI embedding error: {e}"
            log.error(msg, exc_info=True)
            return {"answer": "", "citations": [], "error": msg}

        # 2️⃣ search ----------------------------------------------------------
        try:
            hits = qc.search(
                collection_name=collection,
                query_vector=vec,
                limit=limit,
                with_payload=True,
            )
        except Exception as e:
            msg = f"Qdrant search failed: {e}"
            log.error(msg, exc_info=True)
            return {"answer": "", "citations": [], "error": msg}

        if not hits:
            return {"answer": "No matching policies found.",
                    "citations": [], "error": None}

        # 3️⃣ context ‑‑> citations ------------------------------------------
        ctx, cites = [], []
        for i, h in enumerate(hits, 1):
            pl   = h.payload or {}
            text = pl.get("content") or pl.get("text") or "[No text]"
            doc  = pl.get("document_title", "Unknown Document")
            page = pl.get("page_number")
            head = pl.get("heading", "N/A")

            ctx.append(f"[{i}] {text}")

            # build backend URL
            url = None
            if doc != "Unknown Document":
                fn = doc.replace(" ", "_")
                if not fn.lower().endswith(".pdf"):
                    fn += ".pdf"
                url = f"/predictive/api/documents/view/{urllib.parse.quote(fn)}"

            cites.append({
                "source_id"    : i,
                "document_title": doc,
                "page_number"  : page,
                "heading"      : head,
                "qdrant_id"    : h.id,
                "score"        : h.score,
                "url"          : url,
            })

        # 4️⃣ LLM answer ------------------------------------------------------
        sys_prompt = (
            "You are a helpful assistant who answers ONLY from the "
            "provided context. Cite sources using [numbers]. "
            "If the answer is not in context say so. "
            "Then suggest 1‑3 follow‑up questions on new lines."
        )
        user_msg = f"Context:\n{'\n\n'.join(ctx)}\n\nQuestion: {query}"

        try:
            chat = openai.chat.completions.create(
                model=CHAT_MODEL,
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user",   "content": user_msg},
                ],
            )
            answer = chat.choices[0].message.content.strip()
        except (APIError, RateLimitError) as e:
            msg = f"ChatCompletion error: {e}"
            log.error(msg, exc_info=True)
            return {"answer": "[LLM error]", "citations": cites, "error": msg}

        return {"answer": answer, "citations": cites, "error": None}

    except Exception as ex:
        log.error("perform_rag_search crashed: %s", ex, exc_info=True)
        return {"answer": "", "citations": [], "error": str(ex)}
