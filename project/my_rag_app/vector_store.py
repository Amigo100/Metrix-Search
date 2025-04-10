import logging
from typing import List, Dict, Any, Optional

from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models
from qdrant_client.http.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    MatchAny,
)

class QdrantClientManager:
    """
    A singleton-like pattern ensuring we create only one QdrantClient
    instance for the entire app.
    """
    _client = None

    @classmethod
    def get_client(cls, config):
        if cls._client is None:
            if config.rag.use_local:
                logging.info(f"Connecting to local Qdrant at: {config.rag.local_path}")
                cls._client = QdrantClient(path=config.rag.local_path)
            else:
                logging.info(f"Connecting to remote Qdrant at: {config.rag.url}")
                cls._client = QdrantClient(
                    url=config.rag.url,
                    api_key=config.rag.api_key,
                )
            logging.info("Initialized Qdrant client singleton")
        return cls._client


class QdrantRetriever:
    """
    Handles storage and retrieval of documents using Qdrant.
    Supports flattening nested fields like 'medical_entities' to
    a single list of strings so we can filter with MatchAny.
    """

    def __init__(self, config):
        """
        :param config: a configuration object (with .rag.* fields).
        """
        self.logger = logging.getLogger(__name__)
        self.config = config

        self.collection_name = config.rag.collection_name
        self.embedding_dim = config.rag.embedding_dim
        self.distance_metric = config.rag.distance_metric

        # Retrieve or create a singleton Qdrant client
        self.client = QdrantClientManager.get_client(config)
        self._ensure_collection()

    def _ensure_collection(self):
        """Check if the collection exists; create if not."""
        collections = self.client.get_collections()
        existing_names = [c.name for c in collections.collections]
        if self.collection_name not in existing_names:
            self.logger.info(f"Collection '{self.collection_name}' not found; creating.")
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_dim,
                    distance=Distance.COSINE
                ),
                optimizers_config=qdrant_models.OptimizersConfigDiff(
                    indexing_threshold=10000
                ),
            )
        else:
            self.logger.info(f"Collection '{self.collection_name}' already exists.")

    def count_documents(self) -> int:
        """
        Return the number of vector points (documents) in the collection.
        """
        try:
            col_info = self.client.get_collection(self.collection_name)
            count = col_info.vectors_count
            self.logger.info(f"Collection '{self.collection_name}' has {count} documents.")
            return count
        except Exception as e:
            self.logger.error(f"Error counting documents in '{self.collection_name}': {e}", exc_info=True)
            return 0

    def upsert_documents(self, documents: List[Dict[str, Any]]):
        """
        Insert or update documents in Qdrant. Each doc should have:
          - "id": a unique doc ID (string or int), or we generate one
          - "embedding": list[float]
          - "content": the text
          - "metadata": optional dict with fields like 'source', etc.
        """
        try:
            points = []
            for doc in documents:
                doc_id = doc.get("id")
                if doc_id is None:
                    # fallback: hash content
                    doc_id = str(hash(doc.get("content", "")))

                embedding = doc.get("embedding")
                if embedding is None:
                    raise ValueError("Document missing 'embedding'")

                content = doc.get("content", "")
                metadata = doc.get("metadata", {})

                # Build payload from doc
                payload = {
                    "content": content,
                }
                # Add metadata fields
                for k, v in metadata.items():
                    payload[k] = v

                point = PointStruct(
                    id=doc_id,
                    vector=embedding,
                    payload=payload
                )
                points.append(point)

            # Upsert in batch
            batch_size = 100
            for i in range(0, len(points), batch_size):
                batch = points[i:i+batch_size]
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=batch,
                    wait=True
                )
            self.logger.info(f"Upserted {len(documents)} doc(s) into '{self.collection_name}'.")
        except Exception as e:
            self.logger.error(f"Error upserting documents: {e}", exc_info=True)
            raise

    def retrieve(
        self,
        query_vector: List[float],
        filters: Optional[Dict[str, Any]] = None,
        top_k: int = 5,
        include_metadata: bool = True,
        query_text: Optional[str] = None
    ) -> List[Dict]:
        """
        Perform a vector similarity search in Qdrant, optionally applying filters.
        - If 'filters' has nested dicts (like "medical_entities"), we flatten them
          into a single list of strings for a MatchAny filter.
        """
        self.logger.debug(f"Retrieve with top_k={top_k}, filters={filters}")

        filter_obj = None
        if filters:
            conditions = []
            for key, value in filters.items():
                # If value is a dict, flatten all sub-lists
                if isinstance(value, dict):
                    # e.g. {"diseases": [...], "medications": [...]}
                    # Flatten them into one list
                    combined = []
                    for v in value.values():
                        if isinstance(v, list):
                            combined.extend(v)
                    # Remove duplicates
                    combined = list(set(combined))
                    if combined:
                        conditions.append(
                            FieldCondition(
                                key=key,  # e.g. 'medical_entities'
                                match=qdrant_models.MatchAny(any=combined)
                            )
                        )
                # If it's a flat list of strings/ints/bools
                elif isinstance(value, list):
                    # Check if it's safe to use MatchAny
                    if all(isinstance(x, (str, int, bool)) for x in value):
                        conditions.append(
                            FieldCondition(
                                key=key,
                                match=qdrant_models.MatchAny(any=value)
                            )
                        )
                # If it's a single scalar (str,int,bool)
                elif isinstance(value, (str, int, bool)):
                    conditions.append(
                        FieldCondition(
                            key=key,
                            match=MatchValue(value=value)
                        )
                    )
                else:
                    self.logger.debug(f"Skipping filter key={key} with unsupported type: {type(value)}")

            if conditions:
                filter_obj = Filter(should=conditions)

        # Basic vector search
        search_params = {
            "collection_name": self.collection_name,
            "query_vector": query_vector,
            "limit": top_k,
            "with_payload": True
        }
        if filter_obj:
            search_params["query_filter"] = filter_obj

        try:
            results = self.client.search(**search_params)
            docs = []
            for hit in results:
                doc_payload = hit.payload.copy() if hit.payload else {}
                doc_payload["score"] = hit.score
                docs.append(doc_payload)
            self.logger.info(f"Found {len(docs)} result(s) from '{self.collection_name}'")
            return docs
        except Exception as e:
            self.logger.error(f"Error searching Qdrant: {e}", exc_info=True)
            return []

    def delete_collection(self):
        """Permanently drop the entire collection."""
        try:
            self.client.delete_collection(self.collection_name)
            self.logger.info(f"Deleted collection '{self.collection_name}'.")
        except Exception as e:
            self.logger.error(f"Error deleting collection: {e}", exc_info=True)
            raise

    def wipe_collection(self):
        """Delete and recreate the collection for a clean slate."""
        try:
            self.delete_collection()
            self._ensure_collection()
            self.logger.info(f"Wiped collection '{self.collection_name}' (deleted & recreated).")
        except Exception as e:
            self.logger.error(f"Error wiping collection: {e}", exc_info=True)
            raise
