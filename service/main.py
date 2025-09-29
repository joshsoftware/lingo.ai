from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from logger import logger
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from audio_service import translate_with_whisper
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
from session_flow_handler import SessionFlowHandler

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
    audio: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    customer_id: Optional[int] = Form(None),
    phone: Optional[str] = Form(None),
    transaction_type: Optional[str] = Form(None),
    payment_method: Optional[str] = Form(None)
):
    """
    Transcribe audio and detect intent with session management.

    New approach: If session_id is provided and exists in Redis, use a session-based flow.
    Otherwise, use the standard new session flow.
    """
    try:
        if not audio:
            return JSONResponse(status_code=400, content={"message":"No audio file provided"})

        # Step 1: Common audio processing (transcription and intent detection)
        response = translate_with_whisper_from_upload(audio)
        translation_text = response['text']
        language = response["language"]
        logger.info("Translation done")
        logger.info(translation_text)

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

        # Step 2: Create banking request params
        banking_params_dict = {
            "customer_id": customer_id,
            "phone": phone,
            "transaction_type": transaction_type,
            "payment_method": payment_method
        }

        # Step 3: Decision logic based on session_id
        if session_id and session_manager.session_exists(session_id):
            # SESSION-BASED FLOW: Use a new session flow handler
            logger.info(f"Using session-based flow for session: {session_id}")
            
            session_handler = SessionFlowHandler()
            result = await session_handler.process_session_based_request(
                session_id=session_id,
                formatted_intent_data=formatted_intent_data,
                translation_text=translation_text,
                language=language,
                banking_params_dict=banking_params_dict
            )
            
            return JSONResponse(content=result, status_code=200)
        
        else:
            # NEW SESSION FLOW: Use existing flow for new sessions
            logger.info("Using new session flow")
            
            # Generate new session ID
            current_session_id = session_manager.generate_session_id()
            logger.info(f"Creating new session: {current_session_id}")

            # Create params for orchestrator (no previous data)
            merged_params = {**banking_params_dict, **formatted_intent_data}
            merged_params["session_continuation"] = False

            # Call orchestration logic
            orchestrated_data = await orchestrate_banking_request(merged_params)

            # Translate response message
            orchestrated_data['message'] = translate(orchestrated_data["message"], language)

            # Prepare session data for storage
            session_data = {
                "session_id": current_session_id,
                "customer_id": customer_id,
                "phone": phone,
                "transaction_type": transaction_type,
                "payment_method": payment_method,
                "language": language,
                "translations": [translation_text],
                "intent_data": formatted_intent_data,
                "orchestrator_data": orchestrated_data,
                "created_at": json.dumps({"timestamp": str(datetime.now())}),
                "updated_at": json.dumps({"timestamp": str(datetime.now())}),
                "turn_count": 1
            }

            # Store session in Redis
            session_manager.store_session(current_session_id, session_data)

            # Check if orchestrator indicates more input is needed
            needs_more_input = orchestrated_data.get("needs_more_input", False)
            missing_parameters = orchestrated_data.get("missing_parameters", [])

            # Format final response
            result = {
                "session_id": current_session_id,
                "translation": translation_text,
                "intent_data": formatted_intent_data,
                "orchestrator_data": orchestrated_data,
                "needs_more_input": needs_more_input,
                "missing_parameters": missing_parameters,
                "session_continuation": False,
                "flow_type": "new_session"  # Indicate this used the new session flow
            }
            
            return JSONResponse(content=result, status_code=200)

    except Exception as e:
        logger.error(f"Error in transcribe-intent: {traceback.format_exc()}")
        current_session_id = session_id if session_id else "unknown"
        return JSONResponse(content={"message": str(e), "session_id": current_session_id}, status_code=500)
