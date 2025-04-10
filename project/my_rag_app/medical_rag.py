import logging
from .rag_config import Config
from .query_processor import QueryProcessor
from .vector_store import QdrantRetriever
from .response_generator import ResponseGenerator
from .data_ingestion import MedicalDataIngestion

class MedicalRAG:
    """
    Combines QueryProcessor -> QdrantRetriever -> ResponseGenerator,
    handling ingestion and queries for the clinical RAG flow.
    """

    def __init__(self, config: Config):
        self.logger = logging.getLogger(__name__)
        self.config = config

        self.query_processor = QueryProcessor(config, config.rag.embedding_model)
        self.retriever = QdrantRetriever(config)
        self.responder = ResponseGenerator(config, config.rag.llm)
        self.ingestor = MedicalDataIngestion()

    def process_query(self, user_input: str, chat_history: list, mode: str = "chat", template_name: str = None):
        """
        1) Convert user_input to embedding + filters
        2) Retrieve docs
        3) Generate final LLM answer with memory
        4) Condition the final output on mode/template
        """
        # Step 1: embed + parse
        embedding, filters = self.query_processor.process_query(user_input)

        # Step 2: retrieve docs
        docs = self.retriever.retrieve(query_vector=embedding, filters=filters, top_k=5)

        # Step 3: pass memory to the ResponseGenerator
        result = self.responder.generate_response(
            query=user_input,
            retrieved_docs=docs,
            chat_history=chat_history,
            mode=mode,
            template_name=template_name
        )
        return result

    def ingest_file(self, file_path: str):
        """
        Example ingestion logic. Typically you'd parse or chunk the file,
        embed, and upsert into Qdrant. Simplified here.
        """
        return self.ingestor.ingest_file(file_path)
