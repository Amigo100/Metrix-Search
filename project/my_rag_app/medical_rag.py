# file: my_rag_app/medical_rag.py
import logging
from typing import List

from .rag_config import Config
from .query_processor import QueryProcessor
from .vector_store import QdrantRetriever
from .response_generator import ResponseGenerator
from .data_ingestion import MedicalDataIngestion


class MedicalRAG:
    """
    Orchestrates:  QueryProcessor ➜ QdrantRetriever ➜ ResponseGenerator
    """

    def __init__(self, config: Config):
        self.logger = logging.getLogger(__name__)
        self.config = config

        # 1) Embedder
        self.query_processor = QueryProcessor(config, config.rag.embedding_model)

        # 2) Vector store retriever
        self.retriever = QdrantRetriever(config)

        # 3) Choose LLM model name, no matter which field your config uses
        model_name = (
            getattr(config.rag, "llm_model", None)     # new field name
            or getattr(config.rag, "llm", None)        # legacy field
            or "gpt-3.5-turbo"                         # sensible default
        )
        self.logger.info("Using chat‑completion model: %s", model_name)

        self.responder = ResponseGenerator(config, model_name)

        # 4) Optional ingestor
        self.ingestor = MedicalDataIngestion()

    # ---------------------------------------------------------------------
    # Public methods
    # ---------------------------------------------------------------------
    def process_query(
        self,
        user_input: str,
        chat_history: List[dict],
        mode: str = "chat",
        template_name: str | None = None,
    ):
        embedding, filters = self.query_processor.process_query(user_input)
        docs = self.retriever.retrieve(
            query_vector=embedding,
            filters=filters,
            top_k=5,
        )
        return self.responder.generate_response(
            query=user_input,
            retrieved_docs=docs,
            chat_history=chat_history,
            mode=mode,
            template_name=template_name,
        )

    def ingest_file(self, file_path: str):
        return self.ingestor.ingest_file(file_path)
