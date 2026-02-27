# Zaban API path segments (base URL from config). Model name for STT.
ZABAN_API_PATH_STT = "/api/v1/stt"
ZABAN_API_PATH_TRANSLATE = "/api/v1/translate"
ZABAN_STT_MODEL = "whisper"

# Single source of truth: Zaban/BCP-47 -> short code. Reverse (short -> BCP-47)
ZABAN_LANG_TO_CODE = {
    "hin_Deva": "hi", "eng_Latn": "en", "ben_Beng": "bn", "tam_Taml": "ta",
    "tel_Telu": "te", "mar_Deva": "mr", "mal_Mlym": "ml", "kan_Knda": "kn",
    "guj_Gujr": "gu", "pan_Guru": "pa", "ory_Orya": "or", "urd_Arab": "ur",
    "san_Deva": "sa", "asm_Beng": "as",
}

# Short language code -> display name
LANG_MAP = {
    "en": "English", "hi": "Hindi", "bn": "Bengali", "ta": "Tamil", "te": "Telugu",
    "mr": "Marathi", "ml": "Malayalam", "kn": "Kannada", "gu": "Gujarati", "pa": "Punjabi",
    "or": "Odia", "ur": "Urdu", "sa": "Sanskrit", "ar": "Arabic", "fr": "French",
    "de": "German", "es": "Spanish", "it": "Italian", "pt": "Portuguese", "zh": "Chinese",
    "ja": "Japanese", "ko": "Korean", "ru": "Russian", "sv": "Swedish", "pl": "Polish",
    "tr": "Turkish", "cs": "Czech", "fi": "Finnish", "he": "Hebrew",
}
