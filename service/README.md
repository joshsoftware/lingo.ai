# Installations

pip install uvicorn

# Start Server

source venv/bin/activate

cd service

uvicorn main:app --host localhost --port 8000 --reload

# Api endpoints

uri: "/"
method: "GET"
description: default route

uri: "/docs"
method: "GET"
description: swagger ui for api testing

uri: "/upload-audio
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

# exit virtual env

deactivate