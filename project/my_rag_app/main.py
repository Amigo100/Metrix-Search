# file: my_rag_app/main.py

import logging
import os
import io

from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import List, Dict, Optional
import openai

from my_rag_app.rag_config import Config
from my_rag_app.medical_rag import MedicalRAG

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create the FastAPI sub-application for the RAG service
app = FastAPI(
    title="RAG Chatbot Service",
    description="Sub-application for RAG-based Clinical Chatbot",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# Instantiate configuration and RAG system
config = Config()
rag_system = MedicalRAG(config)


class UserMessage(BaseModel):
    """
    Model for user chat messages, including multi-turn history 
    and optional 'mode' (e.g. 'chat', 'scribe') / 'template_name'.
    """
    message: str
    history: Optional[List[Dict[str, str]]] = None
    mode: Optional[str] = "chat"
    template_name: Optional[str] = None


@app.post("/ask_rag")
def ask_rag(payload: UserMessage):
    """
    Single endpoint for both general chat and scribe tasks, 
    reusing the same RAG pipeline but optionally varying 
    the prompt style based on 'mode' and 'template_name'.
    """
    user_input = payload.message
    chat_history = payload.history or []
    mode = payload.mode or "chat"
    template_name = payload.template_name

    logger.info(
        "[/ask_rag] user_input=%r, mode=%s, template=%s, history_len=%d",
        user_input, mode, template_name, len(chat_history)
    )

    try:
        response = rag_system.process_query(
            user_input=user_input,
            chat_history=chat_history,
            mode=mode,
            template_name=template_name
        )
        logger.info("[/ask_rag] response => %s", response)
        return response

    except Exception as e:
        logger.error("Unhandled error in /ask_rag endpoint:", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe_audio")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Receives a webm (or similar) audio blob, wraps it in an in-memory BytesIO, 
    and calls OpenAI Whisper for transcription. Returns transcribed text.
    """
    try:
        # Log file name (if any)
        logger.info("[/transcribe_audio] Received file: %s", file.filename)

        # Load OpenAI API key from environment
        openai.api_key = os.environ.get("OPENAI_API_KEY", "")
        if not openai.api_key:
            raise ValueError("No OPENAI_API_KEY found on the server.")

        # Read raw bytes from the uploaded file
        audio_bytes = await file.read()
        logger.info("[/transcribe_audio] Read %d bytes from uploaded file", len(audio_bytes))

        # Wrap bytes in an in-memory file-like object
        # We give it a .name attribute so the OpenAI library 
        # recognizes it like a normal file
        file_obj = io.BytesIO(audio_bytes)
        file_obj.name = "temp.webm"  # or .wav, .mp3, etc.

        # Call Whisper via the OpenAI API
        logger.info("[/transcribe_audio] Calling openai.Audio.transcribe()...")
        transcription = openai.Audio.transcribe("whisper-1", file=file_obj)

        logger.info("[/transcribe_audio] Transcription succeeded: %s", transcription["text"][:50])
        return {"text": transcription["text"]}

    except Exception as e:
        logger.error("[/transcribe_audio] Error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
