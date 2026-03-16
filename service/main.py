from fastapi import FastAPI, UploadFile, File, Form, Depends, Request
from fastapi.responses import JSONResponse, Response, PlainTextResponse
from logger import logger
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from audio_service import translate_with_whisper_timestamped, translate_with_whisper_from_upload
from detect_intent import detect_intent_with_llama, format_intent_response, translate
from summarizer import summarize_using_openai
from summarizer import summarize_using_ollama
from pydantic import BaseModel
import traceback
from util import generate_timestamp_json
from fastapi_versionizer.versionizer import Versionizer, api_version
import json
from banking.core_banking_routes import router as banking_router
from orchestrator import orchestrate_banking_request
from typing import Optional
import httpx
from redis_client import session_manager
from datetime import datetime
from session_service import SessionService, SessionFlowProcessor
from metrics import (
    http_requests_total,
    http_request_duration_seconds,
    generate_metrics,
)

app = FastAPI()

# Add CORS middleware to the application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

@app.middleware("http")
async def prometheus_http_middleware(request: Request, call_next):
    path = request.url.path
    method = request.method
    start_time = datetime.now().timestamp()
    try:
        response = await call_next(request)
    except Exception:
        duration = datetime.now().timestamp() - start_time
        logger.info(
            f"HTTP {method} {path} -> 500 in {duration:.4f}s"
        )
        http_requests_total.labels(method=method, path=path, status_code="500").inc()
        http_request_duration_seconds.labels(method=method, path=path).observe(duration)
        raise

    status_code = str(response.status_code)
    duration = datetime.now().timestamp() - start_time
    logger.info(
        f"HTTP {method} {path} -> {status_code} in {duration:.4f}s"
    )
    http_requests_total.labels(method=method, path=path, status_code=status_code).inc()
    http_request_duration_seconds.labels(method=method, path=path).observe(duration)
    return response


@app.get("/")
def root_route():
    return "Hello, this is the root route for lingo ai server"


@app.get("/metrics")
def metrics_endpoint() -> Response:
    body, content_type = generate_metrics()
    return PlainTextResponse(body, media_type=content_type)

class Body(BaseModel):
    audio_file_link: str

def generate_timestamp_json(translation, summary, detected_language=None):
    """Generate the final JSON response with all required fields"""
    return {
        "message": "File processed successfully!",
        "translation": translation.get("text", ""),
        "summary": summary,
        "segments": translation.get("segments", []),
        "detected_language": detected_language or translation.get("detected_language", "unknown")
    }

@api_version(1)
@app.post("/upload-audio")
async def upload_audio(body: Body):
    try:
        if body.audio_file_link == "":
            return JSONResponse(status_code=400, content={"message":"Invalid file link"})

        translation = translate_with_whisper_timestamped(body.audio_file_link)
        
        # Extract detected language
        detected_language = translation.get("detected_language", "unknown")
        
        logger.info("translation done")
        summary = summarize_using_ollama(translation["text"])

        logger.info("summary done")
        
        # Pass the translation object and detected_language to generate_timestamp_json
        result = generate_timestamp_json(translation, summary, detected_language)
        

        return JSONResponse(content=result, status_code=200)

    except Exception as e:
        logger.info(traceback.format_exc())
        return JSONResponse(content={"message": str(e)}, status_code=500)
@api_version(2)
@app.post("/upload-audio")
async def upload_audio(body: Body):
    try:
        if body.audio_file_link == "":
            return JSONResponse(status_code=400, content={"message":"Invalid file link"})

        # Remove file extension check since frontend handles this
        translation = translate_with_whisper_timestamped(body.audio_file_link)
        detected_language = translation.get('detected_language', 'unknown')
        logger.info("translation done")
        summary = summarize_using_ollama(translation["text"])

        logger.info("summary done")
        result = generate_timestamp_json(translation,summary,detected_language)

        return JSONResponse(content=result, status_code=200)

    except Exception as e:
        logger.info(traceback.format_exc())
        return JSONResponse(content={"message": str(e)}, status_code=500)
versions = Versionizer(
    app=app,
    prefix_format='/v{major}',
    semantic_version_format='{major}',
    latest_prefix='/latest',
    sort_routes=True
).versionize()

app.include_router(banking_router)


