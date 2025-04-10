import logging
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

class QueryProcessor:
    """
    Processes a user query by expanding synonyms, extracting medical entities,
    embedding the query, and producing a filters dictionary for retrieval.
    Medical entities are flattened into a single list for filtering.
    """

    def __init__(self, config, embedding_model):
        self.logger = logging.getLogger(__name__)
        self.config = config
        self.embedding_model = embedding_model

        # Define regex patterns for entities (adjust as needed)
        self.medical_entity_categories = {
            "diseases": r"(diabetes|hypertension|cancer|asthma|covid-19|stroke|tuberculosis|copd|heart disease)",
            "medications": r"(aspirin|ibuprofen|acetaminophen|lisinopril|metformin|prednisone|insulin)"
        }
        # Build a combined regex pattern
        all_patterns = []
        for category, pattern in self.medical_entity_categories.items():
            all_patterns.append(f"(?P<{category}>{pattern})")
        self.medical_entity_pattern = re.compile("|".join(all_patterns), re.IGNORECASE)

        # Define expansion phrases
        self.expansions = {
            "heart attack": "myocardial infarction cardiac arrest coronary thrombosis acute coronary syndrome",
            "high blood pressure": "hypertension elevated blood pressure",
            "diabetes": "diabetes mellitus hyperglycemia",
            "stroke": "cerebrovascular accident"
        }

    def process_query(self, query: str) -> Tuple[List[float], Dict[str, Any]]:
        try:
            query_id = str(uuid.uuid4())
            expanded_query = self._expand_query(query)
            
            # Extract entities as a dict, then flatten them
            raw_entities = self._extract_medical_entities(expanded_query)
            all_entities = []
            for cat, items in raw_entities.items():
                all_entities.extend(items)
            all_entities = list(set(all_entities))
            self.logger.debug(f"Flattened entities: {all_entities}")

            # Get the embedding
            query_embedding = self.embedding_model.embed_query(expanded_query)
            if hasattr(query_embedding, "tolist"):
                query_embedding = query_embedding.tolist()

            filters = {
                "query_id": query_id,
                "timestamp": datetime.now().isoformat(),
            }
            if all_entities:
                filters["medical_entities"] = all_entities

            self.logger.info(f"Processed query with filters: {filters}")
            return query_embedding, filters

        except Exception as e:
            self.logger.error(f"Error processing query: {e}", exc_info=True)
            fallback_embedding = self.embedding_model.embed_query(query) or []
            if hasattr(fallback_embedding, "tolist"):
                fallback_embedding = fallback_embedding.tolist()
            return fallback_embedding, {"is_fallback": True}

    def _expand_query(self, query: str) -> str:
        expanded = query
        text_lower = query.lower()
        for phrase, expansion in self.expansions.items():
            if phrase in text_lower:
                expanded += " " + expansion
        return expanded

    def _extract_medical_entities(self, text: str) -> Dict[str, List[str]]:
        entities = {"diseases": [], "medications": []}
        for match in self.medical_entity_pattern.finditer(text):
            if match.lastgroup in entities:
                entities[match.lastgroup].append(match.group(0).lower())
        for cat in entities:
            entities[cat] = list(set(entities[cat]))
        return entities
