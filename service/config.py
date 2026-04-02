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
ollama_translation_model_name = os.getenv("OLLAMA_TRANS_MODEL","gemma2:latest")
open_ai_temperature = os.getenv("OPENAI_TEMPERATURE", 0.2)
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")
db_name = os.getenv("DB_NAME")

# Zaban STT/TTS API (replaces Sarvam for speech). Use https to avoid redirect (POST→GET causes 405).
zaban_base_url = os.getenv("ZABAN_BASE_URL", "")
zaban_api_key = os.getenv("ZABAN_API_KEY", "")

# Redis configuration
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_db = int(os.getenv("REDIS_DB", 0))
redis_password = os.getenv("REDIS_PASSWORD", None)
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
ollama_translation_model_name = os.getenv("OLLAMA_TRANS_MODEL","gemma2:latest")
open_ai_temperature = os.getenv("OPENAI_TEMPERATURE", 0.2)
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")
db_name = os.getenv("DB_NAME")

sarvam_api_key = os.getenv("SARVAM_API_KEY","sk_t7fvsjjb_7JsD5ZXGrEhHqjUtAQSFsCxB")
# Redis configuration
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_db = int(os.getenv("REDIS_DB", 0))
redis_password = os.getenv("REDIS_PASSWORD", None)

# Langflow API configuration
langflow_api_url = os.getenv("LANGFLOW_API_URL", "http://localhost:7860")
langflow_flow_id = os.getenv("LANGFLOW_FLOW_ID", "df6ef421-30ef-4901-bc8b-270c2ce61d41")
langflow_api_key = os.getenv("LANGFLOW_API_KEY", "sk-SCQyDlsYB7qPzmzL3yivQs-J5JmvX82uHVbDiGWrQR8")
langflow_timeout = int(os.getenv("LANGFLOW_TIMEOUT", 60))  # timeout in seconds

