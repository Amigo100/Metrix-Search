# __init__.py

import logging
import time
import json
import datetime
import uuid
import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, Union

# from sentence_transformers import SentenceTransformer
from .vector_store import QdrantRetriever
from .document_processor import MedicalDocumentProcessor
from .query_processor import QueryProcessor
from .reranker import Reranker
from .response_generator import ResponseGenerator
from .data_ingestion import MedicalDataIngestion
# from .evaluation import RAGEvaluator  # Uncomment when evaluation is implemented

class MedicalRAG:
    """
    Medical Retrieval-Augmented Generation system that integrates all components.
    """

    def __init__(self, config):
        """
        Initialize the RAG Agent.

        Args:
            config: Configuration object with RAG settings.
        """
        self.config = config

        # Initialize all components
        self._initialize()

    def _initialize(self):
        """Initialize the RAG components and load documents."""
        try:
            self.logger = logging.getLogger(__name__)
            self.logger.info("Initializing Medical RAG system")

            # Initialize the LLM and embedding model from config
            self.llm = self.config.rag.llm
            self.logger.info(f"Using LLM: {type(self.llm).__name__}")

            self.embedding_model = self.config.rag.embedding_model
            self.logger.info(f"Using embedding model: {type(self.embedding_model).__name__}")

            # Initialize the query processor
            self.query_processor = QueryProcessor(self.config, self.embedding_model)

            # Initialize the document processor
            self.document_processor = MedicalDocumentProcessor(self.config, self.embedding_model)

            # Initialize the vector store using QdrantRetriever
            self.retriever = QdrantRetriever(self.config)

            # Initialize the response generator with the LLM
            self.response_generator = ResponseGenerator(self.config, self.llm)

            # Initialize the reranker if configured
            self.reranker = None
            if getattr(self.config.rag, "use_reranker", False):
                self.reranker = Reranker(self.config)
                self.logger.info("Using reranker for result refinement")

            # Check the number of documents in the vector store
            total_docs = self.retriever.count_documents()
            self.logger.info(f"Vector store contains {total_docs} documents")
            if total_docs == 0:
                self.logger.warning("No documents in vector store. Results may be limited.")

            # Set default retrieval parameters
            self.top_k = getattr(self.config.rag, "top_k", 5)
            self.similarity_threshold = getattr(self.config.rag, "similarity_threshold", 0.0)

            # Initialize the data ingestion component
            self.data_ingestion = MedicalDataIngestion()

            self.logger.info("Medical RAG system successfully initialized")

        except Exception as e:
            self.logger.error(f"Error initializing RAG system: {e}")
            import traceback
            self.logger.error(traceback.format_exc())
            raise

    def process_query(self, query: str, chat_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Process a query using the RAG system (with optional multi-turn history).

        Args:
            query: The user query.
            chat_history: Optional list of dicts with previous chat turns.

        Returns:
            A response dictionary (e.g., { "response": "...", "sources": [...], "confidence": X }).
        """
        self.logger.info(f"RAG Agent processing query: {query}")
        result = self.query(query, chat_history)
        return result

    def query(self, query: str, chat_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Process a query and generate a response using the RAG pipeline.

        Args:
            query: User query string.
            chat_history: Optional multi-turn context.

        Returns:
            Dictionary containing the response and related metadata.
        """
        start_time = time.time()
        self.logger.info(f"Processing query: {query}")
        try:
            # 1) Process the query to obtain its embedding and optional metadata filters
            query_embedding, filters = self.query_processor.process_query(query)

            # 2) Retrieve relevant documents using the vector store
            retrieved_docs = self._retrieve_documents(query_embedding, filters, query)

            # 3) Filter by similarity threshold, if specified
            if self.similarity_threshold > 0:
                retrieved_docs = [
                    doc for doc in retrieved_docs if doc.get('score', 0) >= self.similarity_threshold
                ]
                self.logger.info(f"After similarity threshold: {len(retrieved_docs)} documents")

            # 4) Use reranker if available
            if self.reranker and len(retrieved_docs) > 1:
                reranked_docs = self.reranker.rerank(query, retrieved_docs)
                self.logger.info(f"After reranking: {len(reranked_docs)} documents")
            else:
                reranked_docs = retrieved_docs

            # 5) Generate a final response (pass chat history for multi-turn support)
            response = self.response_generator.generate_response(
                query=query,
                retrieved_docs=reranked_docs,
                chat_history=chat_history
            )

            # 6) Add processing time
            response["processing_time"] = time.time() - start_time

            return response

        except Exception as e:
            self.logger.error(f"Error processing query: {e}")
            import traceback
            self.logger.error(traceback.format_exc())
            return {
                "response": f"I encountered an error while processing your query: {str(e)}",
                "sources": [],
                "confidence": 0.0,
                "processing_time": time.time() - start_time
            }

    def _retrieve_documents(self, query_embedding, filters, query: str) -> List[Dict[str, Any]]:
        """
        Retrieve documents from the vector store.

        Args:
            query_embedding: The embedding vector for the query.
            filters: Filters extracted from query processing.
            query: The original query string.

        Returns:
            A list of retrieved documents.
        """
        self.logger.info(f"Retrieving documents with filters: {filters}")
        retrieved_docs = self.retriever.retrieve(
            query_vector=query_embedding,
            filters=filters
        )
        self.logger.info(f"Retrieved {len(retrieved_docs)} documents")
        return retrieved_docs

    def ingest_documents(self, documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Ingest multiple documents into the RAG system.

        Args:
            documents: A list of dictionaries (each containing 'content' and 'metadata').

        Returns:
            A dictionary with ingestion results.
        """
        start_time = time.time()
        self.logger.info(f"Ingesting {len(documents)} documents")
        try:
            processed_documents = []
            document_ids = []

            for document in documents:
                content = document.get("content", "")
                metadata = document.get("metadata", {})

                # Add a unique ID if necessary
                if "id" not in metadata:
                    metadata["id"] = str(uuid.uuid4())

                # Process the document to create chunks
                processed_chunks = self.document_processor.process_document(content, metadata)
                if processed_chunks:
                    processed_documents.extend(processed_chunks)
                    for chunk in processed_chunks:
                        document_ids.append(chunk["id"])
                        # Save processed chunk to disk
                        processed_dir = Path(self.config.rag.processed_docs_dir)
                        processed_dir.mkdir(exist_ok=True, parents=True)
                        doc_path = processed_dir / f"{chunk['id']}.json"
                        with open(doc_path, 'w', encoding='utf-8') as f:
                            json_safe_chunk = self._ensure_json_serializable(chunk)
                            json.dump(json_safe_chunk, f, indent=2)

            if not processed_documents:
                return {
                    "success": False,
                    "error": "No documents were successfully processed",
                    "processing_time": time.time() - start_time
                }

            # Prepare and upsert document embeddings in batches.
            document_batch = []
            for doc in processed_documents:
                doc_emb = self.embedding_model.embed_documents([doc["content"]])[0]
                document_record = {
                    "id": doc["id"],
                    "content": doc["content"],
                    "embedding": doc_emb,
                    "metadata": doc["metadata"]
                }
                document_batch.append(document_record)

            self.retriever.upsert_documents(document_batch)

            return {
                "success": True,
                "documents_ingested": len(documents),
                "chunks_processed": len(processed_documents),
                "document_ids": document_ids,
                "processing_time": time.time() - start_time
            }

        except Exception as e:
            self.logger.error(f"Error ingesting documents: {e}")
            import traceback
            self.logger.error(traceback.format_exc())
            return {
                "success": False,
                "error": str(e),
                "documents_processed": 0,
                "processing_time": time.time() - start_time
            }

    def ingest_file(self, file_path: str) -> Dict[str, Any]:
        """
        Ingest a single file into the RAG system.

        Args:
            file_path: The path to the file to ingest.

        Returns:
            A dictionary with the results of ingestion.
        """
        start_time = time.time()
        self.logger.info(f"Ingesting file: {file_path}")
        try:
            ingestion_result = self.data_ingestion.ingest_file(file_path)
            if not ingestion_result.get("success"):
                return {
                    "success": False,
                    "error": ingestion_result.get("error", "Unknown error during file ingestion"),
                    "processing_time": time.time() - start_time
                }

            let_docs = []
            if "document" in ingestion_result:
                let_docs = [ingestion_result["document"]]
            elif "documents" in ingestion_result:
                let_docs = ingestion_result["documents"]

            if let_docs:
                return self.ingest_documents(let_docs)
            else:
                return {
                    "success": False,
                    "error": "No valid documents found in file",
                    "processing_time": time.time() - start_time
                }
        except Exception as e:
            self.logger.error(f"Error ingesting file: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_time": time.time() - start_time
            }

    def ingest_directory(self, directory_path: str, file_extension: Optional[str] = None) -> Dict[str, Any]:
        """
        Ingest all files within a directory into the RAG system.

        Args:
            directory_path: The directory path containing files.
            file_extension: Optional file extension filter (e.g. ".txt", ".pdf").

        Returns:
            A dictionary with directory ingestion results.
        """
        start_time = time.time()
        self.logger.info(f"Ingesting directory: {directory_path}")
        try:
            directory_results = self.data_ingestion.ingest_directory(directory_path, file_extension)
            all_documents = []

            for file_path in Path(directory_path).glob(f"*{file_extension or ''}"):
                try:
                    ingestion_result = self.data_ingestion.ingest_file(str(file_path))
                    if ingestion_result.get("success"):
                        if "document" in ingestion_result:
                            all_documents.append(ingestion_result["document"])
                        elif "documents" in ingestion_result:
                            all_documents.extend(ingestion_result["documents"])
                except Exception as e:
                    self.logger.error(f"Error processing file {file_path}: {e}", exc_info=True)

            if all_documents:
                ingestion_result = self.ingest_documents(all_documents)
                ingestion_result["files_processed"] = directory_results.get("files_processed", 0)
                ingestion_result["errors"] = directory_results.get("errors", [])
                return ingestion_result
            else:
                return {
                    "success": False,
                    "error": "No valid documents found in directory",
                    "files_processed": directory_results.get("files_processed", 0),
                    "errors": directory_results.get("errors", []),
                    "processing_time": time.time() - start_time
                }
        except Exception as e:
            self.logger.error(f"Error ingesting directory: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_time": time.time() - start_time
            }

    def refresh_collection(self) -> Dict[str, Any]:
        """
        Refresh the vector store collection (e.g. update search index).

        Returns:
            A dictionary with refresh details.
        """
        start_time = time.time()
        self.logger.info("Refreshing vector database collection")
        try:
            refresh_result = self.retriever.refresh_collection()
            return {
                "success": True,
                "details": refresh_result,
                "processing_time": time.time() - start_time
            }
        except Exception as e:
            self.logger.error(f"Error refreshing collection: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "processing_time": time.time() - start_time
            }

    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Retrieve statistics from the vector store collection.

        Returns:
            A dictionary with collection statistics.
        """
        try:
            stats = self.retriever.get_collection_stats()
            return {
                "success": True,
                "stats": stats
            }
        except Exception as e:
            self.logger.error(f"Error getting collection stats: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }

    def tune_retrieval_parameters(self, queries: List[str], expected_docs: List[List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Tune retrieval parameters based on test queries and expected document sets.

        Args:
            queries: List of test query strings.
            expected_docs: List of expected document lists for each query.

        Returns:
            A dictionary with tuning results.
        """
        start_time = time.time()
        self.logger.info(f"Tuning retrieval parameters with {len(queries)} test queries")
        try:
            initial_scores = []
            for query in queries:
                query_vector, _ = self.query_processor.process_query(query)
                retrieved_docs = self.retriever.retrieve(query_vector)
                score = 0  # Placeholder for evaluation logic.
                initial_scores.append(score)
            initial_avg_score = sum(initial_scores) / len(initial_scores) if initial_scores else 0

            param_combinations = [
                {"top_k": 5, "mmr_lambda": 0.7},
                {"top_k": 10, "mmr_lambda": 0.7},
                {"top_k": 5, "mmr_lambda": 0.5},
                {"top_k": 10, "mmr_lambda": 0.5}
            ]
            best_params = None
            best_score = initial_avg_score
            for params in param_combinations:
                scores = []
                for query in queries:
                    query_vector, _ = self.query_processor.process_query(query)
                    retrieved_docs = self.retriever.retrieve(
                        query_vector,
                        {"top_k": params["top_k"], "mmr_lambda": params["mmr_lambda"]}
                    )
                    score = 0  # Placeholder for evaluation logic.
                    scores.append(score)
                avg_score = sum(scores) / len(scores) if scores else 0
                if avg_score > best_score:
                    best_score = avg_score
                    best_params = params

            if best_params and best_score > initial_avg_score:
                self.config.rag.retrieval.top_k = best_params["top_k"]
                self.config.rag.retrieval.mmr_lambda = best_params["mmr_lambda"]
                self.logger.info(f"Updated retrieval parameters: {best_params}")

            return {
                "success": True,
                "initial_score": initial_avg_score,
                "best_score": best_score,
                "best_parameters": best_params if best_params else "No improvement found",
                "processing_time": time.time() - start_time
            }
        except Exception as e:
            self.logger.error(f"Error tuning retrieval parameters: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "processing_time": time.time() - start_time
            }

    def clear_collection(self) -> Dict[str, Any]:
        """
        Clear all documents from the vector store collection.

        Returns:
            A dictionary with the results of the clear operation.
        """
        start_time = time.time()
        self.logger.info("Clearing vector database collection")
        try:
            clear_result = self.retriever.clear_collection()
            return {
                "success": True,
                "details": clear_result,
                "processing_time": time.time() - start_time
            }
        except Exception as e:
            self.logger.error(f"Error clearing collection: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "processing_time": time.time() - start_time
            }

    def _ensure_json_serializable(self, obj: Any) -> Any:
        """
        Recursively convert an object to a JSON-serializable format.

        Args:
            obj: The object to convert.

        Returns:
            A JSON-serializable version of the object.
        """
        if isinstance(obj, dict):
            return {k: self._ensure_json_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._ensure_json_serializable(item) for item in obj]
        elif isinstance(obj, (str, int, float, bool)) or obj is None:
            return obj
        else:
            return str(obj)
