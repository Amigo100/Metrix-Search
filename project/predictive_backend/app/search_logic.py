# predictive_backend/app/search_logic.py
"""
Semantic‑search helper – **does NOT interfere** with ML‑prediction code.

▪ Embeds the query with OpenAI
▪ Retrieves top‑k chunks from Qdrant  (default collection = "policy_documents")
▪ Builds an LLM answer and returns citations that already contain a backend URL
  you can open from the front‑end.

The public function is   perform_rag_search(query: str, ...)
so existing imports from predictive_backend.app.main continue to work.
"""
from __future__ import annotations

import os
import logging
import urllib.parse
from typing import List, Dict, Any, Optional

from openai import OpenAI, APIError, RateLimitError

# ---------------------------------------------------------------------------
# 🔧  FIXED: correct package‑level import for shared Qdrant client helper
# ---------------------------------------------------------------------------
from predictive_backend.app.qdrant_client import get_qdrant_client

# ────────────────────────────────────────────────────────────────
# Config & logging
# ────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.error("OPENAI_API_KEY not found in environment.")
    raise ValueError("OPENAI_API_KEY must be set for semantic search.")

EMBEDDING_MODEL           = "text-embedding-ada-002"
CHAT_MODEL                = "gpt-4"
DEFAULT_QDRANT_COLLECTION = "policy_documents"   # ← matches ingest script
DEFAULT_SEARCH_LIMIT      = 5

openai_client = OpenAI(api_key=OPENAI_API_KEY)
logger.info("OpenAI client initialised.")

# ────────────────────────────────────────────────────────────────
# Main function
# ────────────────────────────────────────────────────────────────
def perform_rag_search(
    query: str,
    collection: str = DEFAULT_QDRANT_COLLECTION,
    limit: int     = DEFAULT_SEARCH_LIMIT
) -> Dict[str, Any]:
    """
    Returns:
        {
          "answer": str,
          "citations": [ {source_id, document_title, page_number, heading,
                          qdrant_id, score, url}, ... ],
          "error": Optional[str]
        }
    """
    try:
        qc = get_qdrant_client()  # ⇢ shared across predictive features

        # 1) embed the query --------------------------------------------------
        logger.info("Embedding query...")
        try:
            resp = openai_client.embeddings.create(
                model=EMBEDDING_MODEL, input=query
            )
            query_vec = resp.data[0].embedding
        except (APIError, RateLimitError) as e:
            msg = f"Embedding API error: {e}"
            logger.error(msg, exc_info=True)
            return {"answer": "", "citations": [], "error": msg}

        # 2) similarity search -----------------------------------------------
        logger.info(f"Qdrant search in '{collection}' limit={limit}")
        try:
            hits = qc.search(
                collection_name=collection,
                query_vector=query_vec,
                limit=limit,
                with_payload=True,
            )
        except Exception as e:
            msg = f"Qdrant search failed: {e}"
            logger.error(msg, exc_info=True)
            return {"answer": "", "citations": [], "error": msg}

        if not hits:
            return {
                "answer": "No relevant information found in the policy documents.",
                "citations": [],
                "error": None,
            }

        # 3) build context & citations ---------------------------------------
        context_chunks: List[str] = []
        citations:      List[Dict[str, Any]] = []

        for idx, h in enumerate(hits, 1):
            pl  = h.payload or {}
            chunk_text = pl.get("content") or pl.get("text") or "[No text]"
            title      = pl.get("document_title", "Unknown Document")
            page       = pl.get("page_number")
            heading    = pl.get("heading", "N/A")

            context_chunks.append(f"[{idx}] {chunk_text}")

            # generate backend PDF URL (best‑effort)
            url = None
            if title != "Unknown Document":
                try:
                    fn = title.replace(" ", "_")
                    if not fn.lower().endswith(".pdf"):
                        fn += ".pdf"
                    url = f"/predictive/api/documents/view/{urllib.parse.quote(fn)}"
                except Exception as e:
                    logger.debug("URL generation failed for %s: %s", title, e)

            citations.append(
                {
                    "source_id": idx,
                    "document_title": title,
                    "page_number": page,
                    "heading": heading,
                    "qdrant_id": h.id,
                    "score": h.score,
                    "url": url,
                }
            )

        # 4) ask the LLM ------------------------------------------------------
        system_prompt = """
You are a helpful assistant who answers questions based ONLY on the
provided context from internal hospital policy documents.

• Cite sources using the numbers I provide (e.g. [1]).
• If the context lacks an answer, state that clearly.
• After your answer, suggest 1‑3 follow‑up questions the user might ask,
  each on its own line.
""".strip()

        user_msg = f"Context:\n{chr(10).join(context_chunks)}\n\nQuestion: {query}"

        logger.info("Calling OpenAI ChatCompletion...")
        try:
            chat_resp = openai_client.chat.completions.create(
                model=CHAT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_msg},
                ],
            )
            answer_text = chat_resp.choices[0].message.content.strip()
        except (APIError, RateLimitError) as e:
            msg = f"ChatCompletion API error: {e}"
            logger.error(msg, exc_info=True)
            return {"answer": "[Error generating answer]", "citations": citations, "error": msg}

        # 5) return -----------------------------------------------------------
        return {"answer": answer_text, "citations": citations, "error": None}

    except Exception as e:
        logger.error("Uncaught error in perform_rag_search: %s", e, exc_info=True)
        return {"answer": "", "citations": [], "error": str(e)}
