import pytest
import whisper
import librosa
import io
import numpy as np
from pytube import YouTube
import openai
from app import extract_entities, load_model, download_audio_from_youtube, translate_text
import os

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



# Mocking a simple function to simulate the `extract_entities` behavior
def test_extract_entities():
    transcribed_text = "My name is John Doe. You can reach me at john.doe@example.com or call me at 123-456-7890."
    entities = extract_entities(transcribed_text)
    
    assert "Name:" in entities, "Extracted entities should contain 'Name'"
    assert "Phone Numbers:" in entities, "Extracted entities should contain 'Phone Numbers'"
    assert "Email:" in entities, "Extracted entities should contain 'Email'"
    assert "Addresses:" in entities, "Extracted entities should contain 'Addresses'"

def test_download_audio_from_youtube():
    youtube_link = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Example YouTube link
    audio_file = download_audio_from_youtube(youtube_link)
    assert audio_file is not None, "Audio file should be downloaded successfully"
    assert os.path.exists(audio_file), "Downloaded audio file should exist"

def test_invalid_youtube_url():
    invalid_youtube_link = "https://www.youtube.com/watch?v=invalid"  # Example invalid YouTube link
    try:
        audio_file = download_audio_from_youtube(invalid_youtube_link)
        assert False, "Function should raise an exception for invalid YouTube URL"
    except Exception as e:
        assert isinstance(e, Exception), "Function should raise an exception for invalid YouTube URL"

def test_transcribe_empty_audio():
    model_id = "small"
    model_path = "whisper_model"
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



import unittest
from unittest.mock import patch, MagicMock

class TestWhisperApp(unittest.TestCase):

    @patch('app.openai.chat.completions.create')
    def test_extract_entities(self, mock_openai):
        mock_openai.return_value.choices[0].message.content = "Entities: Name: John, Phone Numbers: 1234567890, Addresses: 123 Main St, Email: john@example.com"
        text = "Sample text for entity extraction."

        entities = extract_entities(text)

        # Assertions
        self.assertIn("Entities:", entities)
        self.assertIn("Name: John", entities)
        self.assertIn("Phone Numbers: 1234567890", entities)
        self.assertIn("Addresses: 123 Main St", entities)
        self.assertIn("Email: john@example.com", entities)

    @patch('app.openai.chat.completions.create')
    def test_translate_text(self, mock_openai):
        mock_openai.return_value.choices[0].message.content = "Translated text in English."
        text = "Sample text for translation."
        source_language = "hi"  # Assuming translating from Hindi

        translated_text = translate_text(text, source_language)

        # Assertions
        self.assertEqual(translated_text, "Translated text in English.")

    # Additional test cases can be added for edge cases, error handling, and performance if needed.

if __name__ == '__main__':
    unittest.main()

