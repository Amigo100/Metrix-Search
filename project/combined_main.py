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

# 1. Start with a list of known valid origins
allowed_origins = [
    "http://localhost:3000",
    # Potential stable domain(s) can go here, for example:
    # "https://my-stable-production-domain.vercel.app",
    # "https://my-custom-domain.com",
]

# 2. Dynamically detect ephemeral Vercel URL if environment variable is present
#    Vercel often provides 'VERCEL_URL' or 'VERCEL_BRANCH_URL' at runtime
#    Example: fast-api-platform-clean-ozlq-nt55riy3q-amigo100s-projects.vercel.app
vercel_url = os.getenv("VERCEL_URL")  # e.g. "fast-api-platform-clean-ozlq-nt55riy3q-amigo100s-projects.vercel.app"
if vercel_url:
    ephemeral_origin = f"https://{vercel_url}"
    allowed_origins.append(ephemeral_origin)
    logger.info(f"Detected ephemeral Vercel URL: {ephemeral_origin}")

# 3. (Optional) You can also allow an entire wildcard for quick dev/staging
# allowed_origins.append("https://*.vercel.app")

# 4. Log environment variables if needed (cautious about secrets!)
logger.info(f"OPENAI_API_KEY present? {'OPENAI_API_KEY' in os.environ}")
logger.info(f"NEXT_PUBLIC_API_BASE_URL = {os.getenv('NEXT_PUBLIC_API_BASE_URL')}")
logger.info(f"Allowed origins so far: {allowed_origins}")

# 5. Configure CORS
combined_app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # or ["*"] for completely open
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 6. Mount sub-apps
combined_app.mount("/rag", rag_app)
combined_app.mount("/predictive", predictive_app)

@combined_app.get("/")
def root_check():
    logger.info("[/] Root check endpoint called.")
    return {
        "message": "Unified service for RAG + Predictive Analytics",
        "rag_docs": "/rag/docs",
        "predictive_docs": "/predictive/docs",
        "allowed_origins": allowed_origins,
    }

