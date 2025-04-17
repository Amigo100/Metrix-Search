# file: my_rag_app/query_processor.py
import logging
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any, Tuple

from my_rag_app.openai_client import client  # ← singleton OpenAI(>=1.0)

class QueryProcessor:
    """
    Expands user text, extracts entities, and gets an embedding via OpenAI 1.x.
    Returns (embedding_vector, filters_dict).
    """

    def __init__(self, config, embed_model_name: str):
        self.logger = logging.getLogger(__name__)
        self.config = config
        self.embed_model = embed_model_name   # e.g. "text-embedding-ada-002"

        # Entity regexes
        self.medical_entity_categories: Dict[str, str] = {
            "diseases": r"(diabetes|hypertension|cancer|asthma|covid-19|stroke|tuberculosis|copd|heart disease)",
            "medications": r"(aspirin|ibuprofen|acetaminophen|lisinopril|metformin|prednisone|insulin)",
        }
        self.medical_entity_pattern = re.compile(
            "|".join(f"(?P<{k}>{v})" for k, v in self.medical_entity_categories.items()),
            re.IGNORECASE,
        )

        # Simple synonym expansions
        self.expansions = {
            "heart attack": "myocardial infarction cardiac arrest coronary thrombosis acute coronary syndrome",
            "high blood pressure": "hypertension elevated blood pressure",
            "diabetes": "diabetes mellitus hyperglycemia",
            "stroke": "cerebrovascular accident",
        }

    # ────────────────────────────────────────────────
    # Public API
    # ────────────────────────────────────────────────
    def process_query(self, query: str) -> Tuple[List[float], Dict[str, Any]]:
        try:
            expanded_query = self._expand_query(query)
            entities_dict = self._extract_medical_entities(expanded_query)
            all_entities = sorted({e for lst in entities_dict.values() for e in lst})

            # ---- EMBEDDING (OpenAI 1.x) ----
            emb_resp = client.embeddings.create(
                model=self.embed_model,
                input=expanded_query,
            )
            embedding = emb_resp.data[0].embedding

            filters: Dict[str, Any] = {
                "query_id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat(),
            }
            if all_entities:
                filters["medical_entities"] = all_entities

            self.logger.info(f"Processed query; filters={filters}")
            return embedding, filters

        except Exception as e:
            self.logger.error("Error processing query", exc_info=True)
            # Fallback: zero vector
            return [0.0] * getattr(self.config.rag, "embedding_dim", 1536), {
                "is_fallback": True
            }

    # ────────────────────────────────────────────────
    # Helpers
    # ────────────────────────────────────────────────
    def _expand_query(self, text: str) -> str:
        expanded = text
        lower = text.lower()
        for phrase, ext in self.expansions.items():
            if phrase in lower:
                expanded += " " + ext
        return expanded

    def _extract_medical_entities(self, text: str) -> Dict[str, List[str]]:
        entities: Dict[str, List[str]] = {k: [] for k in self.medical_entity_categories}
        for m in self.medical_entity_pattern.finditer(text):
            if m.lastgroup:
                entities[m.lastgroup].append(m.group(0).lower())
        for k in entities:
            entities[k] = sorted(set(entities[k]))
        return entities
