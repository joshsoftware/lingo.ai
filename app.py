# import numpy as np
# import streamlit as st
# import sys
# import torch
# import whisper
# import librosa
# import os
# import io


# @st.cache_resource
# def load_model(model_id, model_path):
#     # Check if two command-line arguments are provided
#     if len(sys.argv) != 3:
#         print("Usage: python app.py <whisper_model_id> <whisper_model_output_path>")
#         print("Example: python app.py large-v3 /workspace/whisper-model/")
#         sys.exit(1)

#     # Check if the model path ends with '/'
#     if not model_path.endswith('/'):
#         model_path += '/'

#     # Get complete model file path
#     model_path = f'{model_path}{model_id}/{model_id}.pt'

#     # Define available device (CPU/GPU)
#     device = "cuda" if torch.cuda.is_available() else "cpu"

#     # Load model on available device
#     model = whisper.load_model(model_path, device=device)

#     # Display model's parameters in the app's logs
#     print(
#         f"Model will be run on {device}\n"
#         f"Model is {'multilingual' if model.is_multilingual else 'English-only'} "
#         f"and has {sum(np.prod(p.shape) for p in model.parameters()):,} parameters."
#     )

#     return model


# def main():
#     # Display Ttitle                
#     st.title("Whisper - Speech to Text App")
                                            
#     # Get args                              
#     model_id = os.environ.get('MODEL_ID')   
#     model_path = os.environ.get('MODEL_PATH')
                                             
#     model = load_model(model_id, model_path) 
                                             
#     # Upload audio file widget               
#     audio_file = st.file_uploader("Upload an audio file", type=["mp3", "wav"])
                                                                                                                                    
#     transcript = {"text": "The audio file could not be transcribed :("}     
#     options = dict(beam_size=5, best_of=5)                 
#     transcribe_options = dict(task="transcribe", **options)          
                                                                     
#     # Audio player                                                   
#     if audio_file:                                           
#         # Read file content                                
#         audio_file = audio_file.read()
#         st.audio(audio_file)          
                                      
#         # Convert bytes to a file-like object using io.BytesIO
#         audio_file = io.BytesIO(audio_file)                   
                                                              
#         # Convert to numpy array                              
#         audio_file, _ = librosa.load(audio_file)              
                                                
#         # Transcribe audio on button click      
#         if st.button("Transcribe"):             
#             with st.spinner("Transcribing audio..."):
#                 transcript = model.transcribe(audio_file, **transcribe_options)
#             st.write(transcript["text"])                                       


# if __name__ == "__main__":                                                     
#     main()



# import numpy as np
# import streamlit as st
# import torch
# import whisper
# import librosa
# import os
# import io

# # Use the cache decorator from Streamlit
# @st.cache(allow_output_mutation=True)
# def load_model(model_id, model_path):
#     # Define available device (CPU/GPU)
#     device = "cuda" if torch.cuda.is_available() else "cpu"

#     # Load model on available device
#     model = whisper.load_model(model_id, device=device, download_root=model_path)

#     # Display model's parameters in the app's logs
#     print(
#         f"Model will be run on {device}\n"
#         f"Model is {'multilingual' if model.is_multilingual else 'English-only'} "
#         f"and has {sum(np.prod(p.shape) for p in model.parameters()):,} parameters."
#     )

#     return model

# def main():
#     # Display title                
#     st.title("Whisper - Speech to Text App")
                                            
#     # Set up environment variables for model ID and path
#     model_id = os.environ.get('MODEL_ID', 'large-v3')  # Default to 'large-v3' if not set
#     model_path = os.environ.get('MODEL_PATH', 'whisper_model')  # Default path if not set

#     model = load_model(model_id, model_path)
                                             
#     # Upload audio file widget               
#     audio_file = st.file_uploader("Upload an audio file", type=["mp3", "wav"])
                                                                                                                                    
