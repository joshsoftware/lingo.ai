from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from logger import logger
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from audio_service import translate_with_whisper
from audio_service import translate_with_whisper_timestamped
from summarizer import summarize_using_openai
from summarizer import summarize_using_ollama
from pydantic import BaseModel
import traceback
from util import generate_timestamp_jon
from fastapi_versionizer.versionizer import Versionizer, api_version

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

@api_version(1)
@app.post("/upload-audio")
async def upload_audio(body: Body):
    try:
        #check if string is empty
        if body.audio_file_link == "":
            return JSONResponse(status_code=400, content={"message":"Invalid file link"})
        # Check file type
        if not body.audio_file_link.endswith(('.m4a', '.mp4','.mp3','.webm','.mpga','.wav','.mpeg','.ogg')):
            logger.error("invalid file type")
            return JSONResponse(status_code=400, content={"message":"Invalid file type"})
        translation = translate_with_whisper(body.audio_file_link)


        logger.info("translation done")
        summary = summarize_using_openai(translation)


        logger.info("summary done")
        return JSONResponse(content={"message": "File processed successfully!", "translation":translation, "summary": summary}, status_code=200)

    except Exception as e:
        logger.info(traceback.format_exc())
        return JSONResponse(content={"message": str(e)}, status_code=500)
    
@api_version(2)
@app.post("/upload-audio")
async def upload_audio(body: Body):
    try:
        #check if string is empty
        if body.audio_file_link == "":
            return JSONResponse(status_code=400, content={"message":"Invalid file link"})
        # Check file type
        if not body.audio_file_link.endswith(('.m4a', '.mp4','.mp3','.webm','.mpga','.wav','.mpeg','.ogg')):
            logger.error("invalid file type")
            return JSONResponse(status_code=400, content={"message":"Invalid file type"})
        translation = translate_with_whisper_timestamped(body.audio_file_link)

        logger.info("translation done")
        summary = summarize_using_ollama(translation["text"])

        logger.info("summary done")
        result = generate_timestamp_jon(translation,summary)
        logger.info(result)

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
