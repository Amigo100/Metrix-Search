from __future__ import annotations
import os, logging, urllib.parse
from typing import Dict, Any, List

from openai import OpenAI, APIError, RateLimitError
from .vector_client import get_qdrant_client, COLLECTION

# ────────────── logging & OpenAI init ──────────────────────────
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    raise RuntimeError("Set OPENAI_API_KEY for semantic-search")
openai = OpenAI(api_key=OPENAI_KEY)

EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-ada-002")
CHAT_MODEL = os.getenv("CHAT_MODEL", "gpt-4o-mini")
SEARCH_LIMIT = int(os.getenv("SEARCH_LIMIT", "20"))

# ────────────── public function the router will call ───────────
def perform_rag_search(query: str) -> Dict[str, Any]:
    """
    returns dict(answer:str, error:str|None)
    """
    try:
        qc = get_qdrant_client()

        # 1️⃣ Embedding ----------------------------------------------------
        try:
            vec = openai.embeddings.create(
                model=EMBED_MODEL,
                input=query,
            ).data[0].embedding
        except (APIError, RateLimitError) as e:
            err = f"OpenAI embedding error: {e}"
            log.error(err, exc_info=True)
            return {"answer": "", "error": err}

        # 2️⃣ Vector search -------------------------------------------------
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
            return {"answer": "", "error": err}

        if not hits:
            return {"answer": "No matching policy text has been found.", "error": None}

        # 3️⃣ Build context snippets ---------------------------------------
        ctx: List[str] = []
        for i, h in enumerate(hits, 1):
            pl = h.payload or {}
            text = pl.get("content") or pl.get("text") or "[NO TEXT]"
            ctx.append(f"[{i}] {text}")

        # 4️⃣ Ask the LLM ---------------------------------------------------
        sys_prompt = (
            "You are an AI assistant that provides answers ONLY using the numbered context snippets provided. "
            "When you respond: "
            "1. Provide a concise, direct answer to the user’s query using the available snippets. "
            "2. Under a heading 'Additional Information', raise important considerations likely to be useful and relevant to the user. "
            "3. Finally, ask three follow-up questions that expand on the query or explores next steps. These questions must be grounded in the content of the snippets whenever possible. "

            "If you cannot find relevant information in the snippets provided, state that the requested information is not available in the policy document repository. "

            "Do NOT provide any details that are not directly drawn from the context snippets."
        )
        join_ctx = "\n\n".join(ctx)
        user_msg = f"CONTEXT:\n{join_ctx}\n\nQUESTION: {query}"

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
            return {"answer": "", "error": err}

        return {"answer": answer, "error": None}

    except Exception as ex:
        log.error("perform_rag_search failed: %s", ex, exc_info=True)
        return {"answer": "", "error": str(ex)}
