# file: my_rag_app/response_generator.py
import logging
from typing import List, Dict, Any, Optional

from my_rag_app.openai_client import client  # ← singleton OpenAI(>=1.0)

class ResponseGenerator:
    """
    Builds the final answer with chat‑completion API.
    • query             – user question
    • retrieved_docs    – context snippets from Qdrant
    • chat_history      – [{'role': 'user'|'assistant'|'system', 'content': str}, …]
    """

    def __init__(self, config, llm_model_name: str):
        self.logger = logging.getLogger(__name__)
        self.config = config
        self.model = llm_model_name  # e.g. "gpt-3.5-turbo" from config

        self.include_sources: bool = getattr(config.rag, "include_sources", True)
        self.max_context_length: int = getattr(config.rag, "max_context_length", 3_000)

        default_instructions = (
            "You are a hospital‑based clinical decision support assistant. "
            "Provide concise, evidence‑based guidance in **Markdown**."
        )
        self.response_format_instructions: str = getattr(
            config.rag, "response_format_instructions", default_instructions
        )

    # ────────────────────────────────────────────────
    # Public entry point
    # ────────────────────────────────────────────────
    def generate_response(
        self,
        query: str,
        retrieved_docs: List[Dict[str, Any]],
        chat_history: List[Dict[str, str]],
        mode: str = "chat",
        template_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        # 1) Build prompt & context
        context_str = self._format_context(retrieved_docs)
        system_prompt = self._build_prompt(
            query, context_str, chat_history, mode, template_name
        )

        # 2) Send once to the LLM
        self.logger.debug(f"Calling {self.model} with {len(chat_history)+1} messages")
        resp = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                *chat_history,  # prior turns as-is
                {"role": "user", "content": query},
            ],
        )
        final_answer = resp.choices[0].message.content

        # 3) Package metadata
        sources = self._extract_sources(retrieved_docs) if self.include_sources else []
        confidence = self._calculate_confidence(retrieved_docs)

        return {"response": final_answer, "sources": sources, "confidence": confidence}

    # ────────────────────────────────────────────────
    # Prompt helpers
    # ────────────────────────────────────────────────
    def _build_prompt(
        self,
        query: str,
        context: str,
        chat_history: List[Dict[str, str]],
        mode: str,
        template_name: Optional[str],
    ) -> str:
        """Return the system‑prompt that instructs the assistant."""
        # Format history for reference (not sent as system prompt)
        hist_lines = []
        for turn in chat_history:
            role = turn["role"].upper()
            hist_lines.append(f"{role}: {turn['content'].strip()}")
        history_text = "\n".join(hist_lines)

        instructions = self.response_format_instructions.strip()
        if mode == "scribe":
            instructions = (
                "You are a clinical scribe AI. "
                f"Transform the user's transcript into a professional document "
                f"using the template: {template_name or 'General Scribe Template'}.\n\n"
                + instructions
            )

        if not context:
            context = "_No relevant knowledge base context was retrieved._"

        return (
            "You are a hospital‑based clinical decision support assistant.\n\n"
            f"### Conversation History (for reference)\n{history_text}\n\n"
            f"### Retrieved Context\n{context}\n\n"
            f"{instructions}\n\n"
            "Respond in **Markdown**."
        ).strip()

    def _format_context(self, docs: List[Dict[str, Any]]) -> str:
        """Concatenate docs up to max_context_length."""
        out, total = [], 0
        for i, d in enumerate(docs):
            snippet = (
                f"**Doc {i+1}:** {d.get('content','').strip()}\n"
                f"(Source: {d.get('source') or d.get('metadata',{}).get('source','Unknown')})\n\n"
            )
            if total + len(snippet) > self.max_context_length:
                break
            out.append(snippet)
            total += len(snippet)
        return "".join(out)

    # ────────────────────────────────────────────────
    # Utility helpers
    # ────────────────────────────────────────────────
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
    def _calculate_confidence(docs: List[Dict[str, Any]]) -> float:
        if not docs:
            return 0.0
        scores = [d.get("score", 0.0) for d in docs[:3]]
        return sum(scores) / len(scores) if scores else 0.0
