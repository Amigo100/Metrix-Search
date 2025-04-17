# file: my_rag_app/llm_wrapper.py
"""
Legacy wrappers kept for backward compatibility.

They now use the shared OpenAI 1.x client.  Nothing in the current RAG
pipeline imports these classes anymore, but if you want to call the LLM
or embedding functions directly elsewhere, you still can.
"""

from typing import List
from my_rag_app.openai_client import client
from my_rag_app.local_guardrails import LocalGuardrails


class OpenAIChatLLM:
    """Thin wrapper around client.chat.completions.create with guardrails."""

    def __init__(self, model_name: str = "gpt-3.5-turbo"):
        self.model_name = model_name
        # Wrap the invoke method with local guard‑rails (optional)
        self.guardrails = LocalGuardrails(self.invoke)

    def invoke(self, prompt: str) -> str:
        resp = client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": "You are a helpful medical assistant."},
                {"role": "user", "content": prompt},
            ],
        )
        return resp.choices[0].message.content


class OpenAIEmbedding:
    """Convenience wrapper for embedding calls."""

    def __init__(self, embedding_model: str = "text-embedding-ada-002"):
        self.embedding_model = embedding_model

    def embed_query(self, text: str) -> List[float]:
        resp = client.embeddings.create(model=self.embedding_model, input=[text])
        return resp.data[0].embedding

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        resp = client.embeddings.create(model=self.embedding_model, input=texts)
        return [d.embedding for d in resp.data]
