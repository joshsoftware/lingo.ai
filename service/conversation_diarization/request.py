from pydantic import BaseModel
from typing import Optional

class InterviewAnalysisRequest(BaseModel):
    candidate_name: str
    interviewer_name: str
    interview_link: Optional[str] = None
    interview_transcript: Optional[str] = None
    transcript_file: Optional[bytes] = None
    job_description_link: str