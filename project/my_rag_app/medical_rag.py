# file: my_rag_app/medical_rag.py
import logging

from .rag_config import Config
from .query_processor import QueryProcessor
from .vector_store import QdrantRetriever
from .response_generator import ResponseGenerator
from .data_ingestion import MedicalDataIngestion

class MedicalRAG:
    """
    QueryProcessor ➜ QdrantRetriever ➜ ResponseGenerator
    """

    def __init__(self, config: Config):
        self.logger = logging.getLogger(__name__)
        self.config = config

        self.query_processor = QueryProcessor(config, config.rag.embedding_model)
        self.retriever = QdrantRetriever(config)

        # Pass the model‑name string instead of an OpenAIChatLLM object
        self.responder = ResponseGenerator(config, config.rag.llm_model)

        self.ingestor = MedicalDataIngestion()

    def process_query(
        self,
        user_input: str,
        chat_history: list,
        mode: str = "chat",
        template_name: str = None,
    ):
        embedding, filters = self.query_processor.process_query(user_input)
        docs = self.retriever.retrieve(embedding, filters, top_k=5)
        return self.responder.generate_response(
            query=user_input,
            retrieved_docs=docs,
            chat_history=chat_history,
            mode=mode,
            template_name=template_name,
        )

    def ingest_file(self, file_path: str):
        return self.ingestor.ingest_file(file_path)
