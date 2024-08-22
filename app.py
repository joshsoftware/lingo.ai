from dotenv import load_dotenv
import whisper
import gradio as gr
import ollama

# Import configurations and functions from modules
from config import openai_api_key, model_id, model_path
from load_model import load_model
#from extract_entities import extract_entities

# Load environment variables
load_dotenv()

#Load whisher model
model = load_model(model_id, model_path)

#transcripe the audio to its original language
def transcribe(audio):
    result = model.transcribe(audio)
    transcription = result["text"]
    #translation = translate_with_whisper(audio)
    translation = translate_with_ollama(transcription)
    summary = summarize(translation)
    return [transcription, translation, summary]

#translate the audio file to English language using whisper model
def translate_with_whisper(audio): 
    options = dict(beam_size=5, best_of=5)
    translate_options = dict(task="translate", **options)
    result = model.transcribe(audio,**translate_options)
    return result["text"]

#translate the text from transciption to English language
def translate_with_ollama(text):
    #Uncomment any of the below line to test the translation if don't have an audio file
    #text = "मुलाखतकार: आम्ही जेनीशी बोलत आहोत. तर तुमचा सध्याचा व्यवसाय काय आहे?\nमुलाखत घेणारा: मी एक सहाय्यक दिग्दर्शक आहे [???] मुळात [???].\nमुलाखतकर्ता: आणि म्हणून तुम्ही या विशिष्ट पदावर किती काळ आहात?\nमुलाखत घेणारा: आम्ही जेनीशी बोलत आहोत. . तर तुमचा सध्याचा व्यवसाय काय आहे?\nमुलाखत घेणारा: मी एक सहाय्यक दिग्दर्शक आहे [???] मुळात [???].\nमुलाखत घेणारा: आणि म्हणून तुम्ही या विशिष्ट पदावर किती काळ आहात?\nमुलाखत घेणारा: मी या विशिष्ट पदावर आहे. स्थिती - ४ वर्षे झाली आहेत.\nमुलाखतकार: तुम्ही आजपर्यंतच्या तुमच्या कामाचे किंवा करिअरच्या इतिहासाचे थोडक्यात वर्णन करू शकता का?\nमुलाखत घेणारा: माझी कारकीर्द अशी आहे की, सुरुवातीच्या काळात ती स्पेशलायझेशनच्या वेगवेगळ्या क्षेत्रात अनेक क्लिनिकल भूमिकांसह सुरू झाली. नर्सिंग [???] उद्योग आणि [???] प्लॅस्टिक [???] संपूर्ण भिन्न प्रकार आणि नंतर मी पुनर्वसन मध्ये हलविले. मी 15 वर्षे [???] होतो आणि नंतर मुळात मी 26 वर्षांचा होतो तेव्हा व्यवस्थापनाच्या भूमिकेत गेलो आणि गेली 27 वर्षे व्यवस्थापनाच्या भूमिकेत काम करत होतो आणि होय, सुमारे 20 वर्षे मी व्यवस्थापनात काम करत आहे आणि मुळात ते केले पुनर्वसन समुपदेशनातील एक पुनर्वसन पदवी, जी मला वाटते [???] खेळली, त्यामुळे [???] नर्सिंगच्या पारंपारिक क्लिनिकल भूमिकेपासून काही बाबतीत भिन्न विलंब.\nमुलाखतकार: होय, मला पहिली गोष्ट वाटते [???] व्यापकपणे सांगायचे तर, तुम्ही नर्सिंगमध्ये जाण्याचे का निवडले?\nमुलाखत घेणारा: कारण मला प्रशिक्षण आणि नोकरीसाठी एकाच वेळी पैसे दिले गेले. 70 च्या दशकात, नोकऱ्या आणि नोकरीमध्ये गोष्टी खूप वेगळ्या होत्या... मुलाखत घेणारा: मी या विशिष्ट स्थितीत आहे - त्याला 4 वर्षे झाली आहेत.]n मुलाखतकार: तुम्ही तुमच्या कामाचे किंवा करिअरच्या इतिहासाचे थोडक्यात वर्णन करू शकता का? आजपर्यंत?\nमुलाखत घेणारा: माझी कारकीर्द अशी आहे की, सुरुवातीला नर्सिंग [???] उद्योग आणि [???] प्लॅस्टिक [???] ते संपूर्ण भिन्न क्षेत्रात विशेषीकरणाच्या विविध क्षेत्रांमध्ये क्लिनिकल भूमिकांपासून सुरुवात झाली. विविधता आणि नंतर मी पुनर्वसन मध्ये हलविले. मी 15 वर्षे [???] होतो आणि नंतर मुळात मी 26 वर्षांचा होतो तेव्हा व्यवस्थापनाच्या भूमिकेत गेलो आणि गेली 27 वर्षे व्यवस्थापनाच्या भूमिकेत काम करत होतो आणि होय, सुमारे 20 वर्षे मी व्यवस्थापनात काम करत आहे आणि मुळात ते केले पुनर्वसन समुपदेशनातील एक पुनर्वसन पदवी, जी मला वाटते [???] खेळली, त्यामुळे [???] नर्सिंगच्या पारंपारिक क्लिनिकल भूमिकेपासून काही बाबतीत भिन्न विलंब.\nमुलाखतकार: होय, मला पहिली गोष्ट वाटते [???] व्यापकपणे सांगायचे तर, तुम्ही नर्सिंगमध्ये जाण्याचे का निवडले?\nमुलाखत घेणारा: कारण मला प्रशिक्षण आणि नोकरीसाठी एकाच वेळी पैसे दिले गेले. 70 च्या दशकात, नोकऱ्या आणि रोजगारामध्ये गोष्टी खूप वेगळ्या होत्या..."
    #text="नागपूर:महाविकास आघाडीचा मुंबईत मोठा मेळावा झाला. या मेळाव्यात मुख्यमंत्रिपदाचा उमेदवार कोण? हा विषय जास्त गाजला. उद्धव ठाकरेंनी मुख्यमंत्रिपदाचा उमेदवार कोण हे जाहीर करा, मी पाठींबा देतो असे वक्तव्य केले. पण त्याला राष्ट्रवादी काँग्रेसचे अध्यक्ष शरद पवार यांनी प्रतिसाद दिला नाही. त्यांना यावर बोलणेच टाळले. तर काँग्रेस प्रदेशाध्यक्ष नाना पटोलेंनी मात्र आधी निवडणूक जिंकू नंतर मुख्यमंत्री ठरवू अशी भूमिका मांडली. यावर आता संजय राऊत यांनी प्रतिक्रिया दिली आहे. मला मुख्यमंत्री व्हायचे आहे असे उद्धव ठाकरे कधीच बोलले नाहीत असं राऊत यांनी स्पष्ट केले आहे. मात्र त्या पुढे जे वक्तव्य त्यांनी केलं त्यामुळे मविआमध्ये पुन्हा एकदा ठिणगी पडण्याची शक्यता आहे. "
    response = ollama.generate(model= "llama3.1", prompt = "Translate the following text to English:"+text+"\n SUMMARY:\n")
    translation = response["response"]
    return translation


