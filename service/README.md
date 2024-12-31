# Setup Instructions
**Pre-requisite: Note: Following instructions a for linux, python 3.8.1 or above**

    sudo apt-get update
    sudo apt-get install python3.8.1

ffmpeg

    sudo apt update && sudo apt install ffmpeg

Ollam

For Linux:

     curl -fsSL https://ollama.com/install.sh | sh

For Mac:

    https://ollama.com/download/Ollama-darwin.zip

For Windows:

    https://ollama.com/download/OllamaSetup.exe

Llama 3.2 model

     ollama run llama3.2

Setup Clone this github repository git clone

Create python virtual environment

    python3 -m venv lingo .

Activate the virtual environment

    source lingo/bin/activate

Install dependencies

    pip install -r requirements.txt

    uvicorn main:app --host localhost --port 8000 --reload

# Api endpoints

uri: "/"
method: "GET"
description: default route

uri: "/docs"
method: "GET"
description: swagger ui for api testing

uri: "/v1/upload-audio
mehtod: "POST"
Content-Type: application/json
body: {
    audio_file_link: saved audio file link (types accepted: 'm4a', 'mp4','mp3','webm','mpga','wav','mpeg')
}
successResponse: {
    message: "File processed successfully",
    translation: transalation
    summary: summary
}
successStatusCode: 200
errorResponse: {
    message: Error message
}
errorStatusCode: 500

uri: "/latest/upload-audio
mehtod: "POST"
Content-Type: application/json
body: {
    audio_file_link: saved audio file link (types accepted: 'm4a', 'mp4','mp3','webm','mpga','wav','mpeg')
}
successResponse: 
{
  "message": "File processed successfully!",
  "translation": transaction,
  "segments": [
    {
      "start": float,
      "end": float,
      "text": text
    },
    
  ],
  "summary": text
}
successStatusCode: 200
errorResponse: {
    message: Error message
}
errorStatusCode: 500

# exit virtual env

deactivate
