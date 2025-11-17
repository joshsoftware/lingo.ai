import json

def generate_timestamp_json(translation,summary,detected_language): #same name function is used in main.py , can we write logic in such a way that only one function used everywhere
    segs = []
    seg = {}
    segments = translation["segments"]
    for segment in segments:
        seg = {"start":segment["start"],"end":segment["end"],"text":segment["text"]}
        segs.append(seg)

    result = {"message": "File processed successfully!","translation":translation["text"], "segments": segs, "summary":summary,"detected_language":detected_language}
    return result
	
