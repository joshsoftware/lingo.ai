import torch
import whisper
import whisper_timestamped

#load the whisper model from net if it isn't stored locally
def load_model(model_id, model_path, is_ts):
    #check GPU is avaialbe
    device = "cuda" if torch.cuda.is_available() else "cpu"
    #device = "cpu"
    if (is_ts):
        model = whisper_timestamped.load_model(model_id, device=device, download_root=model_path)
    else:
        model = whisper.load_model(model_id, device=device, download_root=model_path)
    print(
        f"Model will be run on {device}\n"
        f"Model is {'multilingual' if model.is_multilingual else 'English-only'} "
    )
    return model
