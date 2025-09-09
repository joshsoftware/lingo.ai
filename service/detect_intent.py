import json
import re
import logging
import ollama
from config import ollama_host, ollama_model_name

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

ALLOWED_INTENTS = ["get_balance", "recent_txn", "pay_person", "unknown"]

def safe_json_parse(response_text: str) -> dict:
    """Safely parse JSON, falling back to regex extraction if needed."""
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return {
            "intent": "unknown",
            "entities": {"amount": None, "currency": None, "recipient": None},
            "confidence": 0.0,
            "error": "Failed to parse JSON"
        }

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

def detect_intent_with_llama(text: str) -> dict:
    """Detect user intent and extract entities using LLaMA via Ollama client."""
    if not text or not text.strip():
        return {"error": "Empty text provided"}

    prompt = f"""
You are an expert intent detection system for a financial application.
Always respond with STRICT JSON only.

User Input: "{text}"

Instructions:
1. Detect the intent from this list ONLY: ["get_balance", "recent_txn", "pay_person", "unknown"].
2. Extract entities:
   - "amount": numeric value only (integer or float). If missing, use null.
   - "currency": "USD" for $, dollars; "INR" for ₹, rs, rupees; else null.
   - "recipient": name of person if present, else null.
3. Provide a "confidence" score (0.0 to 1.0). 
   - ≥0.8 if clear
   - 0.5–0.7 if ambiguous
   - <0.5 if unclear

🚨 Respond ONLY in this JSON format:
{{
  "intent": "detected_intent",
  "entities": {{
    "amount": number_or_null,
    "currency": "USD/INR/null",
    "recipient": "name_or_null"
  }},
  "confidence": number_between_0_and_1
}}
"""

    try:
        response = ollama.Client(host=ollama_host).generate(
            model=ollama_model_name,
            prompt=prompt,
            options={"temperature": 0.0, "top_p": 0.8, "max_tokens": 300},
        )

        llama_response = response["response"].strip()
        parsed = safe_json_parse(llama_response)
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
            "recipient": entities.get("recipient")
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