from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.schema.runnable.base import RunnableSequence
from template_config import get_intent_template
import logging
from config import open_ai_model_name, open_ai_temperature
import re
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IntentDetector:
    """
    A class responsible for detecting intents from transcribed text using OpenAI.
    """

    def __init__(self):
        """Initialize the IntentDetector lazily - models will be loaded on first use."""
        self._model = None
        self._prompt_template = None
        self._llm_chain = None

    def _initialize_models(self):
        """Initialize the OpenAI model and prompt template if not already initialized."""
        if self._model is None:
            logger.info("Initializing OpenAI model for intent detection...")
            self._model = ChatOpenAI(
                model_name=open_ai_model_name,
                temperature=open_ai_temperature
            )
            self._prompt_template = get_intent_template()
            self._llm_chain = RunnableSequence(self._prompt_template, self._model)
            logger.info("OpenAI model initialization completed.")

    def detect_intent(self, text: str) -> str:
        """
        Detect intent from the input transcribed text.

        Args:
            text: The transcribed text to analyze for intent.

        Returns:
            JSON: The detected intent or error message.
        """
        if not text or len(text.strip()) == 0:
            return "The transcribed text is empty. Please provide valid input."

        # Initialize models lazily on first use
        self._initialize_models()

        logger.info("Intent detection started")

        try:
            result = self._llm_chain.invoke({"transcribed_text": text})
            logger.info("Intent detection completed successfully")
            return result.content
        except Exception as e:
            logger.error(f"Error occurred during intent detection: {str(e)}")
            return "An error occurred while finding the intent."


# Global instance for lazy initialization
_intent_detector = None


def find_intent_using_openai(text: str) -> str:
    """
    Function to find intent from the input audio text using OpenAI.

    Args:
        text: The transcribed text to find intent from.

    Returns:
        JSON: The detected intent JSON.
    """
    global _intent_detector
    if _intent_detector is None:
        _intent_detector = IntentDetector()
    return _intent_detector.detect_intent(text)


CURRENCY_MAP = {
    "inr": "INR", "rs": "INR", "rs.": "INR", "rupees": "INR", "₹": "INR",
    "usd": "USD", "dollars": "USD", "$": "USD",
}

INTENT_KEYWORDS = {
    "check_balance": {
        "keywords": ["balance", "funds", "account balance", "how much money",
            "remaining balance", "available balance", "check my balance"],
        "action": "respond"
    },
    "last_transaction": {
        "keywords": [ "last transaction", "recent transaction", "recent activity",
             "latest transaction", "past transaction"],
        "action": "respond"
    },
    "pay_someone": {
        "keywords": [ "pay", "send money", "transfer", "give money", "make payment",
            "send cash", "remit", "settle up", "send funds"],
        "action": None  # will be decided based on entities
    }
}


def extract_amount_currency(text: str):
    # Match currency before OR after number
    pattern = re.compile(
        r"(rs\.?|inr|₹|\$|usd)?\s*([\d,]+)\s*(rs\.?|inr|₹|\$|usd)?",
        re.IGNORECASE
    )
    match = pattern.search(text)
    if not match:
        return None, None

    amount = int(match.group(2).replace(",", ""))
    raw_currency = match.group(1) or match.group(3)

    if raw_currency:
        currency = CURRENCY_MAP.get(raw_currency.lower().rstrip("."), raw_currency.upper().rstrip("."))
    else:
        currency = None

    return amount, currency


def extract_recipient(text: str) -> Optional[str]:
    """Extract recipient name from text like 'pay 500 to John Doe'."""
    match = re.search(
        r"\bto\s+(?!pay\b|send\b|transfer\b)([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)",
        text,
        re.IGNORECASE
    )
    return match.group(1).capitalize() if match else None


def find_intent_using_regex(text: str) -> Dict[str, Any]:
    text = text.lower().strip()

    intent_data = {
        "intent": "unknown",
        "entities": {"amount": None, "currency": None, "recipient": None},
        "action": "unknown"
    }

    for intent, config in INTENT_KEYWORDS.items():
        if any(keyword in text for keyword in config["keywords"]):
            intent_data["intent"] = intent

            if intent == "pay_someone":
                amount, currency = extract_amount_currency(text)
                recipient = extract_recipient(text)

                intent_data["entities"].update({
                    "amount": amount,
                    "currency": currency,
                    "recipient": recipient
                })

                intent_data["action"] = (
                    "process_payment"
                    if amount and recipient else "ask_for_details"
                )
            else:
                intent_data["action"] = config["action"]

            break

    return {"intent_data": intent_data}
