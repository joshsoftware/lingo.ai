"""
Utility module for logging API errors to the database
"""
import os
import uuid
from banking.database import SessionLocal
from banking.error_logs import APIErrorLog
from logger import logger
import traceback
from typing import Optional, Dict, Any

from config import error_audio_dir as ERROR_AUDIO_DIR

def _ensure_error_audio_dir():
    os.makedirs(ERROR_AUDIO_DIR, exist_ok=True)

def _save_audio_for_error(audio_bytes: bytes, original_filename: Optional[str] = None) -> Optional[str]:
    """Save audio bytes to disk; return storage filename (e.g. uuid.wav) or None on failure."""
    if not audio_bytes:
        return None
    try:
        _ensure_error_audio_dir()
        ext = ".wav"
        if original_filename and "." in original_filename:
            ext = "." + original_filename.rsplit(".", 1)[-1].lower()
        if ext not in (".wav", ".mp3", ".m4a", ".ogg", ".webm", ".flac"):
            ext = ".wav"
        filename = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(ERROR_AUDIO_DIR, filename)
        with open(path, "wb") as f:
            f.write(audio_bytes)
        return filename
    except Exception as e:
        logger.warning(f"Could not save error audio: {e}")
        return None

def log_api_error(
    endpoint: str,
    error: Exception,
    failure_stage: Optional[str] = None,
    # Audio-related data (TTS/STT)
    audio_file_name: Optional[str] = None,
    audio_bytes: Optional[bytes] = None,
    translated_text: Optional[str] = None,
    detected_language: Optional[str] = None,
    # Logging and preprocessing
    preprocessing_logs_text: Optional[str] = None,
    # Intent data (if available before error)
    intent_data: Optional[Dict[str, Any]] = None,
):
    """
    Log an API error to the database for banking voice API.
    Focuses on audio-related data (TTS/STT) and error traceback.
    Only stores failure-related data, not user/session context.
    
    Args:
        endpoint: The API endpoint that failed (e.g., "/voice/transcribe-intent")
        error: The exception that occurred
        failure_stage: Stage where failure occurred (e.g., "transcription", "intent_detection", "session_processing")
        audio_file_name: Name of the audio file uploaded
        translated_text: Transcribed/translated text from audio (if available)
        detected_language: Language detected from audio (if available)
        preprocessing_logs_text: Logs from preprocessing steps (TTS/STT functions)
        intent_data: Intent data if available before error
    """
    try:
        audio_storage_path = _save_audio_for_error(audio_bytes, audio_file_name) if audio_bytes else None

        db = SessionLocal()
        try:
            error_log = APIErrorLog(
                endpoint=endpoint,
                audio_file_name=audio_file_name,
                audio_storage_path=audio_storage_path,
                translated_text=translated_text,
                detected_language=detected_language,
                error_type=type(error).__name__,
                error_message=str(error),
                error_traceback=traceback.format_exc(),
                failure_stage=failure_stage,
                preprocessing_logs_text=preprocessing_logs_text,
                intent_data=intent_data if intent_data else None,
            )
            db.add(error_log)
            db.commit()
            logger.info(f"Error logged to database: {error_log.id}")
        except Exception as db_error:
            logger.error(f"Failed to log error to database: {db_error}")
            logger.error(traceback.format_exc())
            db.rollback()
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Critical error in error logging system: {e}")
        logger.error(traceback.format_exc())
