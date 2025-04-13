# combined_main.py
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from my_rag_app.main import app as rag_app
from predictive_backend.app.main import app as predictive_app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base FastAPI application
combined_app = FastAPI(
    title="Unified Clinical Platform",
    description="Single service hosting the RAG chatbot + Predictive Analytics",
    version="1.0.0",
)

##############################################################################
# 1. Use a regex to match ephemeral Vercel subdomains (e.g. myapp-xxxxx.vercel.app)
#    plus localhost for dev. The pattern below matches:
#     - http://localhost:3000
#     - https://localhost:3000
#     - https://<anything>.vercel.app
#
#    If you also need to allow ephemeral Render URLs, adjust the regex
#    or add them separately.
##############################################################################
allow_origin_pattern = r"https?://(localhost:3000|.*\.vercel\.app)"
logger.info(f"Using allow_origin_regex = {allow_origin_pattern}")

# 2. Configure CORS with the regex
combined_app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=allow_origin_pattern,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount the sub-apps
combined_app.mount("/rag", rag_app)
combined_app.mount("/predictive", predictive_app)

@combined_app.get("/")
def root_check():
    logger.info("[/] Root check endpoint called.")
    return {
        "message": "Unified service for RAG + Predictive Analytics",
        "cors_regex": allow_origin_pattern,
    }
