import openai
from config import openai_api_key

openai.api_key = openai_api_key

def extract_entities(text):
    prompt = f"""
    The following entities are present in Indian Languages.
    Please extract the following entities from the text:
    Name, pin code, phone number, gender, occupation, and address.

    Provide the summary of the text in exact below format:
    Name is ......., pin code is ........, phone number is ........, gender is ........, occupation is ........, Address is ............ .

    Text: "{text}"
    
    Summary:


    Detailed view:

    Original language: {text}

    Text: "{text}"
    
    Summary:

    Detailed view:

    Original language: {text}

    """

    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts information from Indian multilingual text."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500
        )
        response_text = response.choices[0].message.content
    except Exception as e:
        return f"Error during OpenAI API call: {e}", "Detailed view not available."

    # Process the response to extract summary and detailed transcription
    if "Detailed view:" in response_text:
        parts = response_text.split("Detailed view:")
        summary_part = parts[0].strip()
        detailed_transcription_part = parts[1].strip()
    else:
        summary_part = response_text.strip()
        detailed_transcription_part = "Detailed view not provided."

    # Format the summary and detailed transcription
    formatted_summary = format_summary(summary_part)
    formatted_detailed_transcription = format_detailed_transcription(detailed_transcription_part)

    return formatted_summary, formatted_detailed_transcription

def format_summary(summary):
    # Process the summary to remove unnecessary parts
    lines = summary.split('\n')
    summary_lines = []
    is_summary_section = False

    for line in lines:
        line = line.strip()
        if line.startswith("Summary:"):
            is_summary_section = True
            continue
        if is_summary_section:
            summary_lines.append(line)
    
    formatted_summary = ' '.join(summary_lines)
    return formatted_summary

def format_detailed_transcription(detailed_transcription):
    # Process the detailed transcription to ensure proper formatting
    lines = detailed_transcription.split('\n')
    detailed_lines = [line.strip() for line in lines if line.strip()]
    formatted_detailed_transcription = '\n'.join(detailed_lines)
    return formatted_detailed_transcription
