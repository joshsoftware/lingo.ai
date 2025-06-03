from fastapi import FastAPI, Depends, HTTPException
from apscheduler.schedulers.background import BackgroundScheduler
import requests
import datetime
import threading
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials
from fastapi.security import OAuth2AuthorizationCodeBearer
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import datetime
from pydantic import BaseModel  
from helper import monitor_meeting, google_login
from config import config
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.security import OAuth2AuthorizationCodeBearer
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials
from starlette.middleware.cors import CORSMiddleware
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import datetime
import os
import time

# app = FastAPI()
# SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
# OAUTH2_SCHEME = OAuth2AuthorizationCodeBearer(
#     tokenUrl="/auth/google",
#     authorizationUrl="https://accounts.google.com/o/oauth2/auth"  # Add this URL
# )

# @app.get("/auth/google")
# def authenticate_google():
#     flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
#     creds = flow.run_local_server(port=0)
#     return {"access_token": creds.token, "refresh_token": creds.refresh_token}

# @app.get("/meetings")
# def get_meetings(token: str = Depends(OAUTH2_SCHEME)):
#     creds = Credentials(token=token)
#     service = build('calendar', 'v3', credentials=creds)

#     now = datetime.datetime.utcnow().isoformat() + 'Z'
#     one_week_later = (datetime.datetime.utcnow() + datetime.timedelta(days=7)).isoformat() + 'Z'

#     events_result = service.events().list(
#         calendarId='primary',
#         timeMin=now,
#         timeMax=one_week_later,
#         maxResults=10,
#         singleEvents=True,
#         orderBy='startTime'
#     ).execute()

#     events = events_result.get('items', [])
#     meetings = []

#     for event in events:
#         meeting_url = event.get('hangoutLink')
#         if meeting_url:
#             meetings.append({"title": event['summary'], "url": meeting_url})

#     return meetings

class MeetingRequest(BaseModel):
    meeting_url: str

class ScheduleBotRequest(BaseModel):
    meeting_url: str
    bot_name: str
    meeting_time: str
    meeting_end_time: str

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
CLIENT_SECRETS_FILE = 'credentials.json'
REDIRECT_URI = "http://localhost:8000/auth/google/callback"

# OAuth setup
OAUTH2_SCHEME = OAuth2AuthorizationCodeBearer(
    tokenUrl="",
    authorizationUrl="https://accounts.google.com/o/oauth2/auth"
)

scheduler = BackgroundScheduler()
scheduler.start()

# Step 1: Redirect user to Google for authentication
@app.get("/auth/google")
def authenticate_google():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
    return {"auth_url": auth_url}

# Step 2: Handle the callback and exchange code for tokens
@app.get("/auth/google/callback")
def google_callback(code: str):
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    flow.fetch_token(code=code)
    creds = flow.credentials

    return {
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "expiry": creds.expiry
    }

# Step 3: Fetch meetings using the access token
@app.post("/schedule-all-meetings")
def schedule_all_meetings(token: str = Depends(OAUTH2_SCHEME)):
    creds = Credentials(token=token)
    if not creds.valid and creds.expired and creds.refresh_token:
        creds.refresh(GoogleRequest())

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
    if not events:
        return {"message": "No upcoming meetings found"}

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
                "http://localhost:8001/schedule-join-bot",
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

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()

@app.get("/scheduled-jobs")
def get_scheduled_jobs():
    jobs = scheduler.get_jobs()
    return [job.id for job in jobs]

@app.delete("/stop-all-jobs")
def stop_all_jobs():
    jobs = scheduler.get_jobs()
    for job in jobs:
        scheduler.remove_job(job.id)
    return {"message": "All jobs stopped."}

@app.post("/schedule-join-bot")
def schedule_join_bot(request: ScheduleBotRequest):
    meeting_url = request.meeting_url
    bot_name = request.bot_name
    meeting_time = request.meeting_time
    meeting_end_time = request.meeting_end_time

    def join_meeting_with_retry():
        while True:
            
            print(f"Joining meeting: {meeting_url} with bot: {bot_name}")
            response = requests.post(
                "http://localhost:8000/api/v1/bots",
                headers={
                    "Authorization": "Token r9HdnelHbYxvOVsTyZpjNvDog68OI6Pt",
                    "Content-Type": "application/json"
                },
                json={"meeting_url": meeting_url, "bot_name": bot_name}
            )
            print(f"Join bot response: {response.status_code}, {response.text}")

            if response.status_code == 201:
                bot_id = response.json().get("id")
                print(f"Bot created with ID: {bot_id}")

                # Check bot status until success or meeting ends
                while True:
                    status_response = requests.get(
                        f"http://localhost:8000/api/v1/bots/{bot_id}",
                        headers={
                            "Authorization": "Token NdSQYHmxkqAExXlkOOgUwKCTO8oFlXMd",
                            "Content-Type": "application/json"
                        }
                    )
                    status_data = status_response.json()
                    print(f"Bot status: {status_data}")

                    if status_data.get("state") in ["joined_recording", "joined"]:
                        print("Bot joined successfully")
                        return
                    elif status_data.get("state") == "fatal_error":
                        print("Bot failed to join. Retrying...")
                        break

                    print("Retrying bot status check in 30 seconds...")
                    time.sleep(30)

            print("Retrying bot join in 30 seconds...")
            time.sleep(30)


    # Schedule the job at the meeting time and keep retrying until meeting ends
    scheduler.add_job(join_meeting_with_retry, 'date', run_date=meeting_time, id=meeting_url, replace_existing=True)
    return {"message": "Job scheduled", "meeting_url": meeting_url, "meeting_time": meeting_time, "meeting_end_time": meeting_end_time}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
