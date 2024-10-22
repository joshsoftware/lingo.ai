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
    result = model.transcribe(audioPath,**translate_options)
    return result["text"]

