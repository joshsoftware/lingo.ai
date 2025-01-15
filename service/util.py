import json

def generate_timestamp_jon(translation,summary):
    segs = []
    seg = {}
    segments = translation["segments"]
    for segment in segments:
        seg = {"start":segment["start"],"end":segment["end"],"text":segment["text"]}
        segs.append(seg)

    result = {"message": "File processed successfully!","translation":translation["text"], "segments": segs, "summary":summary}
    return result
	
