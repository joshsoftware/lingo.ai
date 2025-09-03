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
from config import openai_api_key, model_id, model_path
from load_model import load_model
import logging
import whisper_timestamped as whisper_ts
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
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )

def translate_with_whisper_from_upload(upload_file: UploadFile):
    """Translate uploaded audio file to English language using whisper model (without timestamps)."""
    logger.info("Translation from upload started")
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
        
        # Process the temporary file with regular whisper (no timestamps)
        options = dict(beam_size=5, best_of=5)
        translate_options = dict(task="translate", **options)
        result = model.transcribe(temp_file_path, **translate_options)
        return result["text"]
        
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
