import os
from dotenv import load_dotenv

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
#model_id = os.getenv('MODEL_ID', 'large-v3')
model_id = os.getenv('MODEL_ID','small')
model_path = os.getenv('MODEL_PATH', './models')
ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
ollama_model_name = os.getenv("OLLAMA_MODEL_NAME", "llama3.2")
open_ai_model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4")
open_ai_temperature = os.getenv("OPENAI_TEMPERATURE", 0.2)

odoo_url = os.getenv("ODOO_URL")
odoo_db = os.getenv("ODOO_DB")
odoo_username = os.getenv("ODOO_USERNAME")
odoo_password = os.getenv("ODOO_PASSWORD")
