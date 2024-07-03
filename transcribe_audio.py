def transcribe_audio(model, audio_data):
    options = dict(beam_size=5, best_of=5)
    transcribe_options = dict(task="transcribe", **options)
    transcript = model.transcribe(audio_data, **transcribe_options)
    return transcript["text"]
