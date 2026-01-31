from scipy import misc


# @misc{lintoai2023whispertimestamped,
#   title={whisper-timestamped},
#   author={Louradour, J{\'e}r{\^o}me},
#   journal={GitHub repository},
#   year={2023},
#   publisher={GitHub},
#   howpu@misc{lintoai2023whispertimestamped,
#   title={whisper-timestamped},
#   author={Louradour, J{\'e}r{\^o}me},
#   journal={GitHub repository},
#   year={2023},
#   publisher={GitHub},
#   howpublished = {\url{https://github.com/linto-ai/whisper-timestamped}}
# }
# @article{radford2022robust,
#   title={Robust speech recognition via large-scale weak supervision},
#   author={Radford, Alec and Kim, Jong Wook and Xu, Tao and Brockman, Greg and McLeavey, Christine and Sutskever, Ilya},
#   journal={arXiv preprint arXiv:2212.04356},
#   year={2022}
# }
# @article{JSSv031i07,\
#   title={Computing and Visualizing Dynamic Time Warping Alignments in R: The dtw Package},
#   author={Giorgino, Toni},
#   journal={Journal of Statistical Software},
#   year={2009},
#   volume={31},
#   number={7},
#   doi={10.18637/jss.v031.i07}
# }
from fastapi import  HTTPException, UploadFile
import openai
from dotenv import load_dotenv
from config import openai_api_key, model_id, model_path, zaban_base_url, zaban_api_key
from load_model import load_model
import logging
import whisper_timestamped as whisper_ts
import requests
from urllib.parse import urlparse
import tempfile
import os

# Map Zaban/BCP-47 language codes to short codes (e.g. hin_Deva -> hi)
ZABAN_LANG_TO_CODE = {
    "hin_Deva": "hi", "eng_Latn": "en", "ben_Beng": "bn", "tam_Taml": "ta",
    "tel_Telu": "te", "mar_Deva": "mr", "mal_Mlym": "ml", "kan_Knda": "kn",
    "guj_Gujr": "gu", "pan_Guru": "pa", "ory_Orya": "or", "urd_Arab": "ur",
    "san_Deva": "sa",
}

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
openai.api_key = openai_api_key
#Load whisher model
logger.info("Loading model...")
model = load_model(model_id, model_path=model_path, is_ts=True)

def validate_audio_url(url):
    """Validate if the URL is accessible and returns audio content."""
    try:
        # Check if URL is well-formed
        result = urlparse(url)
        if not all([result.scheme, result.netloc]):
            raise ValueError("Invalid URL format")

        # Check if URL is accessible
        response = requests.head(url, timeout=5)
        if response.status_code != 200:
            raise HTTPException(
                status_code=404,
                detail=f"Audio file not found. Server returned status code: {response.status_code}"
            )

    except requests.RequestException as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error accessing audio file: {str(e)}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


#translate the audio file to English language using whisper model
def translate_with_whisper(audioPath):
    """Translate audio file to English language using whisper model."""
    logger.info("Translation started")
    try:
        validate_audio_url(audioPath)
        options = dict(beam_size=5, best_of=5)
        translate_options = dict(task="translate", **options)
        result = model.transcribe(audioPath, **translate_options)
        return result["text"]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )

#translate the audio file to English language using whisper timestamp model
def translate_with_whisper_timestamped(audioPath):
    """Translate audio file to English language using whisper timestamp model."""
    logger.info("Translation started")
    try:
        validate_audio_url(audioPath)
        options = dict(beam_size=5, best_of=5, temperature=(0.0, 0.2, 0.4, 0.6, 0.8, 1.0))
        translate_options = dict(task="translate", **options)
        result = whisper_ts.transcribe_timestamped(
            model,
            audioPath,            
            condition_on_previous_text=False,
            vad=False,
            trust_whisper_timestamps=False,
            **translate_options
        )
        
        # Extract detected language
        detected_language = (
            result.get('language') or 
            result.get('detected_language') or 
            'unknown'
        )
        
        # Check if language_probs exists
        if 'language_probs' in result:
            logger.info("Language probabilities: %s", result['language_probs'])
        
        return {
            "text": result.get("text", ""),
            "segments": result.get("segments", []),
            "detected_language": detected_language,
            "transcription_result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )

def _zaban_lang_to_code(lang: str) -> str:
    """Normalize Zaban/BCP-47 language to short code (e.g. hin_Deva -> hi)."""
    if not lang:
        return "en"
    key = lang.strip()
    if key in ZABAN_LANG_TO_CODE:
        return ZABAN_LANG_TO_CODE[key]
    if len(key) <= 3:
        return key
    # BCP-47 style: take first 2 chars of script part (e.g. hin_Deva -> hin -> hi)
    prefix = key.split("_")[0]
    if len(prefix) >= 2:
        return prefix[:2]
    return "en"


def translate_with_whisper_from_upload(upload_file: UploadFile):
    """Transcribe uploaded audio via Zaban STT. Returns (id, [_, text], [_, lang_code], _) for main.py compatibility."""
    logger.info("STT from upload started (Zaban)")
    temp_file_path = None
    try:
        # Create a temporary file with the original file extension
        file_extension = os.path.splitext(upload_file.filename)[1] if upload_file.filename else ".wav"
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file_path = temp_file.name
            # Write uploaded file content to temporary file
            content = upload_file.file.read()
            temp_file.write(content)
            temp_file.flush()

        if not temp_file_path:
            return (None, [None, "Unclear command"], [None, "en"], None)

        url = f"{zaban_base_url.rstrip('/')}/api/v1/stt"
        headers = {}
        if zaban_api_key:
            headers["X-API-Key"] = zaban_api_key
        with open(temp_file_path, "rb") as audio_file:
            files = {"audio": (upload_file.filename or "audio.wav", audio_file, "audio/wav")}
            data = {"model": "whisper"}
            r = requests.post(url, files=files, data=data, headers=headers, timeout=60)
        r.raise_for_status()
        result = r.json()
        text = result.get("text", "").strip() or "Unclear command"
        raw_lang = result.get("language", "en")
        lang_code = _zaban_lang_to_code(raw_lang)
        # main.py expects: id, response, lang, dia = ...; response[1] = text; lang[1] = language
        return (None, [None, text], [None, lang_code], None)
    except requests.RequestException as e:
        logger.error(f"Zaban STT request failed: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"Speech-to-text failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Translation from upload failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Translation from upload failed: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to delete temporary file {temp_file_path}: {str(e)}")
