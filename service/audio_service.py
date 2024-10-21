from fastapi import UploadFile
import openai
from dotenv import load_dotenv
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.chat_models import ChatOpenAI
from config import openai_api_key, model_id, model_path
from load_model import load_model

# Load environment variables
load_dotenv()
openai.api_key = openai_api_key
#Load whisher model
print("model loading...")
model = load_model(model_id, model_path)

#translate the audio file to English language using whisper model
def translate_with_whisper(audioPath): 
    print("Translation Started")
    options = dict(beam_size=5, best_of=5)
    translate_options = dict(task="translate", **options)
    result = model.transcribe(audioPath,**translate_options)
    print("Translation Completed")
    return result["text"]

#Using openaie, summarize the English translation
def summarize_using_openai(text):
    print("Summrization Started")
    try:
        # Construct the prompt template for summarizing the conversation
        template = """Please summarize the following conversation between two people. Focus on the main points and key takeaways, avoiding unnecessary details and repetitions: 
        {conversation_text}"""

        # Create the PromptTemplate object
        prompt_template = PromptTemplate(
            input_variables=["conversation_text"],  # Placeholder for dynamic input
            template=template
        )

        # Define the conversation text (can be dynamic or a variable in your code)
        conversation_text = text  # Assuming 'text' contains the conversation

        # Initialize OpenAI model with Langchain
        llm = ChatOpenAI(
            model_name="gpt-4",  # Specify GPT-4 model
            temperature=0.2  # Adjust temperature for more deterministic responses
        )

        # Create an LLMChain to link the prompt template and the LLM model
        llm_chain = LLMChain(
            llm=llm,
            prompt=prompt_template
        )

        # Run the chain with your conversation text
        summary = llm_chain.run({"conversation_text": conversation_text})
        print("Summarization Completed")
        return summary

    except Exception as e:
        print("Error",e)
        summary = "Unable to  exract summary"
    return summary
