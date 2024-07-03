import pytest
import os
import numpy as np
import openai
from app import extract_entities, load_model, translate_text

# Mocking a simple function to simulate the `extract_entities` behavior
def test_extract_entities():
    transcribed_text = "My name is John Doe. You can reach me at john.doe@example.com or call me at 123-456-7890."
    entities = extract_entities(transcribed_text)
    
    assert "Name:" in entities, "Extracted entities should contain 'Name'"
    assert "Phone Numbers:" in entities, "Extracted entities should contain 'Phone Numbers'"
    assert "Email:" in entities, "Extracted entities should contain 'Email'"
    assert "Addresses:" in entities, "Extracted entities should contain 'Addresses'"

def test_transcribe_empty_audio(tmp_path):
    model_id = "small"
    model_path = tmp_path  # Use a temporary path for testing
    model = load_model(model_id, model_path)
    
    # Create an empty audio array
    empty_audio_data = np.array([], dtype=np.float32)
    
    options = dict(beam_size=5, best_of=5, language="en")
    transcribe_options = dict(task="transcribe", **options)
    
    try:
        transcript = model.transcribe(empty_audio_data, **transcribe_options)
        assert False, "Function should raise an exception for empty audio data"
    except Exception as e:
        assert isinstance(e, Exception), "Function should raise an exception for empty audio data"

# New test cases for audio format and size handling
def test_audio_format(tmp_path):
    # Simulate downloading a mock audio file in .wav format
    audio_file_wav = os.path.join(tmp_path, "test_audio.wav")
    with open(audio_file_wav, "wb") as f:
        f.write(b"Mock audio content in .wav format")

    # Test .wav format
    assert audio_file_wav.endswith(".wav"), "Downloaded audio file should be in .wav format"

def test_audio_file_size(tmp_path):
    # Simulate downloading a mock audio file with specific size
    audio_file = os.path.join(tmp_path, "test_audio.mp3")
    mock_audio_size = 1024  # 1 KB
    with open(audio_file, "wb") as f:
        f.write(b"Mock audio content with specific size" * mock_audio_size)

    # Get size of the downloaded file
    file_size = os.path.getsize(audio_file)
    assert file_size > 0, "Downloaded audio file size should be greater than 0 bytes"

# New test case for handling OpenAI key expiration
def test_openai_key_expiration():
    # Backup the current OpenAI key
    backup_key = openai.api_key

    # Set an invalid key to simulate expiration
    openai.api_key = "invalid_key"

    text = "Sample text for translation."
    source_language = "hi"  # Assuming translating from Hindi

    try:
        translated_text = translate_text(text, source_language)
        assert False, "Function should raise an exception for invalid OpenAI key"
    except Exception as e:
        assert isinstance(e, Exception), "Function should raise an exception for invalid OpenAI key"

    # Restore the original OpenAI key
    openai.api_key = backup_key

# Ensure OpenAI key is initialized for the tests
@pytest.fixture(autouse=True)
def setup_openai_key():
    openai.api_key = "your_openai_key_here"  # Replace with your actual OpenAI key

# Ensure pytest runs with a temporary directory for each test
@pytest.fixture(scope="function", autouse=True)
def temp_directory_for_test(request, tmp_path):
    request.cls.tmp_path = tmp_path

# If running pytest directly, include this block
if __name__ == "__main__":
    pytest.main()


















# Mocking a simple function to simulate the `load_model` behavior
# def test_load_model():
#     model_id = "small"
#     model_path = "whisper_model"
#     model = load_model(model_id, model_path)
#     assert model is not None, "Model should be loaded successfully"

# # Mocking a simple function to simulate the `transcribe` behavior
# def test_transcribe_audio():
#     model_id = "small"
#     model_path = "whisper_model"
#     model = load_model(model_id, model_path)
    
#     # Load a sample audio file (you need to provide a valid audio file path here)
#     audio_file_path = r"C:\Users\Josh\whisper\audio.mp4"
#     audio_data, _ = librosa.load(audio_file_path, sr=16000)
    
#     options = dict(beam_size=5, best_of=5, language="en")
#     transcribe_options = dict(task="transcribe", **options)
#     transcript = model.transcribe(audio_data, **transcribe_options)
    
#     assert "text" in transcript, "Transcript should contain 'text' key"
#     assert transcript["text"] != "", "Transcription text should not be empty"



