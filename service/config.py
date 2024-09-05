import os
from dotenv import load_dotenv

load_dotenv()

openai_api_key = os.getenv("OPENAI_KEY")
#model_id = os.getenv('MODEL_ID', 'large-v3')
model_id = os.getenv('MODEL_ID')
model_path = os.getenv('MODEL_PATH')
