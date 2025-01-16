import os
import tempfile
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
from fastapi import UploadFile
import openai
from dotenv import load_dotenv
from config import openai_api_key, model_id, model_path
from load_model import load_model
import logging
import whisper_timestamped as whisper_ts

logging.basicConfig(level=logging.INFO)  # Set the logging level
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
openai.api_key = openai_api_key
#Load whisher model
logger.info("Loading model...")
model = load_model(model_id, model_path=model_path,is_ts=True)

#translate the audio file to English language using whisper model
def translate_with_whisper(audioPath):
    logger.info("translation started")
    options = dict(beam_size=5, best_of=5)
    translate_options = dict(task="translate", **options)
    
    if isinstance(audioPath, str):
        # If input is a file path, use it directly
        result = model.transcribe(audioPath, **translate_options)
    else:
        # Handle file-like object: Save it to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(audioPath.read())
            temp_file_path = temp_file.name

        try:
            # Pass the temporary file path to Whisper
            result = model.transcribe(temp_file_path, **translate_options)
        finally:
            # Clean up the temporary file
            os.remove(temp_file_path)

    return result["text"]

#translate the audio file to English language using whisper timestamp model
def translate_with_whisper_timestamped(audioPath):
    logger.info("translation started")
    options = dict(beam_size=5, best_of=5, temperature=(0.0, 0.2, 0.4, 0.6, 0.8, 1.0))
    translate_options = dict(task="translate", **options)
    result = whisper_ts.transcribe_timestamped(model,audioPath,condition_on_previous_text=False,trust_whisper_timestamps=False,**translate_options)
    return result

