import os
import tempfile
from fastapi import UploadFile
import openai
from dotenv import load_dotenv
from config import openai_api_key, model_id, model_path
from load_model import load_model
import logging

logging.basicConfig(level=logging.INFO)  # Set the logging level
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
openai.api_key = openai_api_key
#Load whisher model
logger.info("Loading model...")
model = load_model(model_id, model_path)

#translate the audio file to English language using whisper model
def translate_with_whisper(audioPath):
    logger.info("translation started")
    options = dict(beam_size=5, best_of=5)
    translate_options = dict(task="translate", **options)
    
    if isinstance(audioPath, str):
        # If input is a file path, use it directly
        result = model.transcribe(audioPath, **translate_options)
    else:
        # Handle file-like object: Save it to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(audioPath.read())
            temp_file_path = temp_file.name

        try:
            # Pass the temporary file path to Whisper
            result = model.transcribe(temp_file_path, **translate_options)
        finally:
            # Clean up the temporary file
            os.remove(temp_file_path)

    return result["text"]

