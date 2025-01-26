import json
import os
import re
from typing import BinaryIO
import uuid
import ollama
import faster_whisper
import torch
import torchaudio
from nemo.collections.asr.models.msdd_models import NeuralDiarizer

from ctc_forced_aligner import (
    generate_emissions,
    get_alignments,
    get_spans,
    load_alignment_model,
    postprocess_results,
    preprocess_text,
)

from conversation_diarization.helpers import (
    deleteFileOrDir,
    create_config,
    get_sentences_speaker_mapping,
    get_speaker_aware_transcript,
    get_words_speaker_mapping,
    langs_to_iso,
)
from utils.prompt import QNA_PROMPT_MESSAGE, CONVERSATION_PROMPT_MESSAGE
from conversation_diarization.request import InterviewAnalysisRequest
from utils.constants import LLM, TEMPERATURE, WHISPER_BATCH_SIZE

COMPUTING_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
WHISPER_MODEL = "medium.en"
mtypes = {"cpu": "int8", "cuda": "float16"}

def create_prompt(transcription: str, type: str) -> str:
    if type == "qna":
        return QNA_PROMPT_MESSAGE.replace("<TRANSCRIPTION>", transcription)
    elif type == "conversation":
        return CONVERSATION_PROMPT_MESSAGE.replace("<TRANSCRIPTION>", transcription)

def transcribe_audio(audio: str | BinaryIO, translate: bool = False):
    # Transcribe the audio file
    whisper_model = faster_whisper.WhisperModel(
        WHISPER_MODEL,
        device=COMPUTING_DEVICE,
        compute_type=mtypes[COMPUTING_DEVICE]
    )
    whisper_pipeline = faster_whisper.BatchedInferencePipeline(whisper_model)
    audio_waveform = faster_whisper.decode_audio(audio)
    audio_waveform_tensors = torch.from_numpy(audio_waveform)

    transcript_segments, transcript_info = whisper_pipeline.transcribe(
        audio_waveform,
        batch_size=WHISPER_BATCH_SIZE,
        task="translate" if translate else "transcribe"
    )

    full_transcript = "".join(segment.text for segment in transcript_segments)

    # clear gpu vram
    del whisper_model, whisper_pipeline
    # torch.cuda.empty_cache()
    
    return {
        "audio_waveform": audio_waveform,
        "audio_waveform_tensors": audio_waveform_tensors,
        "transcript_segments": transcript_segments,
        "transcript_info": transcript_info,
        "full_transcript": full_transcript
    }

def transcription_with_speaker_diarization(request: InterviewAnalysisRequest):
    """
    Method to transcribe the audio, with speaker diarization using Faster Whisper, NeMo and ForceAligner.
    :param audio_link: The conversation text to be transcribed.
    :return: Transcribed text.
    """
    
    # Generate unique session directory
    session_id = str(uuid.uuid4())
    session_path = os.path.join("service/conversation_diarization/temp_outputs", session_id)
    os.makedirs(session_path, exist_ok=True)

    AUDIO_FILE_PATH = request.interview_link

    # Transcribe the audio file
    transcription_result = transcribe_audio(request.interview_link)
    audio_waveform = transcription_result["audio_waveform"]
    audio_waveform_tensors = transcription_result["audio_waveform_tensors"]
    transcript_segments = transcription_result["transcript_segments"]
    transcript_info = transcription_result["transcript_info"]
    full_transcript = transcription_result["full_transcript"]
    

    # Forced Alignment
    alignment_model, alignment_tokenizer = load_alignment_model(
        COMPUTING_DEVICE,
        dtype=torch.float16 if COMPUTING_DEVICE == "cuda" else torch.float32,
    )

    emissions, stride = generate_emissions(
        alignment_model,
        audio_waveform_tensors.to(alignment_model.dtype).to(alignment_model.device),
        batch_size=WHISPER_BATCH_SIZE
    )

    # clear gpu vram
    del alignment_model
    # torch.cuda.empty_cache()

    tokens_starred, text_starred = preprocess_text(
        full_transcript,
        romanize=True,
        language=langs_to_iso[transcript_info.language],
    )

    segments, scores, blank_token = get_alignments(
        emissions,
        tokens_starred,
        alignment_tokenizer,
    )

    spans = get_spans(tokens_starred, segments, blank_token)

    word_timestamps = postprocess_results(text_starred, spans, stride, scores)

    # Convert audio to mono for NeMo compatibility
    mono_audio_path = os.path.join(session_path, "mono_file.wav")
    torchaudio.save(
        mono_audio_path,
        audio_waveform_tensors.cpu().unsqueeze(0).float(),
        16000
    )


    # Initialize NeMo MSDD diarization model
    msdd_model = NeuralDiarizer(cfg=create_config(session_path)).to(COMPUTING_DEVICE)
    msdd_model.diarize()

    # clear gpu vram
    del msdd_model
    # torch.cuda.empty_cache()

    # Reading timestamps <> Speaker Labels mapping
    speaker_ts = []
    rttm_path = os.path.join(session_path, "pred_rttms", "mono_file.rttm")
    with open(rttm_path, "r") as f:
        lines = f.readlines()
        for line in lines:
            line_list = line.split(" ")
            s = int(float(line_list[5]) * 1000)
            e = s + int(float(line_list[8]) * 1000)
            speaker_ts.append([s, e, int(line_list[11].split("_")[-1])])

    wsm = get_words_speaker_mapping(word_timestamps, speaker_ts, "start")
    ssm = get_sentences_speaker_mapping(wsm, speaker_ts)
    
    # Cleanup after processing
    deleteFileOrDir(session_path)
    # torch.cuda.empty_cache()
    
    processed_transcript = get_speaker_aware_transcript(ssm)
    
    prompt = create_prompt(processed_transcript, "qna")
            
    response = ollama.chat(
        model=LLM,
        options={"temperature": TEMPERATURE},
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = response.get("message", {}).get("content", "")
    response_text_json = re.search(r"\{.*\}", response_text, re.DOTALL)
    
    if response_text_json:
        try:
            response_text_json = json.loads(response_text_json.group())
        except json.JSONDecodeError as e:
            response_text_json = None
    else:
        response_text_json = None
    
    return {
        "transcript": full_transcript,
        "conversation": processed_transcript,
        "qna": response_text_json
    }
