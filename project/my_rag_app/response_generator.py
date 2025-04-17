# file: my_rag_app/response_generator.py
import logging
from typing import List, Dict, Any, Optional

from my_rag_app.openai_client import client  # singleton OpenAI(>=1.0)

class ResponseGenerator:
    """
    Uses the Chat Completions API to turn retrieved context + history into
    a Markdown answer. Returns {response, sources, confidence}.
    """

    def __init__(self, config, model_name: str):
        self.logger = logging.getLogger(__name__)
        self.cfg = config
        self.model = model_name  # e.g. "gpt-3.5-turbo"

        self.include_sources: bool = getattr(config.rag, "include_sources", True)
        self.max_context: int = getattr(config.rag, "max_context_length", 3_000)

        default_instr = (
            "You are a hospital‑based clinical decision‑support assistant. "
            "Provide concise, evidence‑based guidance in **Markdown**."
        )
        self.base_instructions: str = getattr(
            config.rag, "response_format_instructions", default_instr
        )

    # ───────────────────────── Public API ──────────────────────────
    def generate_response(
        self,
        query: str,
        retrieved: List[Dict[str, Any]],
        chat_history: List[Dict[str, str]],
        mode: str = "chat",
        template_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        context_text = self._format_context(retrieved)
        system_msg = self._build_system_prompt(
            query, context_text, chat_history, mode, template_name
        )

        self.logger.debug("Sending %d msgs to %s", len(chat_history) + 2, self.model)
        resp = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_msg},
                *chat_history,
                {"role": "user", "content": query},
            ],
        )
        answer = resp.choices[0].message.content

        return {
            "response": answer,
            "sources": self._extract_sources(retrieved) if self.include_sources else [],
            "confidence": self._confidence(retrieved),
        }

    # ───────────────────────── Helpers ─────────────────────────────
    def _build_system_prompt(
        self,
        query: str,
        context: str,
        history: List[Dict[str, str]],
        mode: str,
        template: Optional[str],
    ) -> str:
        hist_txt = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in history)

        instructions = self.base_instructions
        if mode == "scribe":
            instructions = (
                "You are a clinical scribe AI. "
                f"Convert the transcript into a professional document using the "
                f"template: {template or 'General Scribe Template'}.\n\n"
                + instructions
            )

        return (
            "You are a hospital‑based clinical decision‑support assistant.\n\n"
            f"### Conversation History (for reference)\n{hist_txt}\n\n"
            f"### Retrieved Context\n{context or '_No relevant context_'}\n\n"
            f"{instructions}\n\nRespond in **Markdown**."
        ).strip()

    def _format_context(self, docs: List[Dict[str, Any]]) -> str:
        out, length = [], 0
        for i, d in enumerate(docs):
            snippet = (
                f"**Doc {i+1}:** {d.get('content','').strip()}\n"
                f"(Source: {d.get('source') or d.get('metadata',{}).get('source','Unknown')})\n\n"
            )
            if length + len(snippet) > self.max_context:
                break
            out.append(snippet)
            length += len(snippet)
        return "".join(out)

    @staticmethod
    def _extract_sources(docs: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        seen, out = set(), []
        for d in docs:
            src = d.get("source") or d.get("metadata", {}).get("source", "Unknown Source")
            if src not in seen:
                out.append({"title": src})
                seen.add(src)
            if len(out) >= 5:
                break
        return out

    @staticmethod
    def _confidence(docs: List[Dict[str, Any]]) -> float:
        if not docs:
            return 0.0
        top3 = [d.get("score", 0.0) for d in docs[:3]]
        return sum(top3) / len(top3) if top3 else 0.0
