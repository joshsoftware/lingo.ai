from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from app.core.config import OAUTH2_SCHEME
import datetime
import requests
from app.helper.generate_presigned_url import generate_presigned_url, extract_file_url
from app.helper.save_transaction import save_transcription
from app.log_config import logger

router = APIRouter(prefix="/meetings", tags=["Meetings"])

LINGO_API_URL = "https://lingo.ai.joshsoftware.com"

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
    # import pdb; pdb.set_trace()
    logger.info(f"Call Recieved for {request.key}")
    presigned_url = generate_presigned_url(request.key)
    
    if not presigned_url:
        raise HTTPException(status_code=500, detail="Failed to generate presigned URL")
    

    
    file_url = extract_file_url(presigned_url)
    if not file_url:
        raise HTTPException(status_code=500, detail="Failed to extract file URL")
    
    # Step 3: Call the Lingo API
    payload = {
        "documentUrl": file_url,
        "documentName": "testing"
    }
    
    logger.info("Call to /api/transcribe lingo api")
    response = requests.post(f"{LINGO_API_URL}/api/transcribe", json=payload)
    transcribe_response = response.json()

    logger.info("Call to save transcription lingo api")
    save_transcription_response = save_transcription(response.json(), file_url, "testing")
    
    if not save_transcription_response:
        raise HTTPException(status_code=500, detail="Failed to save transcription")

    logger.info("Done!")
    return {
        "message": "Callback received",
        "file_url": file_url,
        "lingo_response": transcribe_response,
        "transcription_response": save_transcription_response
    }
    