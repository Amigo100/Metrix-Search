import logging
from typing import List, Dict, Any, Optional

class ResponseGenerator:
    """
    Generates the final LLM response based on user query, retrieved docs, and chat history.
    Includes logic to handle different 'modes' such as 'scribe' for converting transcripts
    into structured clinical documents.
    """

    def __init__(self, config, llm):
        self.logger = logging.getLogger(__name__)
        self.llm = llm  # Typically an OpenAIChatLLM or similar
        self.config = config

        # Whether to include retrieved sources in the final JSON
        self.include_sources = getattr(config.rag, "include_sources", True)
        # Limit on how many tokens/characters to place in context
        self.max_context_length = getattr(config.rag, "max_context_length", 3000)

        # Default instructions for normal chat or fallback
        default_instructions = """
You are a hospital-based clinical decision support assistant. Provide concise, evidence-based guidance in Markdown.
"""
        self.response_format_instructions = getattr(
            config.rag,
            "response_format_instructions",
            default_instructions
        )

    def generate_response(
        self,
        query: str,
        retrieved_docs: List[Dict[str, Any]],
        chat_history: List[Dict[str, str]],
        mode: str = "chat",
        template_name: str = None
    ) -> Dict[str, Any]:
        """
        Returns a dict with keys:
         - "response": string (the final LLM answer)
         - "sources": list of source references (optional)
         - "confidence": float estimate
        """
        # 1. Build the context snippet
        context_str = self._format_context(retrieved_docs)

        # 2. Build final LLM prompt (with optional specialized instructions for 'scribe' mode)
        prompt = self._build_prompt(query, context_str, chat_history, mode, template_name)
        self.logger.debug(f"Sending prompt to LLM =>\n{prompt}")

        # 3. Invoke the LLM exactly once -> single string answer
        final_answer = self.llm.invoke(prompt)

        # 4. Optionally gather sources & confidence
        sources = self._extract_sources(retrieved_docs) if self.include_sources else []
        confidence = self._calculate_confidence(retrieved_docs)

        # 5. Return the final string in "response"
        return {
            "response": final_answer,
            "sources": sources,
            "confidence": confidence
        }

    def _build_prompt(
        self,
        query: str,
        context: str,
        chat_history: List[Dict[str, str]],
        mode: str,
        template_name: str
    ) -> str:
        """
        Combine conversation history, user query, and retrieved context into one prompt,
        customizing instructions if mode='scribe'.
        """
        # Format chat history
        history_text = ""
        for turn in chat_history:
            role = turn["role"].lower()
            content = turn["content"].strip()
            if role == "system":
                history_text += f"**SYSTEM:** {content}\n\n"
            elif role == "assistant":
                history_text += f"**ASSISTANT:** {content}\n\n"
            else:  # user
                history_text += f"**USER:** {content}\n\n"

        instructions = self.response_format_instructions.strip()

        if mode == "scribe":
            # Extra instructions to transform transcript into a professional note
            instructions = f"""
You are a clinical scribe AI. Transform the user's transcript into a professional clinical document.
Template to use: {template_name or "General Scribe Template"}.

Please format with headings, bullet points, and proper spacing. 
Ensure the final document is in professional style.

{instructions}
""".strip()

        if not context:
            context = "_No relevant context retrieved._\n\n"

        prompt = f"""
You are a hospital-based clinical decision support assistant. Below is the conversation so far, plus some retrieved context from a knowledge base.

**Conversation History:**
{history_text}

**User's Question:**
{query}

**Retrieved Document Context:**
{context}

{instructions}

Please provide your final answer in Markdown format.
"""
        return prompt.strip()

    def _format_context(self, docs: List[Dict[str, Any]]) -> str:
        """
        Summarize or concatenate retrieved docs into a single text snippet,
        respecting max_context_length to avoid overly long prompts.
        """
        context_parts = []
        total_length = 0

        for i, doc in enumerate(docs):
            content = doc.get("content", "").strip()
            source = doc.get("source") or doc.get("metadata", {}).get("source", "Unknown Source")
            snippet = f"**Doc {i+1}:** {content}\n(Source: {source})\n\n"
            if total_length + len(snippet) > self.max_context_length:
                break
            context_parts.append(snippet)
            total_length += len(snippet)

        return "".join(context_parts)

    def _extract_sources(self, docs: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        Gather up to 5 unique sources from retrieved docs.
        """
        sources = []
        seen = set()
        for doc in docs:
            src = doc.get("source") or doc.get("metadata", {}).get("source", "Unknown Source")
            if src not in seen:
                sources.append({"title": src})
                seen.add(src)
            if len(sources) >= 5:
                break
        return sources

    def _calculate_confidence(self, docs: List[Dict[str, Any]]) -> float:
        """
        Estimate a confidence score from doc scores (simple average of top 3).
        """
        if not docs:
            return 0.0
        scores = [d.get("score", 0.0) for d in docs[:3]]
        return sum(scores) / len(scores) if scores else 0.0
