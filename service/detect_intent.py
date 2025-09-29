from itertools import count
import json
#from msilib import PID_WORDCOUNT
import re
import logging
import ollama
from config import ollama_host, ollama_model_name, ollama_translation_model_name
from typing import Dict, Any
from time_utils import normalize_timeframe

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
lang_map = {
    "en": "English", "hi": "Hindi", "bn": "Bengali", "ta": "Tamil", "te": "Telugu",
    "mr": "Marathi", "ml": "Malayalam", "kn": "Kannada", "gu": "Gujarati", "pa": "Punjabi",
    "or": "Odia", "ur": "Urdu", "sa": "Sanskrit", "ar": "Arabic", "fr": "French",
    "de": "German", "es": "Spanish", "it": "Italian", "pt": "Portuguese", "zh": "Chinese",
    "ja": "Japanese", "ko": "Korean", "ru": "Russian", "sv": "Swedish", "pl": "Polish",
    "tr": "Turkish", "cs": "Czech", "fi": "Finnish", "he": "Hebrew"
}
ALLOWED_INTENTS = ["check_balance", "recent_txn", "transfer_money",  "txn_insights", "unknown"]

SYSTEM = """
You are a strict NLU engine for a  banking  assistant in India.  
1. Identify the user's intent. Choose from: [check_balance, recent_txn, transferMoney, txn_insights, unknown].
2. Extract the following entities if present: amount (number), timeframe (string), date (yyyy-mm-dd), start_date (yyyy-mm-dd), end_date (yyyy-mm-dd), recipient (string), count (integer), category (str),..
3. If a word in the user query could be either a merchant/person, always treat known merchants or persons as recipient. Treat clear spending types like food, shopping, groceries as category. If unsure, prioritize recipient and leave category empty.

You MUST return valid JSON with this schema:
{
  "intent": "check_balance" | "recent_txn" | "txn_insights" | "transfer_money" | "unknown",
  "entities": { }
}

Rules:
- Always pick one of the allowed intents, never invent new ones.
- Dates MUST be normalized into ISO format yyyy-mm-dd. Use today's date as reference (2025-09-07).
- Extract entities only if explicitly present. If missing, leave empty.
- If you cannot detect the language then default to en-IN
- make sure the json response is valid json with proper enclosing parenthesis
- Keep JSON minimal. No markdown, no extra text, no extra quotes.
- Do not add anything for recipient if it recipient is not clear.

Examples:
User: "What is my balance?" or "How much money I have in my account?"
{"intent":"check_balance","entities":{},"language":"{lang}"}

User: "Show transactions on 10th September"
{"intent":"txn_insights","entities":{"date":"2025-09-10"},"language":"{lang}"}


User: "Show last 5 transactions"
{"intent":"recent_txn","entities":{"count": 5},"language":"{lang}"}

User: "Show me last transaction"
{"intent":"recent_txn","entities":{"count": 1},"language":"{lang}"}

User: "Send 1500 to AnanyaRavi"
{"intent":"transfer_money","entities":{"recipient":"AnanyaRavi","amount":1500,"currency":"INR"},"language":"{lang}"}


User: "Transfer 1500 to Shubam"
{"intent":"transfer_money","entities":{"recipient":"Shubam","amount":1500,"currency":"INR"},"language":"{lang}"}

User: "Show me my last 10 transactions to shubam"
{"intent":"txn_insights","entities":{"recipient":"shubam","count":10},"language":"{lang}"}

User: "How much I spent on food for last 10 days"
{"intent":"txn_insights","entities":{"timeframe":"10 days","category":"food"},"language":"{lang}"}

User: "How much I spend shopping last month"
{"intent":"txn_insights","entities":{"timeframe":"last_month","category":"shopping"},"language":"{lang}"}"

User: "What was my expenses last year?"
{"intent":"txn_insights","entities":{"timeframe":"last_year"},"language":"{lang}"}"

User: "How much I spend amazon last week"
{"intent":"txn_insights","entities":{"timeframe":"last_week","recipient":"amazon", "category":"shopping"},"language":"{lang}"}

“Show me my last 5 Swiggy transactions”
{"intent":"txn_insights","entities":{"count":5,"recipient":"swiggy"},"language":"{lang}"}

Do NOT hallucinate.

"""

def safe_json_parse(s: str) -> Dict[str, Any]:
    # Try direct parse
    try:
        return json.loads(s)
    except Exception:
        pass
    # Fallback: extract first {...} block
    m = re.search(r"\{.*\}", s, re.S)
    if not m:
        return {"intent": "unknown", "entities": {}, "language": "und"}
    try:
        return json.loads(m.group(0))
    except Exception:
        return {"intent": "unknown", "entities": {}, "language": "und"}

