# project/semantic_search/router.py
"""
Mount this router inside your existing FastAPI app:

    from semantic_search.router import semantic_router
    app.include_router(semantic_router, prefix="/semantic")
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool
from .search_logic import perform_rag_search

semantic_router = APIRouter(tags=["semantic‑search"])

class QueryIn(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)

@semantic_router.post("/search")
async def semantic_search(body: QueryIn):
    result = await run_in_threadpool(perform_rag_search, body.query)

    if result["error"]:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=result["error"],
        )
    return result
