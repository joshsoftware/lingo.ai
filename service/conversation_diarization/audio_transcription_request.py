from pydantic import BaseModel

class AudioTranscriptionRequest(BaseModel):
    audio: str