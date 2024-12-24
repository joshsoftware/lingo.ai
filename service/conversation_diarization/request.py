from pydantic import BaseModel

class InterviewAnalysisRequest(BaseModel):
    candidate_name: str
    interviewer_name: str
    interview_link: str
    job_description_link: str