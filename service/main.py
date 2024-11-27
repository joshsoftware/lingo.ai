from multiprocessing import pool
import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from logger import logger
from dotenv import load_dotenv
from conversation_diarization.speaker_diarization import transcription_with_speaker_diarization
from starlette.middleware.cors import CORSMiddleware
from audio_service import translate_with_whisper
from conversation_diarization.dbcon import initDbConnection
from conversation_diarization.jd_interview_aligner import align_interview_with_job_description
from conversation_diarization.request import InterviewAnalysisRequest
from summarizer import summarize_using_openai
from pydantic import BaseModel
from psycopg2 import pool

dbCursor = initDbConnection()

app = FastAPI()

# Add CORS middleware to the application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def root_route():
    return 'Hello, this is the root route for lingo ai server'

class Body(BaseModel):
    audio_file_link: str
    speaker_diarization: bool

@app.post("/upload-audio")
async def upload_audio(body: Body):
    try:
        #check if string is empty
        if body.audio_file_link == "":
            return JSONResponse(status_code=400, content={"message":"Invalid file link"})
        # Check file type
        if not body.audio_file_link.endswith(('.m4a', '.mp4','.mp3','.webm','.mpga','.wav','.mpeg','.ogg')):
            logger.error("invalid file type")
            return JSONResponse(status_code=400, content={"message":"Invalid file type"})
        #translation = translate_with_whisper(transcription)
        translation = translate_with_whisper(body.audio_file_link)

        logger.info("translation done")
        #summary = summarize_using_openai(translation)
        summary = summarize_using_openai(translation)

        logger.info("summary done")

        return JSONResponse(content={"message": "File processed successfully!", "translation":translation, "summary": summary}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"message": str(e)}, status_code=500)


@app.post("/analyse-interview")
async def analyse_interview(request: InterviewAnalysisRequest):
    try:
        # Request payload validation
        if request.interviewer_name == "" or request.candidate_name == "" or request.job_description_link == "" or request.interview_link == "":
            return JSONResponse(status_code=400, content={"message":"Invalid request, missing params"})
        
        # Create DB record
        # Pending
        
        # Perform transcription and speaker diarization
        transcription_result = transcription_with_speaker_diarization(request)
        
        return JSONResponse(content={"message": transcription_result}, status_code=200)
        
        # Go further with job description based analysis
        jd_description = align_interview_with_job_description(request.job_description_link, transcription_result['qna'])
        
        return JSONResponse(content={"message": jd_description}, status_code=200)
        
        # Update DB record
        # Pending
        
        # Return response
        #TODO: include record id below
        return JSONResponse(content={"message": "Request processed successfully"}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"message": str(e)}, status_code=500)