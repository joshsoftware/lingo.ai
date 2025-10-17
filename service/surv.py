from sarvamai import SarvamAI


#SARVAM_API_KEY="sk_lz33toms_amJdXnvyWxlBQIs4OPue1yexi"
SARVAM_API_KEY="sk_t7fvsjjb_7JsD5ZXGrEhHqjUtAQSFsCxB"
client = SarvamAI(
    api_subscription_key=SARVAM_API_KEY,
)

response = client.text.translate(
    #input="Please confirm your the transaction 10by entring the OTP you have recieved on your registered mobile number"
    input="Please confirm the transaction ₹10.00 to Suresh Patil by entering the OTP you have recieved on your registered mobile number",
    source_language_code="auto",
    target_language_code="hi-IN",
    speaker_gender="Female",
    numerals_format="native"
)
print(response)
'''
response = client.text_to_speech.convert(
    text="Your account balacne is 2000.35",
    target_language_code="ta-IN",

)
print(response)
'''
