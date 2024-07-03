import openai
from config import openai_api_key

openai.api_key = openai_api_key

def extract_entities(text):
    prompt = f"""
    The following entities are present in Indian Languages.
    Please extract the following entities from the text.
    Provide entities for both in English and the original language of the audio in well-structured format:

    Text: "{text}"

    - Name:
    - Phone Numbers:
    - Addresses:
    - Email:
    - PIN Code:
    - Occupation:
    - Gender:
    """
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that extracts information from Indian multilingual text."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=200
    )
    entities_text = response.choices[0].message.content

    return entities_text
