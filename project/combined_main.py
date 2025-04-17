# file: project/combined_main.py

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

# List explicit origins + a regex for any .vercel.app subdomain
allowed_origins = [
    "http://localhost:3000",
    "https://fast-api-platform-clean-ozlq.vercel.app",
    # add any other known Vercel preview URLs here if needed
]

combined_app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://.*\.vercel\.app$",  # any vercel.app subdomain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the sub-apps
combined_app.mount("/rag", rag_app)
combined_app.mount("/predictive", predictive_app)

@combined_app.get("/")
def root_check():
    logger.info("[/] Root check endpoint called.")
    return {
        "message": "Unified service for RAG + Predictive Analytics",
        "allowed_origins": allowed_origins,
    }
