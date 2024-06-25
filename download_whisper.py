import whisper
import os

model_path = "whisper_model"
model_id = 'large-v3'

# Ensure the directory exists
os.makedirs(model_path, exist_ok=True)

# Download model 
model = whisper.load_model(model_id, download_root=model_path)