#     transcript = {"text": "The audio file could not be transcribed :("}     
#     options = dict(beam_size=5, best_of=5)                 
#     transcribe_options = dict(task="transcribe", **options)          
                                                                     
#     # Audio player                                                   
#     if audio_file:                                           
#         # Read file content                                
#         audio_bytes = audio_file.read()
#         st.audio(audio_bytes)          
                                      
#         # Convert bytes to a file-like object using io.BytesIO
#         audio_file = io.BytesIO(audio_bytes)                   
                                                              
#         # Convert to numpy array                              
#         audio_data, _ = librosa.load(audio_file, sr=None)              
                                                
#         # Transcribe audio on button click      
#         if st.button("Transcribe"):             
#             with st.spinner("Transcribing audio..."):
#                 transcript = model.transcribe(audio_data, **transcribe_options)
#             st.write(transcript["text"])                                       

# if __name__ == "__main__":                                                     
#     main()



# import numpy as np
# import streamlit as st
# import torch
# import whisper
# import librosa
# import os
# import io

# # Use the cache decorator from Streamlit
# @st.cache(allow_output_mutation=True)
# def load_model(model_id, model_path):
#     # Define available device (CPU/GPU)
#     device = "cuda" if torch.cuda.is_available() else "cpu"

#     # Load model on available device
#     model = whisper.load_model(model_id, device=device, download_root=model_path)

#     # Display model's parameters in the app's logs
#     print(
#         f"Model will be run on {device}\n"
#         f"Model is {'multilingual' if model.is_multilingual else 'English-only'} "
#         f"and has {sum(np.prod(p.shape) for p in model.parameters()):,} parameters."
#     )

#     return model

# def main():
#     # Display title                
#     st.title("Whisper - Speech to Text App")
                                            
#     # Set up environment variables for model ID and path
#     model_id = os.environ.get('MODEL_ID', 'large-v3')  # Default to 'large-v3' if not set
#     model_path = os.environ.get('MODEL_PATH', 'whisper_model')  # Default path if not set

#     model = load_model(model_id, model_path)

#     # Add a selectbox for language selection
#     languages = ['hi', 'bn', 'te', 'mr', 'ta', 'ur', 'gu', 'kn', 'ml', 'pa']  # List of Indian language codes
#     language = st.selectbox("Select the language of the audio file", languages, index=0)
    
#     # Upload audio file widget               
#     audio_file = st.file_uploader("Upload an audio file", type=["mp3", "wav"])

#     transcript = {"text": "The audio file could not be transcribed :("}
#     options = dict(beam_size=5, best_of=5, language=language)
#     transcribe_options = dict(task="transcribe", **options)

#     # Audio player                                                   
#     if audio_file:
#         # Read file content
#         audio_bytes = audio_file.read()
#         st.audio(audio_bytes)

#         # Convert bytes to a file-like object using io.BytesIO
#         audio_file = io.BytesIO(audio_bytes)

#         # Convert to numpy array
#         audio_data, _ = librosa.load(audio_file, sr=16000)  # Load with target sample rate of 16000 for Whisper

#         # Transcribe audio on button click      
#         if st.button("Transcribe"):
#             with st.spinner("Transcribing audio..."):
#                 transcript = model.transcribe(audio_data, **transcribe_options)
#             st.write(transcript["text"])

# if __name__ == "__main__":
#     main()




# from dotenv import load_dotenv
# import os
# import numpy as np
# import streamlit as st
# import torch
# import whisper
# import librosa
# import os
# import io
# import openai
# from pytube import YouTube

# load_dotenv()
# # Set your OpenAI API key
# openai.api_key = os.getenv("OPENAI_KEY")

# # Function to extract entities using OpenAI API
# def extract_entities(text):
#     prompt = f"""
#     The following entities are present in Indian Languges
#     Please extract the following entities from the text, convert/translate the transcription into english
#     Provide entities for both in english and the original langauge in a structured format:

#     Text: "{text}"

