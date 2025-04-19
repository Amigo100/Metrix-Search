# ───────────────────── project/combined_main.py ─────────────────────
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# NOTE: all imports are now *package‑relative* so Python can find them
from .my_rag_app.main import app as rag_app
from .predictive_backend.app.main import app as predictive_app
from .semantic_search.router import semantic_router

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

# explicit origins + any *.vercel.app preview URL
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

# mount / include sub‑apps
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
# ────────────────────────────────────────────────────────────────────
