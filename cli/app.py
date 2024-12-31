from dotenv import load_dotenv
import whisper
import ollama
import logging
from logger import logger
import openai
import whisper_timestamped as whisper_ts
import json
import datetime

# Load environment variables
load_dotenv()

# Import configurations and functions from modules
from config import openai_api_key, model_id, model_path
from load_model import load_model
#from extract_entities import extract_entities

openai.api_key = openai_api_key
#Load whisher model
model = load_model(model_id, model_path, True)


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
    result = model.transcribe(audio,fp16=False)
    transcription = result["text"]
    return transcription

def transcribe_with_whisper_ts(audio_file):
    audio = whisper_ts.load_audio(audio_file)
    logger.info("Started transciption through whishper")
    #as suggested in the document
    options = dict(beam_size=5, best_of=5, temperature=(0.0, 0.2, 0.4, 0.6, 0.8, 1.0))
    translate_options = dict(task="translate", **options)
    print(datetime.datetime.now())
    result = whisper_ts.transcribe_timestamped(model,audio,condition_on_previous_text=False,vad=True,trust_whisper_timestamps=False,**translate_options)
    print(datetime.datetime.now())
    #result = whisper_ts.transcribe(model, audio)
    return result


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
    response = ollama.generate(model= "llama3.2", prompt = "Translate the following text to English:"+text+"\n SUMMARY:\n")
    translation = response["response"]
    return translation

#Using Ollama and llama3.1 modle, summarize the English translation
def summarize_using_llama(text):
    response = ollama.generate(model= "llama3.2", prompt = "Provide highlights of conversion inbullet points without pretext:"+text+"\n \n")
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

text="It's like a dialogue in a movie. They don't believe if you say you are going to win. They believe only if you say you have won. It's very difficult to get a name in India. If you win in sports, everyone will be able to say the name you have won. How is this situation for you? We have been training for 4 years. In 4 years, I have been to many national meet like this. But at that time, I have only won bronze, silver and gold. In this meet, I have won my first gold. For this, We worked very hard for a year and achieved this success. Superb! How did your journey start? Tell us about your family. I don't have a father in my family. I have only my mother. My mother is a farmer. I have two sisters. When I was in 8th or 9th grade, I ran a school sports relay. At that time, my school PD sir took me to the district division. I won medals in that. But I didn't win medals even at the state level. At that time, I was not doing any training. I went to Koko training after coming to college. I was in Koko training for 3 years. After that, I came to Athletics school. My coach's name is Manikandan Arumugam. I trained with her for 4 years and now I am fully involved in Athletics. Superb! Superb! They say one important thing. No matter what sport you play, if you get angry, you can't win. You were talking about your coach, Manikandan Arumugam, correct? You tell about him. He is also an Athlete Sir. He is working in Southern Railway. He has been medalist for 10 years in National level. He has kept his rank for 10 years."

#Marathi audio
#trasnslation = transcribe_with_whisper_ts("https://utfs.io/f/9ed82ee5-4dd9-4eeb-8f77-9a1dfbf35bc2-gfje9d.mp3")
#Tamil audio
#trasnslation = transcribe_with_whisper_ts("https://utfs.io/f/3c714bc6-f728-48b6-813c-a77a8d281a7e-gfje9d.mp3")
#trasnslation = transcribe_with_whisper_ts("https://utfs.io/f/d3c3c169-02b7-4b70-a3e2-8f62514f5433-gfje9d.mp3")
#out = summarize_using_llama(trasnslation["text"])
out = summarize_using_llama(text)
'''segs = []
seg = {}
segments = trasnslation["segments"]
for segment in segments:
    seg = {"start":segment["start"],"end":segment["end"],"text":segment["text"]}
   
    segs.append(seg)
result = {"text":trasnslation["text"], "segments": segs, "summary":out}
print(result)'''
print(out)
