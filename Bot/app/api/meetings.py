from fastapi import APIRouter, Depends
from pydantic import BaseModel
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from app.core.config import OAUTH2_SCHEME
import datetime
import requests

router = APIRouter(prefix="/meetings", tags=["Meetings"])

class LingoRequest(BaseModel):
    key: str

@router.get("/")
def get_meetings(token: str = Depends(OAUTH2_SCHEME)):
    creds = Credentials(token=token)
    service = build('calendar', 'v3', credentials=creds)

    now = datetime.datetime.utcnow().isoformat() + 'Z'
    one_week_later = (datetime.datetime.utcnow() + datetime.timedelta(days=7)).isoformat() + 'Z'

    events_result = service.events().list(
        calendarId='primary',
        timeMin=now,
        timeMax=one_week_later,
        maxResults=10,
        singleEvents=True,
        orderBy='startTime'
    ).execute()

    events = events_result.get('items', [])
    scheduled_meetings = []

    for event in events:
        meeting_url = event.get('hangoutLink')
        if meeting_url:
            # Extract meeting details
            title = event.get('summary', 'Unnamed Meeting')
            start_time = event['start'].get('dateTime')
            end_time = event['end'].get('dateTime')
            if not start_time or not end_time:
                continue  # Skip all-day events

            # Convert time to the expected format
            meeting_time = datetime.datetime.fromisoformat(start_time).strftime('%Y-%m-%dT%H:%M:%S')
            meeting_end_time = datetime.datetime.fromisoformat(end_time).strftime('%Y-%m-%dT%H:%M:%S')

            # Schedule the bot by calling the existing API
            response = requests.post(
                "http://localhost:8001/scheduler/schedule-join-bot",
                headers={"Content-Type": "application/json"},
                json={
                    "meeting_url": meeting_url,
                    "bot_name": "My Bot",
                    "meeting_time": meeting_time,
                    "meeting_end_time": meeting_end_time
                }
            )
            scheduled_meetings.append({
                "title": title,
                "meeting_url": meeting_url,
                "status": response.json().get("message", "Failed")
            })

    return {"scheduled_meetings": scheduled_meetings}



@router.post("/call-to-lingo")
def call_to_lingo(request: LingoRequest):
    print(f"Getting Callbacks with key: {request.key}")
    return {"message": "Callback received"}