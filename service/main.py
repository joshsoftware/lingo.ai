from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from logger import logger
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from audio_service import translate_with_whisper
from audio_service import translate_with_whisper_timestamped, translate_with_whisper_from_upload
from detect_intent import detect_intent_with_llama, format_intent_response
from summarizer import summarize_using_openai
from summarizer import summarize_using_ollama, extract_contact_detailed_using_ollama
from pydantic import BaseModel
import traceback
from util import generate_timestamp_json
from fastapi_versionizer.versionizer import Versionizer, api_version
import json
from core_banking_mock import router as core_banking_mock_router
import os
import requests
from config import odoo_url, odoo_db, odoo_username, odoo_password
from crm_client import OdooCRMClient

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

app.include_router(core_banking_mock_router)

@app.post("/voice/transcribe-intent")
async def transcribe_intent(audio: UploadFile = File(...), session_id: str = Form(...)):
    try:
        if not audio:
            return JSONResponse(status_code=400, content={"message":"No audio file provided"})

        translation_text = translate_with_whisper_from_upload(audio)
        logger.info("translation done")
        logger.info(translation_text)

        intent = detect_intent_with_llama(translation_text)
        logger.info("intent find done")
        logger.info("Intent: ", intent)

        try:
            if isinstance(intent, dict):
                intent_dict = intent
            else:
                intent_dict = json.loads(intent)
        except json.JSONDecodeError:
            logger.warning(f"Intent detection returned non-JSON response: {intent}")
            result = {"error": intent, "session_id": session_id, "translation": translation_text}
            return JSONResponse(content=result, status_code=200)
        
        # Map Llama response to your expected format
        formatted_intent_data = format_intent_response(intent_dict)

        result = {
            "session_id": session_id,
            "translation": translation_text,
            "intent_data": {
                "intent_data": formatted_intent_data
            }
        }
        return JSONResponse(content=result, status_code=200)

    except Exception as e:
        logger.info(traceback.format_exc())
        return JSONResponse(content={"message": str(e)}, status_code=500)
async def save_crm_lead_data(lead_id, file_path, translation, extracted_data, summary, user_id=None, transcription_id=None):

    """
    Save CRM lead data to the database through the Next.js API.
    """
    try:
        # Get base URL from environment or use default
        api_base_url = os.environ.get("NEXT_API_BASE_URL", "http://localhost:3000")
        
        # Extract just the filename from the file path
        file_name = os.path.basename(file_path)
        
        # Prepare the data to send
        crm_lead_data = {
            "leadId": str(lead_id),
            "crmUrl": odoo_url,  # Using the odoo_url from config
            "fileName": file_name,
            "transcriptionId": transcription_id,  # This might be None if not provided
            "extractedData": extracted_data,
            "translation": translation,
            "userId": user_id,  # This might be None if not provided
            "isDefault": False  # Adding the default field set to false
        }
        
        # Make the API call
        response = requests.post(
            f"{api_base_url}/api/crm-leads", 
            json=crm_lead_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            logger.info(f"CRM lead data saved successfully for lead_id={lead_id}")
            return response.json()
        else:
            logger.error(f"Failed to save CRM lead data: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"Exception saving CRM lead data: {str(e)}")
        return None



# Add this function to retrieve default CRM leads
async def get_default_crm_leads():
    """
    Fetch CRM leads that are marked as default.
    """
    try:
        api_base_url = os.environ.get("NEXT_API_BASE_URL", "http://localhost:3000")
        
        response = requests.get(
            f"{api_base_url}/api/crm-leads/default",
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Failed to get default CRM leads: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error fetching default CRM leads: {str(e)}")
        return None

# Add a route to expose this functionality
@app.get("/crm-leads/default")
async def fetch_default_crm_leads():
    try:
        result = await get_default_crm_leads()
        if result and result.get("success"):
            return JSONResponse(content=result, status_code=200)
        else:
            return JSONResponse(
                content={"message": "Failed to retrieve default CRM leads"}, 
                status_code=500
            )
    except Exception as e:
        logger.error(f"Error in fetch_default_crm_leads: {str(e)}")
        return JSONResponse(content={"message": str(e)}, status_code=500)
# Add this new, simpler endpoint

@app.get("/crm-lead/{lead_id}")
async def get_crm_lead_direct(lead_id: str):
    """
    Get CRM lead data directly by ID from the database.
    Simple direct lookup without complex routing.
    """
    try:
        api_base_url = os.environ.get("NEXT_API_BASE_URL", "http://localhost:3000")
        
        # Make a direct GET request to a simple endpoint
        simple_url = f"{api_base_url}/api/crm-leads/simple/{lead_id}"
        logger.info(f"Making GET request to: {simple_url}")
        
        response = requests.get(
            simple_url,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            return JSONResponse(content=response.json(), status_code=200)
        else:
            return JSONResponse(
                content={"message": "CRM lead not found", "id": lead_id}, 
                status_code=404
            )
            
    except Exception as e:
        logger.error(f"Error retrieving CRM lead: {str(e)}")
        return JSONResponse(content={"message": str(e)}, status_code=500)

@app.post("/upload-crm-audio")
async def upload_crm_audio(body: Body):
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
        

        contact_info = extract_contact_detailed_using_ollama(translation["text"]) if "text" in translation else {"name": None, "phone": None, "address": None}
        
        logger.info(result)

        # Fire-and-forget CRM sync (do not block response)
        lead_id = None
        try:
            if odoo_url and odoo_db and odoo_username and odoo_password:
                client = OdooCRMClient(odoo_url, odoo_db, odoo_username, odoo_password)
                lead_id = client.create_lead(
                    name=contact_info.get("name") or "Unknown",
                    email=None,
                    phone=contact_info.get("phone"),
                )
                logger.info(f"CRM: Lead created lead_id={lead_id}")
                partner_id = client.add_contact_details(lead_id, contact_info.get("name"), None, contact_info.get("phone"))
                logger.info(f"CRM: Partner created/linked partner_id={partner_id} to lead_id={lead_id}")
                
                # Update: Use the complete street information from LLM extraction
                street = contact_info.get("street")
                logger.info(f"CRM: - Street: '{street}'")


                street2 = None
                city = contact_info.get("city")
                state = contact_info.get("state")
                zip_code = contact_info.get("zip")
                country = contact_info.get("country")
                
                logger.info(f"CRM: Address components street={street}, city={city}")
                
                updated = client.update_contact_address(
                    partner_id, 
                    street=street,
                    street2=street2, 
                    city=city,
                    state_id=None,
                    zip_code=zip_code,
                    country_id=None
                )
                logger.info(f"CRM: Address update result={updated} for partner_id={partner_id}")
              
                # Add CRM data to the result
                result["leadId"] = str(lead_id)
                result["crmUrl"] = odoo_url
                result["extractedData"] = contact_info
                result["transcriptionId"] = None  # This will be determined when transcription is saved
                result["translation"] = translation["text"]
                result["userId"] = None  # This will be set by frontend
                result["isDefault"] = False


            else:
                logger.info("CRM: Odoo credentials not configured; skipping CRM sync")
        except Exception as e:
            logger.info(f"CRM: Exception during sync: {e}")

        return JSONResponse(content=result, status_code=200)

    except Exception as e:
        logger.info(traceback.format_exc())
        return JSONResponse(content={"message": str(e)}, status_code=500)
        
