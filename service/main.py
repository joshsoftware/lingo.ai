from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/upload-audio")
def upload_audio(file: UploadFile = File(...)):
    return {"filename": file.filename, "message": "File uploaded successfully!"}

