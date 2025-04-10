# file: my_rag_app/rag_config.py

import os
from dotenv import load_dotenv

# Load environment variables from the .env file located in the project root.
load_dotenv()

from my_rag_app.llm_wrapper import OpenAIChatLLM, OpenAIEmbedding

class Config:
    class rag:
        # Qdrant / Vector DB configuration
        use_local = True
        local_path = "qdrant.db"
        url = os.getenv("QDRANT_URL", "https://YOUR-QDRANT-URL")
        api_key = os.getenv("QDRANT_API_KEY", "YOUR-QDRANT-KEY")
        collection_name = "medical_documents"
        embedding_dim = 1536
        distance_metric = "cosine"

        # LLM & Embeddings configuration:
        # They will read the API key from the environment variable OPENAI_API_KEY.
        llm = OpenAIChatLLM(
            openai_api_key=os.environ.get("OPENAI_API_KEY", ""),
            model_name="gpt-3.5-turbo"
        )
        embedding_model = OpenAIEmbedding(
            openai_api_key=os.environ.get("OPENAI_API_KEY", ""),
            embedding_model="text-embedding-ada-002"
        )

        # RAG chunk defaults
        chunk_size = 300
        chunk_overlap = 50

        # Response formatting
        max_context_length = 3000
        response_format_instructions = """
Please provide your answer in clear, concise medical language.
Cite your sources if relevant.
"""
        include_sources = True
