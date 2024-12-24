import json
import os
from fastapi import FastAPI, BackgroundTasks, UploadFile
from fastapi.responses import JSONResponse
import psycopg2
from logger import logger
from conversation_diarization.speaker_diarization import transcribe_audio, transcription_with_speaker_diarization
from starlette.middleware.cors import CORSMiddleware
from audio_service import translate_with_whisper
from conversation_diarization.dbcon import initDbConnection
from conversation_diarization.jd_interview_aligner import align_interview_with_job_description
from conversation_diarization.request import InterviewAnalysisRequest
from conversation_diarization.audio_transcription_request import AudioTranscriptionRequest
from conversation_diarization.action_extrator import extract_action_from_transcription
from summarizer import summarize_using_openai
from pydantic import BaseModel

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


@app.post("/audio-transcription/network")
async def audio_transcription_from_network(request: AudioTranscriptionRequest):
    try:
        transcription = transcribe_audio(request.audio)
        return JSONResponse(content={"transcription": transcription["full_transcript"]}, status_code=200)
    
    except Exception as e:
        return JSONResponse(content={"result": str(e)}, status_code=500)
    
@app.post("/audio-transcription/file")
async def audio_transcription_from_file(file: UploadFile):
    try:
        transcription = transcribe_audio(file.file)
        return JSONResponse(content={"transcription": transcription["full_transcript"]}, status_code=200)
    
    except Exception as e:
        return JSONResponse(content={"result": str(e)}, status_code=500)
    
@app.post("/get-action-from-audio")
async def get_action_from_transcription(file: UploadFile):
    try:
        # Transcribe
        # transcription = transcribe_audio(audio=file.file, translate=True)
        translation = translate_with_whisper(file.file)
        
        # Get action
        # action = extract_action_from_transcription(transcription["full_transcript"])
        action = extract_action_from_transcription(translation)
        
        # Return response
        return JSONResponse(content={"result": action}, status_code=200)
    
    except Exception as e:
        print(e)
        return JSONResponse(content={"result": str(e)}, status_code=500)

@app.post("/analyse-interview")
async def analyse_interview(request: InterviewAnalysisRequest, background_tasks: BackgroundTasks):
    ANALYSIS_STATUS = "pending"
    
    try:
        db_connection_string = os.getenv('DATABASE_URL')
    
        # Request payload validation
        if not all([request.interviewer_name, request.candidate_name, request.job_description_link, request.interview_link]):
            return JSONResponse(status_code=400, content={"message": "Invalid request, missing params"})
        
        # Create record
        analysis_id = insert_interview_analysis(
            conn_string=db_connection_string,
            user_id='x7w6qksaibnh2usz', #TODO: replace with actual user's id
            candidate_name=request.candidate_name,
            interviewer_name=request.interviewer_name,
            interview_recording_link=request.interview_link,
            job_description_document_link=request.job_description_link,
            status=ANALYSIS_STATUS
        )
        
        if not analysis_id:
            return JSONResponse(content={"message": "Failed to process the request, please try again."}, status_code=500)
        
        # Schedule background task for analysis
        background_tasks.add_task(
            process_interview_analysis,
            db_connection_string,
            analysis_id,
            request
        )
        
        # Respond immediately to the client
        return JSONResponse(content={"message": "Request received and is in progress", "analysis_id": analysis_id}, status_code=202)

    except Exception as e:
        return JSONResponse(content={"result": str(e)}, status_code=500)

def process_interview_analysis(conn_string, analysis_id, request):
    """
    Background task to handle transcription, speaker diarization, and job description alignment.
    """
    ANALYSIS_STATUS = "completed"
    
    # Perform transcription and speaker diarization
    transcription_result = transcription_with_speaker_diarization(request)
    
    # Go further with job description based analysis
    analysis_result = align_interview_with_job_description(request.job_description_link, transcription_result['qna'])
    
    # Update record
    analysis_updated = update_interview_analysis(
        conn_string=conn_string,
        record_id=analysis_id,
        transcript=transcription_result["transcript"],
        questions_answers=transcription_result["qna"],
        parsed_job_description=analysis_result["parsed_job_description"],
        analysis_result=analysis_result["analysis"],
        conversation=transcription_result["conversation"],
        status=ANALYSIS_STATUS
    )
    
    if analysis_updated:
        print(f"Analysis for record ID {analysis_id} completed successfully.")
    else:
        print(f"Analysis for record ID {analysis_id} failed.")

def insert_interview_analysis(conn_string, user_id, candidate_name, interviewer_name, 
                              interview_recording_link, job_description_document_link, status):
    """
    Insert a new record into the interview_analysis table and return the generated ID.
    """
    query = """
    INSERT INTO interview_analysis (
        user_id, 
        candidate_name, 
        interviewer_name, 
        interview_recording_link, 
        job_description_document_link, 
        status
    ) 
    VALUES (%s, %s, %s, %s, %s, %s)
    RETURNING id;
    """
    generated_id = None

    try:
        # Establish the database connection
        with psycopg2.connect(conn_string) as conn:
            with conn.cursor() as cur:
                # Execute the INSERT statement with parameterized values
                cur.execute(query, (
                    user_id, 
                    candidate_name, 
                    interviewer_name, 
                    interview_recording_link, 
                    job_description_document_link,
                    status
                ))
                # Fetch the returned ID
                row = cur.fetchone()
                if row:
                    generated_id = row[0]
                # Commit the transaction
                conn.commit()
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error: {error}")
    finally:
        return generated_id
    
def update_interview_analysis(conn_string, record_id, transcript, questions_answers, 
                              parsed_job_description, analysis_result, conversation, status):
    """
    Update an existing record in the interview_analysis table.
    """
    query = """
    UPDATE interview_analysis
    SET 
        transcript = %s,
        questions_answers = %s,
        parsed_job_description = %s,
        analysis_result = %s,
        conversation = %s,
        status = %s
    WHERE id = %s;
    """
    
    is_updated = False

    try:
        # Establish the database connection
        with psycopg2.connect(conn_string) as conn:
            with conn.cursor() as cur:
                # Execute the UPDATE statement with parameterized values
                cur.execute(query, (
                    transcript, 
                    json.dumps(questions_answers),
                    json.dumps(parsed_job_description),
                    json.dumps(analysis_result),
                    conversation,
                    status,
                    record_id
                ))
                # Check if any row was updated
                is_updated = cur.rowcount > 0
                # Commit the transaction
                conn.commit()
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error: {error}")
    finally:
        return is_updated