from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from logger import logger
from dotenv import load_dotenv
# Import configurations and functions from modules
from load_model import load_model
from audio_service import convert_uploadfile_to_ndarray, translate_with_whisper,summarize_using_openai

app = FastAPI()


@app.get("/")
def root_route():
    return 'Hello, this is the root route for lingo ai server'

@app.post("/upload-audio")
async def upload_audio(audioFile: UploadFile = File(...)):
    try:

        # Check file type
        # if not audioFile.filename.endswith(('m4a','mp3','webm','mp4','mpga','wav','mpeg')):
         if not audioFile.filename.endswith(('m4a','mp3','webm','mpga','wav','mpeg')):
            logger.error("invalid file type")
            raise HTTPException(status_code=400, detail="Invalid file type")

        # Convert sound file to np array
        data = await convert_uploadfile_to_ndarray(audioFile)

        logger.info("conversion done")

        #translation = translate_with_ollama(transcription)
        translation = translate_with_whisper(data)

        logger.info("translation done")
        
        #summary = summarize_using_llama(translation)
        summary = summarize_using_openai(translation)

        logger.info("summary done")

        return JSONResponse(content={"message": "File processed successfully!", "translation":translation, "summary": summary}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"message": str(e)}, status_code=500)
