# app/main.py
import logging
import traceback
import os # Added for path operations
import pathlib # Added for safer path handling
from fastapi import FastAPI, HTTPException, Depends, Query, Path # Import Path
from fastapi.responses import FileResponse # Import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import xgboost as xgb
# Import specific types if known, otherwise use Any or check types at runtime
from xgboost import XGBClassifier, XGBRegressor
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from typing import Any, List, Dict

# Import schemas and utility functions
from .schemas import PredictionInput, PredictionOutput
from .model_loader import load_objects, get_model_objects
# Import preprocessing function
from .preprocessing import preprocess_input, FEATURE_ORDER

# --- Import Search Logic ---
from .search_logic import perform_rag_search
from starlette.concurrency import run_in_threadpool
from ..semantic_search.vector_client import (
    get_qdrant_client,
    ensure_collection_exists,
    COLLECTION,
)

# ==============================================================================
# Constants
# ==============================================================================
# Define the base directory for policy documents relative to this file's location
# Assumes main.py is in app/ and policy_documents/ is at the project root
POLICY_DOCS_DIR = pathlib.Path(__file__).parent.parent / "policy_documents"

# ==============================================================================
# Logging Configuration
# ==============================================================================
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==============================================================================
# FastAPI App Instance
# ==============================================================================
app = FastAPI(
    title="Clinical Assistant Prediction & Search API",
    description="API to predict ED wait times, admission likelihood, perform semantic search on policy documents, and retrieve documents.", # Updated description
    version="1.5.0", # Incremented version for document view endpoint
)

# ==============================================================================
# CORS Configuration
# ==============================================================================
origins = ["http://localhost:3000", "http://127.0.0.1:3000"] # Add other origins as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods including GET, POST
    allow_headers=["*"],
)

# ==============================================================================
# Startup Event
# ==============================================================================
@app.on_event("startup")
async def startup_event():
    logger.info("Application startup: Loading ML models and imputer...")
    try:
        load_objects()
        qc = get_qdrant_client()
        ensure_collection_exists(qc, COLLECTION)
        # Ensure the policy documents directory exists
        if not POLICY_DOCS_DIR.is_dir():
            logger.warning(f"Policy documents directory not found at: {POLICY_DOCS_DIR}")
            # Depending on requirements, you might raise an error here
        else:
            logger.info(f"Policy documents directory found at: {POLICY_DOCS_DIR}")
        logger.info("Startup loading process finished successfully.")
    except Exception as e:
        logger.critical(f"FATAL: Application startup failed during model loading: {e}", exc_info=True)
        raise RuntimeError(f"Startup failed: {e}") from e

# ==============================================================================
# Dependencies
# ==============================================================================
async def get_ml_dependencies() -> dict:
    """Retrieves all loaded ML models and the imputer."""
    breach_model, admission_model, waiting_model, imputer = get_model_objects()

    if breach_model is None: raise HTTPException(status_code=503, detail="Breach prediction model is not available.")
    if admission_model is None: raise HTTPException(status_code=503, detail="Admission prediction model is not available.")
    if waiting_model is None: raise HTTPException(status_code=503, detail="Waiting time prediction model is not available.")
    if imputer is None: logger.warning("Imputer object is not loaded (may be optional).")

    return {
        "breach_model": breach_model,
        "admission_model": admission_model,
        "waiting_model": waiting_model,
        "imputer": imputer
    }

# ==============================================================================
# API Endpoints
# ==============================================================================

