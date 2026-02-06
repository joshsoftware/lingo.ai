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
from constants import ZABAN_LANG_TO_CODE, ZABAN_API_PATH_STT, ZABAN_STT_MODEL
from load_model import load_model
import logging
import requests
from urllib.parse import urlparse
import tempfile
import os

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

# Transcribe via Zaban STT (model=whisper) with segment timestamps. Used for URL audio.
def translate_with_whisper_timestamped(audio_url: str, translate_to_english: bool = True):
    """
    Transcribe audio from URL via Zaban STT: send link directly (no download).

    By default, uses `translate_to_english=True` to mirror previous whisper_ts behaviour:
    English text + segment timestamps, while still allowing callers to opt-out.
    Returns dict with text, segments, detected_language.
    """
    logger.info("Transcription started (Zaban)")
    try:
        validate_audio_url(audio_url)
        return _transcribe_with_zaban_by_url(audio_url, translate_to_english=translate_to_english)
    except HTTPException:
        raise
    except requests.RequestException as e:
        logger.error(f"Zaban STT request failed: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"Transcription failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
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


def _normalize_segments(segments: list) -> list:
    """Normalize Zaban/whisper segments to {start, end, text}."""
    if not segments:
        return []
    out = []
    for s in segments:
        if isinstance(s, dict):
            out.append({
                "start": float(s.get("start", 0)),
                "end": float(s.get("end", 0)),
                "text": s.get("text", ""),
            })
        else:
            out.append({"start": 0.0, "end": 0.0, "text": str(s)})
    return out


def _parse_zaban_stt_response(result: dict, translate_to_english: bool = False) -> dict:
    """
    Parse Zaban STT JSON response into unified dict with text, segments, detected_language, language.

    When translate_to_english is True and the backend returns `translated_text` / `target_lang`,
    we surface the English translation as `text` to preserve previous whisper_ts behaviour.
    """
    if translate_to_english and result.get("translated_text"):
        # Prefer translated text and target language if available
        text = result.get("translated_text", "").strip() or result.get("text", "").strip() or ""
        raw_lang = result.get("target_lang", "eng_Latn")
    else:
        text = result.get("text", "").strip() or ""
        raw_lang = result.get("language", "en")
    lang_code = _zaban_lang_to_code(raw_lang)
    segments = _normalize_segments(result.get("segments", []))
    return {
        "text": text,
        "segments": segments,
        "detected_language": raw_lang,
        "language": lang_code,
    }


def _transcribe_with_zaban_by_url(audio_url: str, translate_to_english: bool = True) -> dict:
    """
    Transcribe audio via Zaban STT by sending the audio URL (no download).
    POST JSON with audio_url and model=whisper. Returns same shape as _transcribe_with_zaban.
    """
    url = f"{zaban_base_url.rstrip('/')}{ZABAN_API_PATH_STT}"
    headers = {"Content-Type": "application/json"}
    if zaban_api_key:
        headers["X-API-Key"] = zaban_api_key
    payload = {
        "audio_url": audio_url,
        "model": ZABAN_STT_MODEL,
        # Preserve previous whisper_ts semantics: translate to English by default
        "translate_to_english": translate_to_english,
    }
    r = requests.post(url, json=payload, headers=headers, timeout=300)
    r.raise_for_status()
    result = r.json()
    return _parse_zaban_stt_response(result, translate_to_english=translate_to_english)


def _transcribe_with_zaban(audio_path: str, filename: str = "audio.wav", translate_to_english: bool = True) -> dict:
    """
    Transcribe audio file via Zaban STT (model=whisper). Used for upload flow.
    Returns dict with text, segments (whisper-style timestamps), detected_language.
    """
    url = f"{zaban_base_url.rstrip('/')}{ZABAN_API_PATH_STT}"
    headers = {}
    if zaban_api_key:
        headers["X-API-Key"] = zaban_api_key
    with open(audio_path, "rb") as audio_file:
        files = {"audio": (filename, audio_file, "audio/wav")}
        data = {
            "model": ZABAN_STT_MODEL,
            # For upload flow we default to transcription-only unless explicitly changed
            "translate_to_english": str(translate_to_english).lower(),
        }
        r = requests.post(url, files=files, data=data, headers=headers, timeout=300)
    r.raise_for_status()
    result = r.json()
    return _parse_zaban_stt_response(result, translate_to_english=translate_to_english)


def translate_with_whisper_from_upload(upload_file: UploadFile):
    """Transcribe uploaded audio via Zaban STT (English + whisper timestamps). Returns (id, [_, text], [_, lang_code], _) for main.py compatibility."""
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

        data = _transcribe_with_zaban(temp_file_path, upload_file.filename or "audio.wav", translate_to_english=True)
        text = data["text"] or "Unclear command"
        lang_code = data["language"]
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
