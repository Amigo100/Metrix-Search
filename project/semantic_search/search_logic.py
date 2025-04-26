# ───────── project/semantic_search/search_logic.py ─────────
"""
High‑level RAG helper – **pure Python, no FastAPI imports here**.

 1) embed user query with OpenAI
 2) cosine‑search in Qdrant
 3) ask GPT‑4 (or GPT‑3.5‑turbo) to answer, citing numbered chunks
"""

from __future__ import annotations
import os, logging, urllib.parse
from typing import Dict, Any, List

from openai import OpenAI, APIError, RateLimitError
from .vector_client import get_qdrant_client, COLLECTION

# ────────────── logging & OpenAI init ──────────────────────────
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

OPENAI_KEY  = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    raise RuntimeError("Set OPENAI_API_KEY for semantic‑search")
openai = OpenAI(api_key=OPENAI_KEY)

EMBED_MODEL  = os.getenv("EMBED_MODEL", "text-embedding-ada-002")
CHAT_MODEL   = os.getenv("CHAT_MODEL",  "gpt-4o-mini")
SEARCH_LIMIT = int(os.getenv("SEARCH_LIMIT", "5"))

# ────────────── public function the router will call ───────────
def perform_rag_search(query: str) -> Dict[str, Any]:
    """
    returns dict(answer:str, citations:list[dict], error:str|None)
    """
    try:
        qc = get_qdrant_client()

        # 1️⃣ Embeddings ----------------------------------------------------
        try:
            vec = openai.embeddings.create(
                model=EMBED_MODEL,
                input=query,
            ).data[0].embedding
        except (APIError, RateLimitError) as e:
            err = f"OpenAI embedding error: {e}"
            log.error(err, exc_info=True)
            return {"answer": "", "citations": [], "error": err}

        # 2️⃣ Vector search -------------------------------------------------
        try:
            hits = qc.search(
                collection_name=COLLECTION,
                query_vector=vec,
                limit=SEARCH_LIMIT,
                with_payload=True,
            )
        except Exception as e:
            err = f"Qdrant search failed: {e}"
            log.error(err, exc_info=True)
            return {"answer": "", "citations": [], "error": err}

        if not hits:
            return {"answer": "No matching policy text found.",
                    "citations": [], "error": None}

        # 3️⃣ Prep context & citation objects ------------------------------
        ctx:   List[str] = []
        cites: List[Dict[str, Any]] = []
        for i, h in enumerate(hits, 1):
            pl   = h.payload or {}
            text = pl.get("content") or pl.get("text") or "[NO TEXT]"
            doc  = pl.get("document_title", "Unknown Document")
            page = pl.get("page_number")
            head = pl.get("heading", "N/A")

            ctx.append(f"[{i}] {text}")

            url = None
            if doc and doc != "Unknown Document":
                safe = urllib.parse.quote_plus(doc.replace(" ", "_"))
                if not safe.lower().endswith(".pdf"):
                    safe += ".pdf"
                url = f"/predictive/api/documents/view/{safe}"

            cites.append(
                {
                    "source_id": i,
                    "document_title": doc,
                    "page_number": page,
                    "heading": head,
                    "qdrant_id": h.id,
                    "score": h.score,
                    "url": url,
                }
            )

        # 4️⃣ Ask the LLM ---------------------------------------------------
        sys_prompt = (
            "You are an AI assistant that provides answers ONLY using the numbered context snippets provided. " 

            "When you respond: "
            "1. Provide a concise, direct answer to the user’s query using the available snippets. "
            "2. Under a heading 'Additional Information', include any further relevant context or guidance from the snippets (e.g., important contraindications, related guidelines, extra advice). "
            "3. At the end of your response, list the exact citation numbers you used, including sequential page numbers if multiple citations are from the same document. "
            "4. Finally, ask three follow-up questions that either clarify the user’s situation, expand on their query, or help them explore next steps. These questions must be grounded in the content of the snippets whenever possible. "

            "If you cannot find relevant information in the snippets provided, state that the requested information is not available in the policy document repository."

            "Do NOT provide any details that are not directly drawn from the context snippets."

        )
        join_ctx = "\n\n".join(ctx)                       # 🟢 NEW
        user_msg = f"CONTEXT:\n{join_ctx}\n\nQUESTION: {query}"  # 🟢 NEW

        try:
            chat = openai.chat.completions.create(
                model=CHAT_MODEL,
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_msg},
                ],
            )
            answer = chat.choices[0].message.content.strip()
        except (APIError, RateLimitError) as e:
            err = f"ChatCompletion error: {e}"
            log.error(err, exc_info=True)
            return {"answer": "", "citations": cites, "error": err}

        return {"answer": answer, "citations": cites, "error": None}

    except Exception as ex:
        log.error("perform_rag_search failed: %s", ex, exc_info=True)
        return {"answer": "", "citations": [], "error": str(ex)}
# ───────────────────────────────────────────────────────────────