#     - Name:
#     - Phone Numbers:
#     - Addresses:
#     - Email:
#     """
#     response = openai.chat.completions.create(
#         model="gpt-3.5-turbo",
#         messages=[
#             {"role": "system", "content": "You are a helpful assistant that extracts information from Indian multilingual text."},
#             {"role": "user", "content": prompt}
#         ],
#         max_tokens=200
#     )
#     entities_text = response.choices[0].message.content

#     return entities_text

# # Use the cache decorator from Streamlit
# @st.cache(allow_output_mutation=True)
# def load_model(model_id, model_path):
#     # Define available device (CPU/GPU)
#     device = "cuda" if torch.cuda.is_available() else "cpu"

#     # Load model on available device
#     model = whisper.load_model(model_id, device=device, download_root=model_path)

#     # Display model's parameters in the app's logs
#     print(
#         f"Model will be run on {device}\n"
#         f"Model is {'multilingual' if model.is_multilingual else 'English-only'} "
#         f"and has {sum(np.prod(p.shape) for p in model.parameters()):,} parameters."
#     )

#     return model

# def download_audio_from_youtube(url):
#     yt = YouTube(url)
#     audio_stream = yt.streams.filter(only_audio=True).first()
#     audio_file = audio_stream.download(filename='audio.mp4')
#     return audio_file

# def main():
#     # Display title                
#     st.title("Whisper - Speech to Text App")

#     # Set up environment variables for model ID and path
#     model_id = os.environ.get('MODEL_ID', 'small')  # Use a smaller model for quicker transcription by default
#     model_path = os.environ.get('MODEL_PATH', 'whisper_model')  # Default path if not set

#     model = load_model(model_id, model_path)

#     # Add a selectbox for language selection
#     languages = ['hi', 'bn', 'te', 'mr', 'ta', 'ur', 'gu', 'kn', 'ml', 'pa']  # List of Indian language codes
#     language = st.selectbox("Select the language of the audio file", languages, index=0)

#     # Option to upload audio file or provide YouTube link
#     st.write("Upload an audio file or provide a YouTube link:")
#     audio_file = st.file_uploader("Upload an audio file", type=["mp3", "wav"])
#     youtube_link = st.text_input("Or enter a YouTube link")

#     transcript = {"text": "The audio file could not be transcribed :("}
#     options = dict(beam_size=5, best_of=5, language=language)
#     transcribe_options = dict(task="transcribe", **options)

#     audio_data = None

#     if audio_file:
#         # Read file content
#         audio_bytes = audio_file.read()
#         st.audio(audio_bytes)

#         # Convert bytes to a file-like object using io.BytesIO
#         audio_file = io.BytesIO(audio_bytes)

#         # Convert to numpy array
#         audio_data, _ = librosa.load(audio_file, sr=16000)  # Load with target sample rate of 16000 for Whisper

#     elif youtube_link:
#         try:
#             audio_file = download_audio_from_youtube(youtube_link)
#             st.audio(audio_file)

#             # Load audio file using librosa
#             audio_data, _ = librosa.load(audio_file, sr=16000)
#         except Exception as e:
#             st.error(f"Error downloading audio from YouTube: {e}")

#     # Transcribe audio on button click      
#     if audio_data is not None and st.button("Transcribe"):
#         with st.spinner("Transcribing audio..."):
#             transcript = model.transcribe(audio_data, **transcribe_options)
#             transcription_text = transcript["text"]
#             st.write(transcription_text)

#             # Extract entities from the transcription text
#             with st.spinner("Extracting entities..."):
#                 entities = extract_entities(transcription_text)
#                 st.write("Extracted Entities:")
#                 st.write(entities)

# if __name__ == "__main__":
#     main()

from dotenv import load_dotenv
import os
import numpy as np
import streamlit as st
import torch
import whisper
import librosa
import io
import openai
from pytube import YouTube

load_dotenv()

# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_KEY")

