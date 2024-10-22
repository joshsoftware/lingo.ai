from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.schema.runnable.base import RunnableSequence
from template_config import get_summarization_template

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
    
    print("Summarization Started")
    try:
        # Run the chain with the conversation text
        
        summary = llm_chain.invoke({"conversation_text": text})
        print("Summarization Completed")
        return summary.content
    except Exception as e:
        print(f"Error occurred during summarization: {str(e)}")
        return "An error occurred while summarizing the text."
    
