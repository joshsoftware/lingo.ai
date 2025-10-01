from sarvamai import SarvamAI
from dotenv import load_dotenv
from config import sarvam_api_key


#SARVAM_API_KEY="sk_lz33toms_amJdXnvyWxlBQIs4OPue1yexi"
SARVAM_API_KEY="sk_t7fvsjjb_7JsD5ZXGrEhHqjUtAQSFsCxB"
print(sarvam_api_key)
client = SarvamAI(
    api_subscription_key=SARVAM_API_KEY,
)

response = client.text.translate(
    input="Your current account balance is 2000.35",
    source_language_code="auto",
    target_language_code="ta-IN",
    speaker_gender="Male"
)
print(response)
response = client.text_to_speech.convert(
    text="Your account balacne is 2000.35",
    target_language_code="ta-IN",

)
print(response)

