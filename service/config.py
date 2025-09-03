import os
from dotenv import load_dotenv

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
#model_id = os.getenv('MODEL_ID', 'large-v3')
model_id = os.getenv('MODEL_ID')
model_path = os.getenv('MODEL_PATH')
ollama_host = os.getenv("OLLAMA_HOST", "http://ollama:11434")
ollama_model_name = os.getenv("OLLAMA_MODEL_NAME", "llama3.2")
open_ai_model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4")
open_ai_temperature = os.getenv("OPENAI_TEMPERATURE", 0.2)