@app.post("/voice/transcribe-intent")
async def transcribe_intent(
    audio: Optional[UploadFile] = File(None),
    session_id: Optional[str] = Form(None),
    customer_id: Optional[int] = Form(None),
    phone: Optional[str] = Form(None),
    transaction_type: Optional[str] = Form(None),
    payment_method: Optional[str] = Form(None),
    otp: Optional[str] = Form(None),
    beneficiary_name: Optional[str] = Form(None)
):
    """
    Transcribe audio and detect intent with session management.

    Two flows supported:
    1. Standard flow: Audio is provided, transcribed, and intent is detected
    2. OTP + session_id flow: No audio, fetch transcribe_text and language from session data
    """
    try:
        # Check for (OTP or beneficiary_name) + session_id flow (no audio required)
        if not audio and session_id and ((otp and otp.isdigit() and (int(otp) == 123456)) or beneficiary_name) :
            logger.info(f"Using OTP + session_id flow for session: {session_id}")
            
            # Initialize session flow processor
            session_processor = SessionFlowProcessor()
            
            # Get session data to fetch stored transcribe_text and language
            session_data = SessionService.get_session_data(session_id)
            if not session_data:
                return JSONResponse(status_code=400, content={"message": f"Session {session_id} not found"})
            
            # Extract transcribe_text and language from session data
            translations = session_data.get("translations", [])
            if not translations:
                return JSONResponse(status_code=400, content={"message": "No translation data found in session"})
            
            # Use the first (original) translation as transcribe_text
            translation_text = translations[0]
            language = session_data.get("language")
            
            if not language:
                return JSONResponse(status_code=400, content={"message": "No language data found in session"})
            
            # Use existing intent data from the session
            formatted_intent_data = session_data.get("intent_data", {})
            
            logger.info(f"Retrieved from session - translation: {translation_text}, language: {language}")
            # Process existing session with OTP
            success, response_data = await session_processor.process_existing_session(
                session_id, translation_text, language, formatted_intent_data, otp, beneficiary_name
            )
            if not success:
                return JSONResponse(status_code=400, content=response_data)
                
            return JSONResponse(content=response_data, status_code=200)
        # Standard flow - audio is required
        if not audio:
            return JSONResponse(status_code=400, content={"message":"No audio file provided"})

        # Step 1: Common audio processing (transcription and intent detection)
        id,response,lang,dia = translate_with_whisper_from_upload(audio)
        translation_text = response[1]
        language = lang[1]
        logger.info("Translation done")
        logger.info(translation_text)
        logger.info(language)

        #translation_text = "How much I spend on Flipkart last week"
        #translation_text = "list all my beneficiaries"
        #translation_text = "Pay 10 to Shailesh"
        #language = "hi-IN"
        # Detect intent
        intent = detect_intent_with_llama(translation_text, language)
        logger.info("Intent identified")
        try:
            if isinstance(intent, dict):
                intent_dict = intent
            else:
                intent_dict = json.loads(intent)
        except json.JSONDecodeError:
            logger.warning(f"Intent detection returned non-JSON response: {intent}")
            result = {"error": intent, "session_id": session_id, "translation": translation_text}
            return JSONResponse(content=result, status_code=200)

        # Format intent response
        formatted_intent_data = format_intent_response(intent_dict)
        logger.info(f"Formatted intent data: {formatted_intent_data}")


        # Step 3: Initialize session flow processor
        session_processor = SessionFlowProcessor()
        # Step 4: Decision logic - use session service to determine flow
        if SessionService.should_use_session_flow(session_id):
            # SESSION-BASED FLOW
            logger.info(f"Using session flow for session: {session_id}")
            
            success, response_data = await session_processor.process_existing_session(
                session_id, translation_text, language, formatted_intent_data, otp, beneficiary_name
            )
            
            if not success:
                return JSONResponse(status_code=400, content=response_data)
                
            return JSONResponse(content=response_data, status_code=200)
        
        else:
            # NEW SESSION FLOW
            logger.info("Creating new session flow")
            
            response_data = await session_processor.process_new_session(
                customer_id,
                phone, 
                transaction_type,
                payment_method,
                language,
                translation_text,
                formatted_intent_data
            )
            
            return JSONResponse(content=response_data, status_code=200)

    except Exception as e:
        logger.error(f"Error in transcribe-intent: {traceback.format_exc()}")
        current_session_id = session_id if session_id else "unknown"
        return JSONResponse(content={"message": str(e), "session_id": current_session_id}, status_code=500)
