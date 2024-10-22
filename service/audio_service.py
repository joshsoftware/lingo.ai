from fastapi import UploadFile
import openai
from dotenv import load_dotenv
from config import openai_api_key, model_id, model_path
from load_model import load_model

# Load environment variables
load_dotenv()
openai.api_key = openai_api_key
#Load whisher model
print("model loading...")
model = load_model(model_id, model_path)

#translate the audio file to English language using whisper model
def translate_with_whisper(audioPath): 
    print("Translation Started")
    options = dict(beam_size=5, best_of=5)
    translate_options = dict(task="translate", **options)
    result = model.transcribe(audioPath,**translate_options)
    print("Translation Completed")
    return result["text"]

