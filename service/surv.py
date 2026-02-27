"""Example: text translation via detect_intent.translate (Ollama). No Sarvam."""
from detect_intent import translate

# Uses Ollama (ollama_translation_model_name) for text translation
message = (
    "Please confirm the transaction ₹10.00 to Suresh Patil by entering the OTP "
    "you have received on your registered mobile number"
)
response = translate(message, "hi")
print(response)

# For TTS (text-to-speech), call Zaban TTS API:
#   POST {ZABAN_BASE_URL}/api/v1/tts with X-API-Key, JSON body: {"text": "...", "language": "hi"}
#   Returns WAV bytes.