def validate_schema(result: dict) -> dict:
    """Validate and normalize schema for intent detection result."""
    
    intent = result.get("intent", "unknown")
    if intent not in ALLOWED_INTENTS:
        intent = "unknown"
    entities = result.get("entities", {})
    amount = entities.get("amount", None)
    try:
        amount = float(amount) if amount is not None else None
    except (TypeError, ValueError):
        amount = None
    currency = entities.get("currency", None)
    if currency not in ["USD", "INR", None, "null"]:
        currency = None
    # recipient = entities.get("payee", None)
    # if isinstance(recipient, str) and recipient.lower() in ["null", "none", ""]:
    #     recipient = None
    timeframe = entities.get("timeframe", None)
    if isinstance(timeframe, str) and timeframe.lower() in ["null", "none", ""]:
        timeframe = None
    count = entities.get("count", None)
    start_date = entities.get("start_date", None)
    if isinstance(start_date, str) and start_date.lower() in ["null", "none", ""]:
        start_date = None
    end_date = entities.get("end_date", None)
    if isinstance(end_date, str) and end_date.lower() in ["null", "none", ""]:
        end_date = None
    category = entities.get("category", None)
    if isinstance(category, str) and category.lower() in ["null", "none", ""]:
        category = None
    recipient = entities.get("recipient", None)
    if isinstance(recipient, str) and recipient.lower() in ["null", "none", ""]:
        recipient = None
    language = result.get("language","en")
    confidence = result.get("confidence", 0.0)
    try:
        confidence = float(confidence)
        confidence = max(0.0, min(confidence, 1.0))
    except (TypeError, ValueError):
        confidence = 0.0
    return {
        "intent": intent,
        "entities": {
            "amount": amount,
            "currency": currency if currency != "null" else None,
            "recipient": recipient,
            "timeframe": timeframe,
            "start_date": start_date,
            "end_date": end_date,
            "category":category,
            "recipient":recipient,
            "count":count
        },
        "language": language,
        "confidence": confidence,
    }
def translate(message:str, lang_code: str = "en"):
    lang_code = lang_map.get(lang_code,"English")
    logger.info(f"Model: {ollama_translation_model_name}, language: {lang_code}")
    if lang_code == "English":
        return message
    SYSTEM_TRANS=f"""
    Your are translator from English to {lang_code} and just respond with recommanded translated script.
    No translitration and should not repsond with any other language words other than {lang_code} words.
    """
    try:
        response = ollama.Client(host=ollama_host).generate(
            system=SYSTEM_TRANS,
            model=ollama_translation_model_name,
            prompt=message.strip(),
            options={"temperature": 0.0, "top_p": 0.8},            
            stream=False,
        )
        llama_response = response["response"].strip()
        return llama_response
    except Exception as e:
         logger.error(f"Error during intent detection: {str(e)}")
         return message
    
def detect_intent_with_llama(transcript: str, lang_hint: str = "en") -> Dict[str, Any]:
    #transcript = "how much i spend on amazon last month?"
    try:
        response = ollama.Client(host=ollama_host).generate(
            system = SYSTEM,
            model=ollama_model_name,
            prompt=transcript.strip(),
            options={"temperature": 0.0, "top_p": 0.8},            
            stream=False
            
        )
        llama_response = response["response"].strip()
        logger.info(f"llama response: {llama_response}")

        parsed = safe_json_parse(llama_response)
        parsed["entities"] = normalize_timeframe(parsed.get("entities", {}))
        validated = validate_schema(parsed)
        logger.info(f"Intent detected: {validated['intent']} (confidence: {validated['confidence']})")
        logger.info(f"Entities: {validated['entities']}")
        # Manually add language detected by the whisper model
        validated["language"] = lang_hint
        return validated

    except Exception as e:
        logger.error(f"Error during intent detection: {str(e)}")
        return {
            "intent": "unknown",
            "entities": {"amount": None, "currency": None, "recipient": None},
            "confidence": 0.0,
            "error": str(e),
        }
def format_intent_response(llama_response: dict) -> dict:
    """
    Format Llama 3.2 response to match the expected intent_data structure.
    
    Args:
        llama_response: Response from detect_intent_with_llama function
        
    Returns:
        Formatted intent_data matching the expected structure
        
    """
    
    # Extract values from Llama response
    intent = llama_response.get("intent", "unknown")
    entities = llama_response.get("entities", {})
    language = llama_response.get("language","en")
    
    # Determine action based on intent and entities
    action = determine_action(intent, entities)

    # Format in expected structure
    formatted_response = {
        "intent": intent,
        "entities": {
            "amount": entities.get("amount"),
            "currency": entities.get("currency"),
            "recipient": entities.get("recipient"),
            "timeframe": entities.get("timeframe"),
            "start_date": entities.get("start_date"),
            "end_date": entities.get("end_date"),
            "category": entities.get("category"),
            "count":entities.get("count")
        },
        "language": language,
        "action": action
    }

    return formatted_response


def determine_action(intent: str, entities: dict) -> str:
    """
    Determine the action based on intent and available entities.
    
    Args:
        intent: The detected intent
        entities: Extracted entities
        
    Returns:
        Action string
    """
    
    if intent == "check_balance":
        return "respond"
    elif intent == "recent_txn":
        return "respond"
   
    elif intent == "transfer_money":
        amount = entities.get("amount")
        recipient = entities.get("recipient")
        
        # If both amount and recipient are present, process payment
        if amount and recipient:
            return "respond"
        else:
            return "Need both recipient and amount to be transferred. Could you please repeat the statement "
    elif intent == "txn_insights":
        timeframe = entities.get("timeframe")
        if timeframe:
            category = entities.get("category")
            recipient = entities.get("recipient")
            count = entities.get("count")
            if category or recipient:
                return "respond"
            else:
                return "To filter transactions details, need more filter criteria"
        return "To filter transactions details, need date range"
    else:
        return "unknown"
