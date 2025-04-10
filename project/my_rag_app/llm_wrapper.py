# file: my_rag_app/llm_wrapper.py

import openai
from typing import List
from my_rag_app.local_guardrails import LocalGuardrails

class OpenAIChatLLM:
    """
    Calls OpenAI ChatCompletion (gpt-3.5-turbo) with integrated local guardrails.
    """
    def __init__(self, openai_api_key: str, model_name: str = "gpt-3.5-turbo"):
        if not openai_api_key:
            raise ValueError("OpenAI API key must be provided.")
        self.openai_api_key = openai_api_key
        self.model_name = model_name
        # Pass the invoke method as the callable to the guardrails.
        self.guardrails = LocalGuardrails(self.invoke)
    
    def invoke(self, prompt: str) -> str:
        openai.api_key = self.openai_api_key
        response = openai.ChatCompletion.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": "You are a helpful medical assistant."},
                {"role": "user", "content": prompt}
            ]
        )
        return response["choices"][0]["message"]["content"]

class OpenAIEmbedding:
    """
    Calls the OpenAI Embeddings API (text-embedding-ada-002).
    """
    def __init__(self, openai_api_key: str, embedding_model: str = "text-embedding-ada-002"):
        if not openai_api_key:
            raise ValueError("OpenAI API key must be provided.")
        self.openai_api_key = openai_api_key
        self.embedding_model = embedding_model

    def embed_query(self, text: str) -> List[float]:
        openai.api_key = self.openai_api_key
        res = openai.Embedding.create(model=self.embedding_model, input=[text])
        return res["data"][0]["embedding"]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        openai.api_key = self.openai_api_key
        res = openai.Embedding.create(model=self.embedding_model, input=texts)
        return [item["embedding"] for item in res["data"]]
