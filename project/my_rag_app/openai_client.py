# my_rag_app/openai_client.py
"""
Shared OpenAI client (>=1.0) for the whole RAG service.
Reads OPENAI_API_KEY, OPENAI_ORG_ID, etc. from env automatically.
"""
from openai import OpenAI

client = OpenAI()  # <-- singleton
