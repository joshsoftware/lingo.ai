#import openai
from config import openai_api_key

#openai.api_key = openai_api_key

def translate_text(text):
    prompt = f"Translate the following text from given audio language to English:\n\n{text}"
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that translates text from Indian languages to English."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=150
    )
    translated_text = response.choices[0].message.content
    return translated_text
