import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app  # assuming your main app file is named 'main.py'

client = TestClient(app)

# Mock for the Whisper translation function
def mock_translate_with_whisper(audio_link):
    return "This is a mock translation."

# Mock for the OpenAI summarize function
def mock_summarize_using_openai(text):
    return "This is a mock summary."

# Test for the root route
def test_root_route():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == 'Hello, this is the root route for lingo ai server'

# Test for the upload-audio route
@patch('main.translate_with_whisper', side_effect=mock_translate_with_whisper)
@patch('main.summarize_using_openai', side_effect=mock_summarize_using_openai)
def test_upload_audio(mock_translate, mock_summarize):
    # Example audio file link
    audio_file_link = "https://example.com/audio-file.mp3"

    # Payload to send
    payload = {
        "audio_file_link": audio_file_link
    }

    # Send POST request to /upload-audio
    response = client.post("/upload-audio", json=payload)

    # Assertions
    assert response.status_code == 200
    json_data = response.json()

    assert json_data["message"] == "File processed successfully!"
    assert json_data["translation"] == "This is a mock translation."
    assert json_data["summary"] == "This is a mock summary."

# Test for exception handling
@patch('main.translate_with_whisper', side_effect=Exception("Some error occurred during translation"))
def test_upload_audio_exception(mock_translate):
    # Example audio file link
    audio_file_link = "https://example.com/audio-file.mp3"

    # Payload to send
    payload = {
        "audio_file_link": audio_file_link
    }

    # Send POST request to /upload-audio
    response = client.post("/upload-audio", json=payload)

    # Assertions
    assert response.status_code == 500
    json_data = response.json()
    assert json_data["message"] == "Some error occurred during translation"
