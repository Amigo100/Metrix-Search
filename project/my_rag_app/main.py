# file: my_rag_app/main.py
import logging
import os
import io
from typing import List, Dict, Optional

from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel

from my_rag_app.rag_config import Config
from my_rag_app.medical_rag import MedicalRAG
from my_rag_app.openai_client import client      # <-- NEW import

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RAG Chatbot Service",
    description="Sub‑application for RAG‑based Clinical Chatbot",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

config = Config()
rag_system = MedicalRAG(config)


class UserMessage(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None
    mode: Optional[str] = "chat"
    template_name: Optional[str] = None


@app.post("/ask_rag")
def ask_rag(payload: UserMessage):
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
            template_name=template_name,
        )
        logger.info("[/ask_rag] response => %s", response)
        return response
    except Exception as e:
        logger.error("Unhandled error in /ask_rag endpoint:", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe_audio")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Receives an audio blob and transcribes it with Whisper‑1.
    """
    try:
        logger.info("[/transcribe_audio] Received file: %s", file.filename)

        # Make sure KEY is present (OpenAI() already looked at env, but we check for good DX)
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("No OPENAI_API_KEY found on the server.")

        audio_bytes = await file.read()
        logger.info("[/transcribe_audio] Read %d bytes", len(audio_bytes))

        file_obj = io.BytesIO(audio_bytes)
        file_obj.name = file.filename or "audio.webm"

        logger.info("[/transcribe_audio] Calling client.audio.transcriptions.create()")
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=file_obj,
        )

        text = transcription.text
        logger.info("[/transcribe_audio] Transcription succeeded: %s", text[:50])
        return {"text": text}

    except Exception as e:
        logger.error("[/transcribe_audio] Error:", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
