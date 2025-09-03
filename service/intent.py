from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.schema.runnable.base import RunnableSequence
from template_config import get_intent_template
import logging
from config import open_ai_model_name, open_ai_temperature


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IntentDetector:
    """
    A class responsible for detecting intents from transcribed text using OpenAI.
    """

    def __init__(self):
        """Initialize the IntentDetector with OpenAI model and prompt template."""
        self._model = ChatOpenAI(
            model_name=open_ai_model_name,
            temperature=open_ai_temperature
        )
        self._prompt_template = get_intent_template()
        self._llm_chain = RunnableSequence(self._prompt_template, self._model)

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

        logger.info("Intent detection started")

        try:
            result = self._llm_chain.invoke({"transcribed_text": text})
            logger.info("Intent detection completed successfully")
            return result.content
        except Exception as e:
            logger.error(f"Error occurred during intent detection: {str(e)}")
            return "An error occurred while finding the intent."


_intent_detector = IntentDetector()


def find_intent_using_openai(text: str) -> str:
    """
    Function to find intent from the input audio text using OpenAI.

    Args:
        text: The transcribed text to find intent from.

    Returns:
        JSON: The detected intent JSON.
    """
    return _intent_detector.detect_intent(text)
