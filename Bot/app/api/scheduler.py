from fastapi import APIRouter
from app.core.scheduler import scheduler
from app.helper.bot_actions import join_meeting_with_retry
from app.models.schemas import ScheduleBotRequest
import requests
import time
import threading
from app.log_config import logger
import os

router = APIRouter(prefix="/scheduler", tags=["Scheduler"])


def background_join_meeting(meeting_url, bot_name):
    """Runs join logic in a separate thread."""
    thread = threading.Thread(target=join_meeting_with_retry, args=(meeting_url, bot_name))
    thread.start()

def join_meeting_with_retry(meeting_url, bot_name):
    attendee_api_key = os.getenv("ATTENDEE_API_KEY")
    headers={
        "Authorization": f"Token {attendee_api_key}",
        "Content-Type": "application/json"
    }
    while True:
        logger.info(f"Joining meeting: {meeting_url} with bot: {bot_name}")
        response = requests.post(
            "http://attendee-attendee-app-local-1:8000/api/v1/bots",
            headers=headers,
            json={"meeting_url": meeting_url, "bot_name": bot_name}
        )
        logger.info(f"Join bot response: {response.status_code}, {response.text}")

        if response.status_code == 201:
            bot_id = response.json().get("id")
            logger.info(f"Bot created with ID: {bot_id}")

            # Check bot status until success or meeting ends
            while True:
                status_response = requests.get(
                    f"http://attendee-attendee-app-local-1:8000/api/v1/bots/{bot_id}",
                    headers=headers
                )
                status_data = status_response.json()
                logger.info(f"Bot status: {status_data}")

                if status_data.get("state") in ["joined_recording", "joined"]:
                    logger.info("Bot joined successfully")
                    return
                elif status_data.get("state") == "fatal_error":
                    logger.info("Bot failed to join. Retrying...")
                    break

                logger.info("Retrying bot status check in 30 seconds...")
                time.sleep(30)

        logger.info("Retrying bot join in 30 seconds...")
        time.sleep(30)

@router.post("/schedule-join-bot")
async def schedule_join_bot(request: ScheduleBotRequest):
    meeting_url = request.meeting_url
    bot_name = request.bot_name
    meeting_time = request.meeting_time
    meeting_end_time = request.meeting_end_time


    # Schedule the job at the meeting time and keep retrying until meeting ends
    scheduler.add_job(background_join_meeting, 'date', run_date=meeting_time, id=meeting_url, replace_existing=True, kwargs={"meeting_url": meeting_url, "bot_name": bot_name})
    return {"message": "Job scheduled", "meeting_url": meeting_url, "meeting_time": meeting_time, "meeting_end_time": meeting_end_time}


@router.get("/scheduled-jobs")
def get_scheduled_jobs():
    jobs = scheduler.get_jobs()
    return [job.id for job in jobs]


@router.delete("/stop-all-jobs")
def stop_all_jobs():
    jobs = scheduler.get_jobs()
    for job in jobs:
        scheduler.remove_job(job.id)
    return {"message": "All jobs stopped."}


