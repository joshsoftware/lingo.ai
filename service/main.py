from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from logger import logger
from dotenv import load_dotenv
import tempfile
import os
from starlette.middleware.cors import CORSMiddleware
# Import configurations and functions from modules
from load_model import load_model
from audio_service import translate_with_whisper,summarize_using_openai

app = FastAPI()

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

@app.post("/upload-audio")
async def upload_audio(audioFile: UploadFile = File(...)):
    try:

        # Check file type
        if not audioFile.filename.endswith(('m4a', 'mp4','mp3','webm','mpga','wav','mpeg')):
            logger.error("invalid file type")
            raise HTTPException(status_code=400, detail="Invalid file type")

        # Create a temporary file to save the uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audioFile.filename)[1]) as temp_file:
            temp_file_path = temp_file.name
            # Save the file
            with open(temp_file_path, "wb") as buffer:
                buffer.write(await audioFile.read())

        #translation = translate_with_ollama(transcription)
        translation = translate_with_whisper(temp_file_path)

        logger.info("translation done")

        # Clean up the temporary file
        os.remove(temp_file_path)
        
        #summary = summarize_using_llama(translation)
        summary = summarize_using_openai(translation)

        logger.info("summary done")

        return JSONResponse(content={"message": "File processed successfully!", "translation":translation, "summary": summary}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"message": str(e)}, status_code=500)
