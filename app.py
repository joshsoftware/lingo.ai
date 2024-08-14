import streamlit as st
st.set_page_config(layout="wide")
from dotenv import load_dotenv
import os
import numpy as np
import librosa
import io
#import openai
import  whisper
# Import configurations and functions from modules
from config import openai_api_key, model_id, model_path
from load_model import load_model
from transcribe_audio import transcribe_audio
from extract_entities import extract_entities
from translate_text import translate_text  # Assuming this is where you translate text

# Load environment variables
load_dotenv()

# Set OpenAI API key
#openai.api_key = openai_api_key

# Initialize session state variables
if "transcription_text" not in st.session_state:
    st.session_state.transcription_text = ""
if "summary" not in st.session_state:
    st.session_state.summary = ""
if "detailed_transcription" not in st.session_state:
    st.session_state.detailed_transcription = ""
if "show_detailed" not in st.session_state:
    st.session_state.show_detailed = False

# Main function to run the Streamlit app
def main():
    st.markdown("<h1 style='text-align: center;'>Speech to Text App</h1>", unsafe_allow_html=True)

    # Load the Whisper model
    st.write(model_id)
    model = load_model(model_id, model_path)

    # File uploader for audio files
    st.write("Upload an audio file:")
    audio_file = st.file_uploader("Select an audio", type=["mp3", "wav"])

    audio_data = None

    if audio_file:
        # Process uploaded audio file
        audio_bytes = audio_file.read()
        st.audio(audio_bytes)
        audio_file = io.BytesIO(audio_bytes)
        try:
            audio_data, _ = librosa.load(audio_file, sr=18000)
        except Exception as e:
            st.error(f"Error loading audio file: {e}")
    result = model.transcribe(audio_data)
	#result = model.transcribe(audio_data)
    st.session_state_detailed_transcription = result.text
    # Perform transcription and other tasks on button click
    #if audio is not None and st.button("Transcribe"):
        #with st.spinner("Transcribing audio..."):
            #try:
                #st.session_state.transcription_text = transcribe_audio(model, audio_data)

                #with st.spinner("Summarizing..."):
                    #summary, detailed_transcription = extract_entities(st.session_state.transcription_text)
                    #st.session_state.summary = summary
                    #st.session_state.detailed_transcription = st.session_state.transcription_text
                    #st.session_state.show_detailed = False
                    #st.rerun()
            #except Exception as e:
                #st.error(f"Error during transcription or entity extraction: {e}")

    # display summary
    #if st.session_state.summary:
        #st.write("**Summary:**")
        #translated_summary = translate_text(st.session_state.summary)
        #st.markdown(translated_summary.replace("\n", "  \n"))

    # Button
    if st.session_state.summary and st.button("View detailed transcription"):
        st.session_state.show_detailed = True
        st.rerun()

    # display detailed transcription
    if st.session_state.show_detailed:
        st.write("Detailed view:")
        st.write("**Original language:**")
        st.markdown(st.session_state.detailed_transcription.replace("\n", "  \n"))
        st.write("**Translated to English:**")
        translated_detailed = translate_text(st.session_state.detailed_transcription)
        st.markdown(translated_detailed.replace("\n", "  \n"))

if __name__ == "__main__":
    main()
