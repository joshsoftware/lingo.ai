from pydantic import BaseModel

class MeetingRequest(BaseModel):
    meeting_url: str

class ScheduleBotRequest(BaseModel):
    meeting_url: str
    bot_name: str
    meeting_time: str
    meeting_end_time: str
