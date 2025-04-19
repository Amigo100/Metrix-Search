# ───────────────── project/combined_main.py ─────────────────
import logging
import sys
from pathlib import Path

# ── Make sub‑packages importable at top‑level ───────────────
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))   # now "import my_rag_app" works

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# original sub‑apps (keep absolute imports inside them happy)
from my_rag_app.main import app as rag_app
from predictive_backend.app.main import app as predictive_app
from semantic_search.router import semantic_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

combined_app = FastAPI(
    title="Unified Clinical Platform",
    description=(
        "Single service hosting the RAG chatbot, Predictive Analytics, "
        "and Policy Semantic Search."
    ),
    version="1.1.0",
)

allowed_origins = [
    "http://localhost:3000",
    "https://fast-api-platform-clean-ozlq.vercel.app",
]

combined_app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

combined_app.mount("/rag", rag_app)
combined_app.mount("/predictive", predictive_app)
combined_app.include_router(semantic_router, prefix="/semantic")

@combined_app.get("/")
def root_check():
    logger.info("[/] Root check endpoint called.")
    return {
        "message": "Unified service for RAG + Predictive + Semantic Search",
        "allowed_origins": allowed_origins,
    }
# ────────────────────────────────────────────────────────────