# --- ML Prediction Endpoint ---
@app.post("/api/predict", response_model=PredictionOutput)
async def predict(inputs: PredictionInput, deps: dict = Depends(get_ml_dependencies)):
    """
    Receives patient data, preprocesses it, runs predictions, and returns results.
    (Code remains unchanged)
    """
    breach_model: Any = deps["breach_model"]
    admission_model: Any = deps["admission_model"]
    waiting_model: Any = deps["waiting_model"]
    imputer: SimpleImputer | None = deps["imputer"]
    logger.info(f"Received Models: Breach={type(breach_model)}, Admission={type(admission_model)}, Waiting={type(waiting_model)}")
    try:
        logger.info("Preprocessing input for prediction...")
        preprocessed_df = preprocess_input(inputs, imputer)
        logger.info(f"Preprocessing complete. Columns: {preprocessed_df.columns.tolist()}")
        if preprocessed_df.shape[1] != len(FEATURE_ORDER):
             logger.warning(f"Number of columns after preprocessing ({preprocessed_df.shape[1]}) does not match FEATURE_ORDER length ({len(FEATURE_ORDER)}).")

        # --- Breach/Length of Stay Prediction ---
        logger.info("Running breach prediction...")
        try:
            if hasattr(breach_model, 'predict_proba'):
                breach_probabilities = breach_model.predict_proba(preprocessed_df)
                logger.debug(f"Raw breach probabilities: {breach_probabilities}")
                if breach_probabilities.shape[1] < 2: raise ValueError("Breach model predict_proba shape error.")
                breach_probability_percent = breach_probabilities[0][1] * 100
            else:
                logger.warning("Breach model lacks 'predict_proba'. Returning 0.")
                breach_probability_percent = 0
        except Exception as e:
             logger.error(f"Error during Breach Model prediction: {e}", exc_info=True)
             raise ValueError(f"Error during Breach Model prediction: {e}") from e

        # --- Admission Likelihood Prediction ---
        logger.info("Running admission prediction...")
        try:
            if hasattr(admission_model, 'predict_proba'):
                logger.debug("Data check before admission prediction:")
                logger.debug(f"  DataFrame type: {type(preprocessed_df)}")
                logger.debug(f"  Shape: {preprocessed_df.shape}")
                logger.debug(f"  Data types:\n{preprocessed_df.dtypes}")
                logger.debug(f"  Contains NaNs: {preprocessed_df.isnull().sum().sum()}")
                admission_probabilities = admission_model.predict_proba(preprocessed_df)
                logger.debug(f"Raw admission probabilities: {admission_probabilities}")
                if admission_probabilities.shape[1] < 2: raise ValueError("Admission model predict_proba shape error.")
                admission_likelihood_percent = admission_probabilities[0][1] * 100
            else:
                logger.warning("Admission model lacks 'predict_proba'. Returning 0.")
                admission_likelihood_percent = 0
        except Exception as e:
             logger.error(f"Error during Admission Model prediction: {e}", exc_info=True)
             raise ValueError(f"Error during Admission Model prediction: {e}") from e

        # --- Waiting Time Prediction ---
        logger.info("Running waiting time prediction...")
        try:
            if hasattr(waiting_model, 'predict'):
                wait_time_predictions = waiting_model.predict(preprocessed_df)
                logger.debug(f"Raw wait time prediction: {wait_time_predictions}")
                if isinstance(wait_time_predictions, (np.ndarray, list)) and len(wait_time_predictions) > 0:
                    predicted_wait_minutes_raw = wait_time_predictions[0]
                else:
                     logger.warning(f"Unexpected output format from waiting model predict: {wait_time_predictions}")
                     predicted_wait_minutes_raw = 0
            else:
                logger.warning("Waiting model lacks 'predict'. Returning 0.")
                predicted_wait_minutes_raw = 0
            predicted_wait_minutes_final = max(5, round(predicted_wait_minutes_raw))
        except Exception as e:
             logger.error(f"Error during Waiting Model prediction: {e}", exc_info=True)
             raise ValueError(f"Error during Waiting Model prediction: {e}") from e

        # --- Format Output ---
        clamp = lambda num, min_val, max_val: min(max(num, min_val), max_val)
        results = PredictionOutput(
            wait3h = clamp(breach_probability_percent * 0.8, 0, 100),
            wait4h = clamp(breach_probability_percent * 0.9, 0, 100),
            wait5h = clamp(breach_probability_percent * 1.0, 0, 100),
            wait6h = clamp(breach_probability_percent * 1.1, 0, 100),
            admissionLikelihood = clamp(admission_likelihood_percent, 0, 100),
            predictedWaitMinutes = predicted_wait_minutes_final,
        )
        logger.info(f"Formatted prediction results: {results}")
        return results

    except ValueError as ve:
        logger.warning(f"Prediction failed due to processing error: {ve}")
        raise HTTPException(status_code=422, detail=f"Prediction failed: {ve}")
    except Exception as e:
        logger.error(f"Unexpected error during prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Prediction failed due to an internal server error.")

