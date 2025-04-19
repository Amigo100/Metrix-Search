"""
Shim module – lets the predictive backend keep importing

    from predictive_backend.app.search_logic import perform_rag_search

after we moved the real implementation to project/semantic_search/.

Because `project/` was added to sys.path in combined_main.py, all three
sub‑packages (`my_rag_app`, `predictive_backend`, `semantic_search`) are
now *top‑level* modules.  So we import `semantic_search` absolutely – no
relative dots needed.
"""

from semantic_search.search_logic import perform_rag_search  # noqa: F401

__all__ = ["perform_rag_search"]
