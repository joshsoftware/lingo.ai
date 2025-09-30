import os
from dotenv import load_dotenv

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
#model_id = os.getenv('MODEL_ID', 'large-v3')
model_id = os.getenv('MODEL_ID','small')
model_path = os.getenv('MODEL_PATH', './models')
ollama_host = os.getenv("OLLAMA_HOST", "http://ollama:11434")
ollama_model_name = os.getenv("OLLAMA_MODEL_NAME", "llama3.2")
open_ai_model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4")
ollama_translation_model_name = os.getenv("OLLAMA_TRANS_MODEL","gemma3:1b")
open_ai_temperature = os.getenv("OPENAI_TEMPERATURE", 0.2)
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")
db_name = os.getenv("DB_NAME")

# Redis configuration
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_db = int(os.getenv("REDIS_DB", 0))
redis_password = os.getenv("REDIS_PASSWORD", None)
