from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from audio_service import *

app = FastAPI()

@app.post("/upload-audio")
def upload_audio(file: UploadFile = File(...)):
    process_all_steps(file)
    return {"filename": file.filename, "message": "File uploaded successfully!"}

