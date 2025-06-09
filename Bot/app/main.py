from fastapi import FastAPI
from app.api import auth, meetings, scheduler
from app.core.scheduler import scheduler as apscheduler
from starlette.middleware.cors import CORSMiddleware
from app.log_config import logger

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

@app.on_event("startup")
def startup_event():
    if not apscheduler.running:
        logger.info("Starting scheduler...")
        apscheduler.start()
    else:
        logger.info("Scheduler already running.")

@app.on_event("shutdown")
def shutdown_event():
    logger.info("Shutting down scheduler...")
    apscheduler.shutdown()

app.include_router(auth.router)
app.include_router(meetings.router)
app.include_router(scheduler.router)
