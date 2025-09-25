from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from logger import logger
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from audio_service import translate_with_whisper
from audio_service import translate_with_whisper_timestamped, translate_with_whisper_from_upload
from detect_intent import detect_intent_with_llama, format_intent_response
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
    Transcribe audio and detect intent.

    Processes audio → transcription → intent detection.
    """
    try:
        if not audio:
            return JSONResponse(status_code=400, content={"message":"No audio file provided"})

        # Step 1: Transcribe audio
        response = translate_with_whisper_from_upload(audio)
        translation_text = response['text']
        language = response["language"]

        # translation_text = "how much did i spend on food last week?"
        # translation_text = "what is the current balance in my account?"
        # translation_text = "tell me my last 10 transactions"
        # translation_text = "tell me my last 5 swiggy transactions"
        # translation_text = "tell me my last month salary" # unknown intent
        # translation_text = "Send 1000"
        logger.info("translation done")
        logger.info(translation_text)

        # Step 2: Detect intent
        intent = detect_intent_with_llama(translation_text,language)
        logger.info("intent identified")


        try:
            if isinstance(intent, dict):
                intent_dict = intent
            else:
                intent_dict = json.loads(intent)
        except json.JSONDecodeError:
            logger.warning(f"Intent detection returned non-JSON response: {intent}")
            result = {"error": intent, "session_id": session_id, "translation": translation_text}
            return JSONResponse(content=result, status_code=200)

        # Step 3: Format intent response
        # Map Llama response to your expected format
        formatted_intent_data = format_intent_response(intent_dict)
        banking_params_dict = {
            "customer_id": customer_id,
            "phone": phone,
            "transaction_type": transaction_type,
            "payment_method": payment_method
        }
        merged_params = {**banking_params_dict, **formatted_intent_data}
        orchestrated_data =  await orchestrate_banking_request(merged_params)

        # Step 4: Format a final response
        result = {
            "session_id": session_id,
            "translation": translation_text,
            "intent_data": formatted_intent_data,
            "orchestrator_data": orchestrated_data
        }

        return JSONResponse(content=result, status_code=200)

    except Exception as e:
        logger.error(f"Error in transcribe-intent: {traceback.format_exc()}")
        return JSONResponse(content={"message": str(e)}, status_code=500)
