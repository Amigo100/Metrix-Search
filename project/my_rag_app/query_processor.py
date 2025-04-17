# file: my_rag_app/query_processor.py
import logging, re, uuid
from datetime import datetime
from typing import List, Dict, Any, Tuple

from my_rag_app.openai_client import client  # singleton OpenAI

class QueryProcessor:
    """
    Expands synonyms, extracts entities, gets an OpenAI embedding, returns
    (embedding_vector, filters_dict).
    """

    def __init__(self, config, embed_model_name: str):
        self.logger = logging.getLogger(__name__)
        self.cfg = config
        self.model = embed_model_name  # e.g. "text-embedding-ada-002"

        self.entity_patterns: Dict[str, str] = {
            "diseases": r"(diabetes|hypertension|cancer|asthma|covid-19|stroke|tuberculosis|copd|heart disease)",
            "medications": r"(aspirin|ibuprofen|acetaminophen|lisinopril|metformin|prednisone|insulin)",
        }
        self.entity_regex = re.compile(
            "|".join(f"(?P<{k}>{v})" for k, v in self.entity_patterns.items()),
            re.IGNORECASE,
        )
        self.expansions = {
            "heart attack": "myocardial infarction cardiac arrest coronary thrombosis acute coronary syndrome",
            "high blood pressure": "hypertension elevated blood pressure",
            "diabetes": "diabetes mellitus hyperglycemia",
            "stroke": "cerebrovascular accident",
        }

    # ───────────────────────── Public API ──────────────────────────
    def process_query(self, query: str) -> Tuple[List[float], Dict[str, Any]]:
        expanded = self._expand(query)
        entities = self._entities(expanded)

        try:
            emb = client.embeddings.create(model=self.model, input=expanded).data[0].embedding
        except Exception as e:
            self.logger.error("Embedding failed, returning zeros", exc_info=True)
            emb_dim = getattr(self.cfg.rag, "embedding_dim", 1536)
            emb = [0.0] * emb_dim

        filters: Dict[str, Any] = {
            "query_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
        }
        if entities:
            filters["medical_entities"] = entities

        return emb, filters

    # ───────────────────────── Helpers ────────────────────────────
    def _expand(self, text: str) -> str:
        out, lower = text, text.lower()
        for phrase, extra in self.expansions.items():
            if phrase in lower:
                out += " " + extra
        return out

    def _entities(self, text: str) -> List[str]:
        found = {m.group(0).lower() for m in self.entity_regex.finditer(text)}
        return sorted(found)
