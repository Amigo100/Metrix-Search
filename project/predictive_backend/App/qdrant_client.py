# app/qdrant_client.py
import os
from qdrant_client import QdrantClient, models
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variable names
QDRANT_URL_ENV = "QDRANT_URL"
QDRANT_API_KEY_ENV = "QDRANT_API_KEY" # Define variable name for the API Key

# --- Qdrant Client Management ---
_qdrant_client_instance = None

def get_qdrant_client() -> QdrantClient:
    """
    Retrieves a Qdrant client instance.

    Reads connection details (URL and API Key) from environment variables.
    Tries to reuse a single client instance for efficiency.

    Returns:
        QdrantClient: An initialized Qdrant client.

    Raises:
        ValueError: If required environment variables are not set.
        ConnectionError: If connection to Qdrant fails.
    """
    global _qdrant_client_instance

    if _qdrant_client_instance:
        try:
             _qdrant_client_instance.get_collections()
             return _qdrant_client_instance
        except Exception as e:
            logger.warning(f"Re-establishing Qdrant connection due to error: {e}")
            _qdrant_client_instance = None

    qdrant_url = os.getenv(QDRANT_URL_ENV)
    qdrant_api_key = os.getenv(QDRANT_API_KEY_ENV) # Read the API Key

    if not qdrant_url:
        logger.error(f"{QDRANT_URL_ENV} environment variable not set.")
        raise ValueError(f"{QDRANT_URL_ENV} environment variable not set.")

    # API Key is usually required for Cloud instances
    if not qdrant_api_key:
        logger.warning(f"{QDRANT_API_KEY_ENV} environment variable not set. Required for Qdrant Cloud.")
        # Depending on your setup, you might raise ValueError here too if key is mandatory
        # raise ValueError(f"{QDRANT_API_KEY_ENV} environment variable not set.")

    logger.info(f"Initializing Qdrant client for URL: {qdrant_url}")
    try:
        # *** Pass the api_key to the QdrantClient constructor ***
        client = QdrantClient(
            url=qdrant_url,
            api_key=qdrant_api_key # Pass the key here
        )
        # Perform a quick check to ensure connection is valid
        client.get_collections() # This will now use the API key
        _qdrant_client_instance = client
        logger.info("Qdrant client initialized successfully.")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Qdrant client: {e}", exc_info=True)
        # The original error (like 403) will be part of 'e'
        raise ConnectionError(f"Failed to connect to Qdrant at {qdrant_url}: {e}")


def ensure_collection_exists(client: QdrantClient, collection_name: str, vector_size: int, distance: models.Distance = models.Distance.COSINE):
    """
    Checks if a collection exists and creates it if it doesn't.
    (Code remains the same, but connection now uses API key)
    """
    try:
        try:
            client.get_collection(collection_name=collection_name)
            logger.info(f"Collection '{collection_name}' already exists.")
            return True
        except Exception as e:
            logger.info(f"Collection '{collection_name}' not found or error checking: {e}. Attempting to create.")
            # Note: create_collection also needs the API key implicitly via the client
            client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(size=vector_size, distance=distance)
            )
            logger.info(f"Collection '{collection_name}' created successfully.")
            return True
    except Exception as e:
        logger.error(f"Failed to ensure collection '{collection_name}' exists: {e}", exc_info=True)
        return False
