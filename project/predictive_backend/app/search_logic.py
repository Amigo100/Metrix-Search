"""
Shim module ‑‑ keeps the predictive backend working after we relocated
the semantic‑search code to project/semantic_search/.

If any part of predictive_backend imports:

    from predictive_backend.app.search_logic import perform_rag_search

…this file re‑exports the real implementation so no other code needs to
change.
"""

from __future__ import annotations

# go three levels up (project → semantic_search)
from ...semantic_search.search_logic import perform_rag_search  # noqa: F401

__all__ = ["perform_rag_search"]
