import torch
import whisper
import numpy as np
import streamlit as st

@st.cache(allow_output_mutation=True)
def load_model(model_id, model_path):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = whisper.load_model(model_id, device=device, download_root=model_path)
    print(
        f"Model will be run on {device}\n"
        f"Model is {'multilingual' if model.is_multilingual else 'English-only'} "
        f"and has {sum(np.prod(p.shape) for p in model.parameters()):,} parameters."
    )
    return model