# Function to extract entities using OpenAI API
def extract_entities(text):
    prompt = f"""
    The following entities are present in Indian Languages.
    Please extract the following entities from the text.
    Provide entities for both in English and the original language in a structured format:

    Text: "{text}"

    - Name:
    - Phone Numbers:
    - Addresses:
    - Email:
    """
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that extracts information from Indian multilingual text."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=200
    )
    entities_text = response.choices[0].message.content

    return entities_text

# Function to translate text from Indian languages to English using OpenAI GPT-3.5-turbo
def translate_text(text, source_language):
    prompt = f"Translate the following text from {source_language} to English:\n\n{text}"
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that translates text from Indian languages to English."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=150
    )
    translated_text = response.choices[0].message.content 

    return translated_text

# Use the cache decorator from Streamlit
@st.cache(allow_output_mutation=True)
def load_model(model_id, model_path):
    # Define available device (CPU/GPU)
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # Load model on available device
    model = whisper.load_model(model_id, device=device, download_root=model_path)

    # Display model's parameters in the app's logs
    print(
        f"Model will be run on {device}\n"
        f"Model is {'multilingual' if model.is_multilingual else 'English-only'} "
        f"and has {sum(np.prod(p.shape) for p in model.parameters()):,} parameters."
    )

    return model

def download_audio_from_youtube(url):
    yt = YouTube(url)
    audio_stream = yt.streams.filter(only_audio=True).first()
    audio_file = audio_stream.download(filename='audio.mp4')
    return audio_file

def main():
    # Display title                
    st.title("Whisper - Speech to Text App")

    # Set up environment variables for model ID and path
    model_id = os.environ.get('MODEL_ID', 'small')  # Use a smaller model for quicker transcription by default
    model_path = os.environ.get('MODEL_PATH', 'whisper_model')  # Default path if not set

    model = load_model(model_id, model_path)

    # Add a selectbox for language selection
    languages = ['hi', 'bn', 'te', 'mr', 'ta', 'ur', 'gu', 'kn', 'ml', 'pa']  # List of Indian language codes
    language = st.selectbox("Select the language of the audio file", languages, index=0)

    # Option to upload audio file or provide YouTube link
    st.write("Upload an audio file or provide a YouTube link:")
    audio_file = st.file_uploader("Upload an audio file", type=["mp3", "wav"])
    youtube_link = st.text_input("Or enter a YouTube link")

    transcript = {"text": "The audio file could not be transcribed :("}
    options = dict(beam_size=5, best_of=5, language=language)
    transcribe_options = dict(task="transcribe", **options)

    audio_data = None

    if audio_file:
        # Read file content
        audio_bytes = audio_file.read()
        st.audio(audio_bytes)

        # Convert bytes to a file-like object using io.BytesIO
        audio_file = io.BytesIO(audio_bytes)

        # Convert to numpy array
        audio_data, _ = librosa.load(audio_file, sr=16000)  # Load with target sample rate of 16000 for Whisper

    elif youtube_link:
        try:
            audio_file = download_audio_from_youtube(youtube_link)
            st.audio(audio_file)

            # Load audio file using librosa
            audio_data, _ = librosa.load(audio_file, sr=16000)
        except Exception as e:
            st.error(f"Error downloading audio from YouTube: {e}")

    # Transcribe audio on button click      
    if audio_data is not None and st.button("Transcribe"):
        with st.spinner("Transcribing audio..."):
            transcript = model.transcribe(audio_data, **transcribe_options)
            transcription_text = transcript["text"]
            st.write(transcription_text)

            # Extract entities from the transcription text
            with st.spinner("Extracting entities..."):
                entities = extract_entities(transcription_text)
                st.write("Extracted Entities:")
                st.write(entities)

                # Translate transcription to English
                with st.spinner("Translating to English..."):
                    translated_text = translate_text(transcription_text, language)
                    st.write("Translated Text:")
                    st.write(translated_text)

if __name__ == "__main__":
    main()
