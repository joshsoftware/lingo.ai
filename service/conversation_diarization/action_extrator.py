import json
import re
import ollama
import torch
from utils.constants import LLM, TEMPERATURE
from utils.prompt import ACTION_EXTRATOR_PROMPT

COMPUTING_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def create_prompt(transcription: str) -> str:
    return ACTION_EXTRATOR_PROMPT.replace("<USER_COMMAND>", transcription)
    
def extract_action_from_transcription(transcription: str):
    prompt = create_prompt(transcription)
    
    response = ollama.chat(
        model=LLM,
        options={"temperature": TEMPERATURE},
        messages=[{"role": "user", "content": prompt}],
    )
    
    response_text = response.get("message", {}).get("content", "")
    response_text_json = re.search(r"\{.*\}", response_text, re.DOTALL)
    
    if response_text_json:
        try:
            response_text_json = json.loads(response_text_json.group())
        except json.JSONDecodeError as e:
            response_text_json = None
    else:
        response_text_json = None
    
    return response_text_json

