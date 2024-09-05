from dotenv import load_dotenv
import whisper
import gradio as gr
import ollama
import logging
from logger import logger
import openai

# Load environment variables
load_dotenv()

# Import configurations and functions from modules
from config import openai_api_key, model_id, model_path
from load_model import load_model
#from extract_entities import extract_entities

openai.api_key = openai_api_key
#Load whisher model
model = load_model(model_id, model_path)


#transcripe the audio to its original language
def process_all_steps(audio):
    #transcription =transcribe(audio)
    translation = translate_with_whisper(audio)
    #translation = translate_with_ollama(transcription)
    #summary = summarize_using_llama(translation)
    summary = summarize_using_openai(translation)
    #return [transcription, translation, summary]
    return [translation, summary]

def transcribe(audio):
    logger.info("Started transciption")
    result = model.transcribe(audio,fp32=False)
    transcription = result["text"]
    return transcription

#translate the audio file to English language using whisper model
def translate_with_whisper(audio): 
    logger.info("Started transciption through whishper")
    options = dict(beam_size=5, best_of=5)
    translate_options = dict(task="translate", **options)
    result = model.transcribe(audio,**translate_options)
    return result["text"]

#translate the text from transciption to English language
def translate_with_ollama(text):
    logger.info("Started transciption through llama")
    response = ollama.generate(model= "llama3.1", prompt = "Translate the following text to English:"+text+"\n SUMMARY:\n")
    translation = response["response"]
    return translation

#Using Ollama and llama3.1 modle, summarize the English translation
def summarize_using_llama(text):
    response = ollama.generate(model= "llama3.1", prompt = "Provide the summary wiht bullet points:"+text+"\n SUMMARY:\n")
    summary = response["response"]
    return summary


#Using openaie, summarize the English translation
def summarize_using_openai(text):
    logger.info("Started summarization")
    prompt = "Summarize the following text: " +text
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts information from Indian multilingual text."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500
        )
        summary  = response.choices[0].message.content
    except Exception as e:
        logger.error(e)
        summary = "Unable to  exract summary"
    return summary
