from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.schema.runnable.base import RunnableSequence
from template_config import get_summarization_template
import logging
import ollama

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI model and LLMChain globally for reuse
model = ChatOpenAI(
    model_name="gpt-4",  # Specify GPT-4 model
    temperature=0.2  # Adjust temperature for deterministic responses
)

# Get the template from template_config
prompt_template = get_summarization_template()

# Create the LLMChain globally
llm_chain = RunnableSequence(prompt_template, model)

def summarize_using_openai(text):
    """
    Function to summarize the input conversation text using OpenAI.
    :param text: The conversation text to be summarized.
    :return: Summarized text.
    """
    if not text or len(text.strip()) == 0:
        return "The conversation text is empty. Please provide valid input."
    
    logger.info("summary started")
    try:
        # Run the chain with the conversation text
        
        summary = llm_chain.invoke({"conversation_text": text})
        return summary.content
    except Exception as e:
        logger.error(f"Error occurred during summarization: {str(e)}")
        return "An error occurred while summarizing the text."

#Using Ollama and llama3.2 model, summarize the English translation
def summarize_using_ollama(text):
    response = ollama.generate(model= "llama3.2", prompt = "Provide highlights of conversion inbullet points  without pretext:"+text+"\n \n")
    summary = response["response"]
    return summary    