#Using Ollama and llama3.1 modle, summarize the English translation
def summarize(text):
    #Uncomment the following line to test the summarization if don't the audio file
    #text = "Interviewer: We are talking with Jenny. So what is your current occupation?\nInterviewee: I am an assistant director [???] basically [???].\nInterviewer: And so how long you have been in this particular position?\nInterviewer: We are talking with Jenny. So what is your current occupation?\nInterviewee: I am an assistant director [???] basically [???].\nInterviewer: And so how long you have been in this particular position?\nInterviewee: I am in this particular position - it has been 4 years.\nInterviewer: Are you able to briefly describe your work or career history to date?\nInterviewee: My career has been, it initially started with a lot of clinical roles in very different areas of specialization within the nursing [???] industry and [???] plastics [???] to whole different variety and then I moved into rehabs. I was [???] for 15 years and then basically moved into management role when I was 26 and had been working in the management role for the last 27 years and yeah, about 20 years I have been working in management, and basically did a rehab degree in rehab counseling, which I think played a [???], so [???] sort of varying delay in some respects from the traditional clinical role of nursing.\nInterviewer: Yeah, sort of I guess first thing [???] broadly speaking, why did you choose to go into nursing?\nInterviewee: Because I was paid to train and employed at the same time. In the 70s, things were very different in [???] of jobs and employment...nterviewee: I am in this particular position - it has been 4 years.]nInterviewer: Are you able to briefly describe your work or career history to date?\nInterviewee: My career has been, it initially started with a lot of clinical roles in very different areas of specialization within the nursing [???] industry and [???] plastics [???] to whole different variety and then I moved into rehabs. I was [???] for 15 years and then basically moved into management role when I was 26 and had been working in the management role for the last 27 years and yeah, about 20 years I have been working in management, and basically did a rehab degree in rehab counseling, which I think played a [???], so [???] sort of varying delay in some respects from the traditional clinical role of nursing.\nInterviewer: Yeah, sort of I guess first thing [???] broadly speaking, why did you choose to go into nursing?\nInterviewee: Because I was paid to train and employed at the same time. In the 70s, things were very different in [???] of jobs and employment..."
    #response = ollama.generate(model='llama3.1', prompt="Write a concise summary of the text that cover the key points of the textspacing_size=gr.themes.sizes.spacing_sm, radius_size=gr.themes.sizes.radius_none.\n SUMMARY: \N"+text)
    response = ollama.generate(model= "llama3.1", prompt = "summarize the following text:"+text+"\n SUMMARY:\n")
    summary = response["response"]
    return summary


#UI with tabs, 
theme = gr.themes.Glass(spacing_size="lg", radius_size="lg",primary_hue="blue", font=["Optima","Candara"])
with gr.Blocks(theme) as block:
    #Tab for recording the audio and upload it for transription, translation and summarization
    with gr.Tab("Record"):
        with gr.Row():
               
            inp_audio = gr.Audio(
                label="Input Video",
                type="filepath",
                sources = ["microphone"],
                elem_classes=["primary"]
            )
        with gr.Row():
            out_transcribe = gr.TextArea(label="Transcipt")
            out_translate = gr.TextArea(label="Translate")
        with gr.Row():
            out_summary = gr.TextArea(label="Call Summary")
        with gr.Row():   
            submit_btn = gr.Button("Submit")

        submit_btn.click(transcribe, inputs=[inp_audio], outputs=[out_transcribe,out_translate, out_summary])

    #Tab for uploading the audio file for transription, translation and summarization
    with gr.Tab("Upload"):
        with gr.Row():
               
            inp_audio_file = gr.File(
                label="Upload Audio File",
                type="filepath",
                file_types=["m4a","mp3","webm","mp4","mpga","wav","mpeg"],
            )
        with gr.Row():
            out_transcribe = gr.TextArea(label="Transcipt")
            out_translate = gr.TextArea(label="Translate")
        with gr.Row():
            out_summary = gr.TextArea(label="Call Summary")
        with gr.Row():    
            submit_btn = gr.Button("Submit")

        

        submit_btn.click(transcribe, inputs=[inp_audio_file], outputs=[out_transcribe,out_translate, out_summary])
    
 


block.launch(debug = True)