# --- Semantic Search Endpoint ---
@app.get("/api/search/policy", response_model=Dict[str, Any])
async def search_policy(query: str = Query(..., min_length=3, description="The search query for policy documents.")):
    """
    Receives a text query, performs RAG search, returns answer and citations.
    (Code remains unchanged)
    """
    logger.info(f"Received policy search request for query: '{query[:100]}...'")
    if not query:
         raise HTTPException(status_code=400, detail="Query parameter cannot be empty.")
    try:
        search_result = await run_in_threadpool(perform_rag_search, query)
        internal_error = search_result.get("error")
        if internal_error:
            logger.error(f"Search logic failed for query '{query[:100]}...': {internal_error}")
            raise HTTPException(status_code=500, detail="Search failed due to an internal error. Please try again later.")
        logger.info(f"Successfully completed search for query: '{query[:100]}...'")
        return search_result
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected error during policy search for query '{query[:100]}...': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Search failed due to an unexpected internal server error.")


# --- NEW: Document Access Endpoint ---
@app.get("/api/documents/view/{document_filename}", response_class=FileResponse)
async def get_document(document_filename: str = Path(..., description="The filename of the policy PDF to retrieve.")):
    """
    Retrieves and returns a specific policy document PDF file.
    Performs security checks to prevent accessing files outside the designated directory.
    """
    logger.info(f"Received request for document: {document_filename}")

    try:
        # **Security Check 1: Basic sanitization**
        # Ensure filename doesn't contain path traversal characters
        if ".." in document_filename or "/" in document_filename or "\\" in document_filename:
            logger.warning(f"Attempted path traversal: {document_filename}")
            raise HTTPException(status_code=400, detail="Invalid filename format.")

        # Construct the full path safely
        # Use POLICY_DOCS_DIR defined at the top
        file_path = POLICY_DOCS_DIR / document_filename

        # **Security Check 2: Ensure the resolved path is still within the intended directory**
        # This prevents issues even if the filename itself looks okay but resolves outside
        if not file_path.resolve().is_relative_to(POLICY_DOCS_DIR.resolve()):
             logger.warning(f"Attempt to access file outside designated directory: {document_filename} resolved to {file_path.resolve()}")
             raise HTTPException(status_code=404, detail="Document not found.") # Treat as not found

        # Check if the file exists and is a file
        if file_path.is_file():
            logger.info(f"Serving document: {file_path}")
            # Return the file using FileResponse
            # Set media_type for PDF files
            # Provide a downloadable filename (optional, browser might use path component)
            return FileResponse(
                path=file_path,
                media_type='application/pdf',
                filename=document_filename # Suggests filename for download dialog
            )
        else:
            logger.warning(f"Document not found at path: {file_path}")
            raise HTTPException(status_code=404, detail="Document not found.")

    except HTTPException as http_exc:
        # Re-raise HTTPExceptions (like 404, 400)
        raise http_exc
    except Exception as e:
        # Catch any other unexpected errors
        logger.error(f"Error retrieving document '{document_filename}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not retrieve document due to an internal server error.")


# --- Root Endpoint (Health Check) ---
@app.get("/")
async def read_root():
    """Basic health check endpoint."""
    ml_deps_available = True
    imputer_loaded = False
    try:
        ml_deps = await get_ml_dependencies()
        imputer_loaded = ml_deps.get("imputer") is not None
    except HTTPException:
        ml_deps_available = False

    status = {
        "status": "Clinical Assistant Prediction & Search API is running",
        "ml_models_loaded": ml_deps_available,
        "imputer_loaded": imputer_loaded,
    }
    return status


