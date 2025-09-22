
from itertools import count
import json
#from msilib import PID_WORDCOUNT
import re
import logging
import ollama
from config import ollama_host, ollama_model_name
from typing import Dict, Any
from time_utils import normalize_timeframe

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

ALLOWED_INTENTS = ["get_balance", "recent_txn", "transfer_money",  "spend_insights", "unknown"]

SYSTEM = """
You are a strict NLU engine for a  banking  assistant in India.  
1. Identify the user's intent. Choose from: [get_balance, recent_txn, transferMoney, spend_insights, unknown].
2. Extract the following entities if present: amount (number), payee (string), timeframe (string), date (yyyy-mm-dd), start_date (yyyy-mm-dd), end_date (yyyy-mm-dd), merchant (string), count (integer), category (str),..

You MUST return valid JSON with this schema:
{
  "intent": "get_balance" | "recent_txn" | "spend_insights" | "transfer_money" | "unknown",
  "entities": { },
  "language": "<BCP-47 code like en-IN, hi-IN, ta-IN>"
}

Rules:
- Always pick one of the allowed intents, never invent new ones.
- Dates MUST be normalized into ISO format yyyy-mm-dd. Use today's date as reference (2025-09-07).
- Extract entities only if explicitly present. If missing, leave empty.
- If you cannopt detect the language then default to en-IN
- make sure the json response is valid json with proper enclosing paranthesis
- Keep JSON minimal. No markdown, no extra text, no extra quotes.

Examples:
User: "What is my balance?" or "How much money I have in my account?"
{{"intent":"get_balance","entities":{{}},"language":"{lang}"}}

User: "Show transactions on 10th September"
{{"intent":"spend_insights","entities":{{"date":"2025-09-10"}},"language":"{lang}"}}


User: "Show last 5 transactions"
{{"intent":"recent_txn","entities":{{"count": 5}},"language":"{lang}"}}

User: "Send 1500 to AnanyaRavi"
{{"intent":"transfer_money","entities":{{"payee":"Ananya","amount":1500,"currency":"INR"}},"language":"{lang}"}}


User: "Transfer 1500 to Shubam"
{{"intent":"transfer_money","entities":{{"payee":"Ananya","amount":1500,"currency":"INR"}},"language":"{lang}"}}

User: "How much I spend food last 10 days"
{{"intent":"spend_insights","entities":{{"timeframe":"10 days","category":"food"}},"language":"{lang}"}}

User: "How much I spend amazon last week"
{{"intent":"spend_insights","entities":{{"timeframe":"last_week","merchant":"amazon"}},"language":"{lang}"}}

“Show me my last 5 Swiggy transactions”
{{"intent":"spend_insights","entities":{{"count":5,"merchant":"swiggy"}},"language":"{lang}"}}

Do NOT hallucinate.

"""
USER_TEMPLATE = """
You are a user
Transcript: {transcript}
Find the intent  and extract the required entities
Return JSON ONLY. 
Examples:
User: "What is my balance?" or "How much money I have in my account?"
{{"intent":"get_balance","entities":{{}},"language":"{lang}"}}

User: "Show transactions on 10th September"
{{"intent":"spend_insights","entities":{{"date":"2025-09-10"}},"language":"{lang}"}}


User: "Show last 5 transactions"
{{"intent":"recent_txn","entities":{{"count": 5}},"language":"{lang}"}}

User: "Send 1500 to AnanyaRavi"
{{"intent":"transfer_money","entities":{{"payee":"Ananya","amount":1500,"currency":"INR"}},"language":"{lang}"}}

User: "Transfer 150 to Shubam"
{{"intent":"transfer_money","entities":{{"payee":"Shubam","amount":150,"currency":"INR"}},"language":"{lang}"}}


User: "How much I spend food last 10 days"
{{"intent":"spend_insights","entities":{{"timeframe":"10 days","category":"food"}},"language":"{lang}"}}

User: "How much I spend amazon last week"
{{"intent":"spend_insights","entities":{{"timeframe":"last_week","merchant":"amazon"}},"language":"{lang}"}}

“Show me my last 5 Swiggy transactions”
{{"intent":"spend_insights","entities":{{"count":5,"merchant":"swiggy"}},"language":"{lang}"}}

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

    recipient = entities.get("payee", None)
    if isinstance(recipient, str) and recipient.lower() in ["null", "none", ""]:
        recipient = None
    timeframe = entities.get("timeframe", None)
    if isinstance(timeframe, str) and timeframe.lower() in ["null", "none", ""]:
        timeframe = None

    count = entities.get("count", None)

    dt = entities.get("date", None)
    if isinstance(dt, str) and dt.lower() in ["null", "none", ""]:
        dt = None
    category = entities.get("category", None)
    if isinstance(category, str) and category.lower() in ["null", "none", ""]:
        category = None
    merchant = entities.get("merchant", None)
    if isinstance(merchant, str) and merchant.lower() in ["null", "none", ""]:
        merchant = None
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
            "date": dt,
            "category":category,
            "merchant":merchant,
            "count":count
        },
        "language": language,
        "confidence": confidence,
    }

def detect_intent_with_llama(transcript: str, lang_hint: str = "en") -> Dict[str, Any]:
    prompt = USER_TEMPLATE.format(transcript=transcript.strip(), lang=lang_hint)
   
    print(lang_hint)
    try:
        response = ollama.Client(host=ollama_host).generate(
            system = SYSTEM,
            model=ollama_model_name,
            prompt=transcript.strip(),
            options={"temperature": 0.0, "top_p": 0.8, "max_tokens": 300},            
            stream=False,
        )
       
        logger.info(response)
        llama_response = response["response"].strip()
        logger.info(f"llama response: {llama_response}")

        parsed = safe_json_parse(llama_response)
        parsed["entities"] = normalize_timeframe(parsed.get("entities", {}))
        validated = validate_schema(parsed)
        logger.info(f"Intent detected: {validated['intent']} (confidence: {validated['confidence']})")
        logger.info(f"Entities: {validated['entities']}")
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
            "date": entities.get("date"),
            "category": entities.get("category"),
            "merchant": entities.get("merchant)"),
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
    
    if intent == "get_balance":
        return "respond"
    elif intent == "recent_txn":
        return "respond"
   
    elif intent == "transfer_money":
        amount = entities.get("amount")
        recipient = entities.get("recipient")
        
        # If both amount and recipient are present, process payment
        if amount and recipient:
            return "process_payment"
        else:
            return "ask_for_details"
    elif intent == "spend_insights":
        timeframe = entities.get("timeframe")
        if timeframe:
            category = entities.get("category")
            merchant = entities.get("merchant")
            count = entities.get("count")
            if category or merchant:
                return "respond"
            else:
                return "ask_for_details"
        return "ask_for_details"
    else:
        return "unknown"
#translation_text = "how much i spend on amazon last month?"
#translation_text = "how much did i spend on food yester?"
#translation_text = "what is the current balance in my account?"
#translation_text = "Send 1000 to Ananya"
#translation_text = "இருப்பு என்ன?"
#translation_text = "அனன்யாவுக்கு 1000 ரூபாய் அனுப்பு"
#translation_text = "Transfer 5002 to Ananya"
translation_text = "Last two transactions"
intent = detect_intent_with_llama(translation_text)
print(intent)