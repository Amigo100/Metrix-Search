# file: my_rag_app/rag_config.py
"""
Central configuration object for the RAG service.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    class rag:
        # -----------------------------------------------------------
        # Vector‑store / Qdrant
        # -----------------------------------------------------------
        use_local = True
        local_path = "qdrant.db"
        url = os.getenv("QDRANT_URL", "https://YOUR-QDRANT-URL")
        api_key = os.getenv("QDRANT_API_KEY", "YOUR-QDRANT-KEY")
        collection_name = "medical_documents"
        embedding_dim = 1536
        distance_metric = "cosine"

        # -----------------------------------------------------------
        # LLM & embedding model names  (NO OBJECTS HERE!)
        # -----------------------------------------------------------
        llm_model = "gpt-3.5-turbo"
        embedding_model = "text-embedding-ada-002"

        # -----------------------------------------------------------
        # Chunking & prompt limits
        # -----------------------------------------------------------
        chunk_size = 300
        chunk_overlap = 50
        max_context_length = 3000

        # -----------------------------------------------------------
        # Formatting
        # -----------------------------------------------------------
        response_format_instructions = """
Please provide your answer in clear, concise medical language.
Cite your sources if relevant.
"""
        include_sources = True
