from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from logger import logger
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from audio_service import translate_with_whisper,summarize_using_openai
from pydantic import BaseModel

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

@app.post("/upload-audio")
async def upload_audio(body: Body):
    print("------------body--------------",body,"--------------------------")
    try:
        print("----------audio file link-----------",body.audio_file_link,"-----------------------")
        # Check file type
        if not body.audio_file_link.endswith(('.m4a', '.mp4','.mp3','.webm','.mpga','.wav','.mpeg')):
            logger.error("invalid file type")
            raise HTTPException(status_code=400, detail="Invalid file type")
        print("---------------------translation started-----------------------")
        #translation = translate_with_whisper(transcription)
        translation = translate_with_whisper(body.audio_file_link)

        logger.info("translation done")
        print("----------   -----------summary started-----------------------")
        #summary = summarize_using_openai(translation)
        summary = summarize_using_openai(translation)

        logger.info("summary done")

        return JSONResponse(content={"message": "File processed successfully!", "translation":translation, "summary": summary}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"message": str(e)}, status_code=500)
