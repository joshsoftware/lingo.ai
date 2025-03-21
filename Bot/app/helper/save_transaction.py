import requests
import app.core.config as config

def save_transcription(response, document_url, document_name):
    # Prepare the payload
    # import pdb; pdb.set_trace()
    payload = {
        "documentUrl": document_url,
        "userID": config.USER_ID,
        "documentName": document_name,
        "summary": response["summary"],
        "translation": response["translation"],
        "audioDuration": response.get("audioDuration", 0),  # Assuming you might add this later
        "segments": response["segments"]
    }
    
    # API endpoint
    endpoint = "https://lingo.ai.joshsoftware.com/api/transcribe/save"
    
    # Send the POST request
    try:
        res = requests.post(endpoint, json=payload)
        res.raise_for_status()  # Raise an exception for HTTP errors (4xx, 5xx)
        return res.json()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None



