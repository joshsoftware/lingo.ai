import json
import re
import logging
import ollama
from config import ollama_host, ollama_model_name
from typing import Dict, Any
from time_utils import normalize_timeframe

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

ALLOWED_INTENTS = ["get_balance", "recent_txn", "pay_person", "unknown"]

SYSTEM = (
    "You are an NLU engine for a banking voice assistant in India. "
    "You must return STRICT JSON with keys: intent (string), entities (object), language (string). "
    "Allowed intents: get_balance, recent_txn, spend_summary, pay_person, unknown. "
    "Entities you may extract: amount (number), payee (string), timeframe (string), "
    "date (string in ISO yyyy-mm-dd), start_date (ISO), end_date (ISO), merchant (string), "
    "count (integer). Keep JSON minimal; no prose, no markdown."
)

USER_TEMPLATE = """Transcript: {transcript}

Return JSON ONLY. Examples:

Ex1:
{{"intent":"get_balance","entities":{{}},"language":"{lang}"}}

Ex2:
{{"intent":"recent_txn","entities":{{"date":"2025-09-02"}},"language":"{lang}"}}

Ex3:
{{"intent":"spend_summary","entities":{{"timeframe":"last_month"}},"language":"{lang}"}}

Ex4:
{{"intent":"pay_person","entities":{{"payee":"Ananya","amount":1500}},"language":"{lang}"}}
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

    recipient = entities.get("recipient", None)
    if isinstance(recipient, str) and recipient.lower() in ["null", "none", ""]:
        recipient = None
    timeframe = entities.get("timeframe", None)
    if isinstance(timeframe, str) and timeframe.lower() in ["null", "none", ""]:
        timeframe = None

    dt = entities.get("date", None)
    if isinstance(dt, str) and dt.lower() in ["null", "none", ""]:
        dt = None

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
        },
        "confidence": confidence,
    }

def detect_intent_with_llama(transcript: str, lang_hint: str = "en") -> Dict[str, Any]:
    prompt = USER_TEMPLATE.format(transcript=transcript.strip(), lang=lang_hint)
   

    try:
        response = ollama.Client(host=ollama_host).generate(
            system = SYSTEM,
            model=ollama_model_name,
            prompt=prompt,
            options={"temperature": 0.0, "top_p": 0.8, "max_tokens": 300},            
            stream=False,
        )

        llama_response = response["response"].strip()
        parsed = safe_json_parse(llama_response)
        
        parsed["entities"] = normalize_timeframe(parsed.get("entities", {}))
        validated = validate_schema(parsed)

        logger.info(f"Intent detected: {validated['intent']} (confidence: {validated['confidence']})")
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
        },
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
    elif intent == "pay_person":
        amount = entities.get("amount")
        recipient = entities.get("recipient")
        
        # If both amount and recipient are present, process payment
        if amount and recipient:
            return "process_payment"
        else:
            return "ask_for_details"
    else:
        return "unknown"