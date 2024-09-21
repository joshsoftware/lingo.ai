from fastapi import UploadFile
from logger import logger
import openai
from dotenv import load_dotenv
from pydub import AudioSegment
from io import BytesIO
 
# Import configurations and functions from modules
from config import openai_api_key, model_id, model_path
from load_model import load_model

# Load environment variables
load_dotenv()

openai.api_key = openai_api_key
#Load whisher model
model = load_model(model_id, model_path)

#translate the audio file to English language using whisper model
def translate_with_whisper(audioPath): 
    logger.info("Started transciption through whishper")
    # audio_tensor = np_array_to_tensor(audio)
    # stft_result = perform_stft(audio_tensor)
    options = dict(beam_size=5, best_of=5)
    translate_options = dict(task="translate", **options)
    result = model.transcribe(audioPath,**translate_options)
    logger.info("completed transciption through whishper")
    return result["text"]

#Using openaie, summarize the English translation
def summarize_using_openai(text):
    logger.info("Started summarization")
    prompt = "Summarize the following text: " +text
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts information from Indian multilingual text."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            stream=True 
        )
        summary  = response.choices[0].message.content
    except Exception as e:
        logger.error(e)
        summary = "Unable to  exract summary"
    return summary
