# app/search_logic.py
import os
import logging
import urllib.parse # Added for URL encoding filenames
from openai import OpenAI, APIError, RateLimitError
from typing import List, Dict, Any, Optional

# Import the function to get the Qdrant client from our other module
from .qdrant_client import get_qdrant_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration Constants ---
OPENAI_API_KEY_ENV = "OPENAI_API_KEY"
EMBEDDING_MODEL = "text-embedding-ada-002" # From your search script
CHAT_MODEL = "gpt-4" # From your search script
QDRANT_COLLECTION_NAME = "policy_chunks" # From your scripts
DEFAULT_SEARCH_LIMIT = 5

# --- Initialize OpenAI Client ---
openai_api_key = os.getenv(OPENAI_API_KEY_ENV)
if not openai_api_key:
    logger.error(f"{OPENAI_API_KEY_ENV} not found in environment variables.")
    raise ValueError(f"{OPENAI_API_KEY_ENV} environment variable is essential and not set.")

try:
    openai_client = OpenAI(api_key=openai_api_key)
    logger.info("OpenAI client initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {e}", exc_info=True)
    raise ConnectionError(f"Failed to initialize OpenAI client: {e}")


# --- Core RAG Function ---

def perform_rag_search(query: str, collection: str = QDRANT_COLLECTION_NAME, limit: int = DEFAULT_SEARCH_LIMIT) -> Dict[str, Any]:
    """
    Performs Retrieval-Augmented Generation (RAG) search.

    1. Embeds the query using OpenAI.
    2. Searches Qdrant for relevant document chunks.
    3. Aggregates context from results.
    4. Calls OpenAI Chat Completion (GPT-4) with context and query.
    5. Returns the generated answer and structured citation data including document URLs.

    Args:
        query: The user's search query string.
        collection: The Qdrant collection name to search.
        limit: The maximum number of results to retrieve from Qdrant.

    Returns:
        A dictionary containing:
        {
            "answer": str,
            "citations": List[Dict[str, Any]] # Includes 'url' key now
            "error": Optional[str]
        }
    """
    try:
        qdrant_client = get_qdrant_client() # Get initialized client

        # 1. Embed query
        logger.info(f"Embedding query: '{query[:50]}...'")
        try:
            response = openai_client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=query
            )
            query_vector = response.data[0].embedding
            logger.info("Query embedded successfully.")
        except (APIError, RateLimitError) as e:
            logger.error(f"OpenAI Embedding API error: {e}", exc_info=True)
            return {"answer": "", "citations": [], "error": f"Failed to embed query: {e}"}
        except Exception as e:
            logger.error(f"Unexpected error during query embedding: {e}", exc_info=True)
            return {"answer": "", "citations": [], "error": f"An unexpected error occurred: {e}"}

        # 2. Query Qdrant
        logger.info(f"Searching Qdrant collection '{collection}'...")
        try:
            results = qdrant_client.search(
                collection_name=collection,
                query_vector=query_vector,
                limit=limit,
                with_payload=True
            )
            logger.info(f"Qdrant search returned {len(results)} results.")
        except Exception as e:
            logger.error(f"Qdrant search error: {e}", exc_info=True)
            return {"answer": "", "citations": [], "error": f"Failed to search Qdrant: {e}"}

        if not results:
            logger.warning("No relevant results found in Qdrant.")
            return {"answer": "No relevant information found in the policy documents.", "citations": [], "error": None}

        # 3. Aggregate Context and Prepare Citations with URLs
        context_chunks = []
        citations = []
        for i, hit in enumerate(results, 1):
            payload = hit.payload or {}
            text = payload.get("text", "[No content found in payload]")
            doc_title = payload.get("document_title", "Unknown Document")
            page = payload.get("page_number", None)
            heading = payload.get("heading", "N/A")

            context_chunks.append(f"[{i}] {text}")

            # --- Generate Document URL (Workaround) ---
            # **WARNING:** This assumes filename can be derived from title.
            # This is FRAGILE. Best practice is to store the actual filename
            # in the Qdrant payload during indexing.
            document_url = None
            if doc_title != "Unknown Document":
                try:
                    # Basic transformation: replace spaces with underscores, ensure .pdf extension
                    # This might need more robust logic depending on your actual filenames
                    base_filename = doc_title.replace(" ", "_")
                    if not base_filename.lower().endswith(".pdf"):
                        base_filename += ".pdf"

                    # URL encode the filename to handle special characters safely in URL path
                    encoded_filename = urllib.parse.quote(base_filename)
                    document_url = f"/api/documents/view/{encoded_filename}" # Relative URL for the front-end
                    logger.debug(f"Generated URL for title '{doc_title}': {document_url}")
                except Exception as url_e:
                    logger.warning(f"Could not generate document URL for title '{doc_title}': {url_e}")
            # --- End URL Generation ---

            citation_info = {
                "source_id": i,
                "document_title": doc_title,
                "page_number": page,
                "heading": heading,
                "qdrant_id": hit.id,
                "score": hit.score,
                "url": document_url # Add the generated URL (can be None if generation failed)
            }
            citations.append(citation_info)

        combined_context = "\n\n".join(context_chunks)
        logger.info(f"Aggregated context from {len(context_chunks)} chunks.")

        # 4. Generate LLM Response
        system_prompt = """
You are a helpful assistant who answers questions based ONLY on the provided context from internal hospital policy documents.
Always write clearly and concisely.
Reference the source numbers (e.g. [1], [2]) provided in the context when using information from specific chunks.
Do not add any information not present in the provided context.
If the context does not contain the answer, state that clearly. If there are no documents linked to the general topic in question, inform the user that hospital repository does not contain a policy on the topic in question.
After answering a users query, pose one to three follow-up questions on the same topic, based solely on information within internal hospital policy documents. Phrase these questions as queries from the users perspective. Start a new line for each query.
        """
        user_message = f"Context:\n{combined_context}\n\nQuestion: {query}"

        logger.info(f"Calling OpenAI Chat Completion ({CHAT_MODEL})...")
        try:
            chat_response = openai_client.chat.completions.create(
                model=CHAT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            )
            llm_answer = chat_response.choices[0].message.content.strip()
            logger.info("Received response from OpenAI Chat Completion.")
        except (APIError, RateLimitError) as e:
            logger.error(f"OpenAI Chat Completion API error: {e}", exc_info=True)
            # Return citations found so far even if LLM fails
            return {"answer": "[Error generating summary response]", "citations": citations, "error": f"Failed to generate answer: {e}"}
        except Exception as e:
            logger.error(f"Unexpected error during chat completion: {e}", exc_info=True)
            return {"answer": "[Error generating summary response]", "citations": citations, "error": f"An unexpected error occurred: {e}"}

        # 5. Return structured result
        return {
            "answer": llm_answer,
            "citations": citations, # Citations now include the 'url' field
            "error": None
        }

    except Exception as e:
        logger.error(f"Unexpected error in perform_rag_search: {e}", exc_info=True)
        return {"answer": "", "citations": [], "error": f"An unexpected server error occurred: {e}"}

