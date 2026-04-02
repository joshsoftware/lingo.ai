from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from banking.database import Base
import datetime

class APIErrorLog(Base):
    __tablename__ = "api_error_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # API Endpoint Information
    endpoint = Column(String(255), nullable=False, index=True)  # e.g., "/voice/transcribe-intent"
    
    # Audio-related data (TTS/STT)
    audio_file_name = Column(String(255), nullable=True)  # Name of the audio file uploaded
    audio_storage_path = Column(String(500), nullable=True)  # Path/filename to play back stored audio
    translated_text = Column(Text, nullable=True)  # Transcribed/translated text from audio
    detected_language = Column(String(50), nullable=True)  # Language detected from audio
    
    # Error Details
    error_type = Column(String(255), nullable=False)  # Exception class name
    error_message = Column(Text, nullable=False)
    error_traceback = Column(Text, nullable=True)  # Full traceback of the error
    failure_stage = Column(String(100), nullable=True)  # e.g., "transcription", "intent_detection", "session_processing"
    
    # Logging and preprocessing
    preprocessing_logs_text = Column(Text, nullable=True)  # Logs from preprocessing steps (TTS/STT functions)
    
    # Intent data (if available before error)
    intent_data = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<APIErrorLog {self.id}: {self.endpoint} - {self.error_type}>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "endpoint": self.endpoint,
            "audio_file_name": self.audio_file_name,
            "audio_storage_path": getattr(self, "audio_storage_path", None),
            "translated_text": self.translated_text,
            "detected_language": self.detected_language,
            "error_type": self.error_type,
            "error_message": self.error_message,
            "error_traceback": self.error_traceback,
            "failure_stage": self.failure_stage,
            "preprocessing_logs_text": self.preprocessing_logs_text,
            "intent_data": self.intent_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
