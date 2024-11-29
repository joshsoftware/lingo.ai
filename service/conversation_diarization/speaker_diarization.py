import json
import os
import re
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
    write_srt,
)
from conversation_diarization.prompt import QNA_PROMPT_MESSAGE
from conversation_diarization.request import InterviewAnalysisRequest

LLM = "llama3"
TEMPERATURE = 0.2

def create_prompt(transcription: str) -> str:
    return QNA_PROMPT_MESSAGE.replace("<TRANSCRIPTION>", transcription)

def transcription_with_speaker_diarization(request: InterviewAnalysisRequest):
    """
    Method to transcribe the audio, with speaker diarization using Faster Whisper, NeMo and ForceAligner.
    :param audio_link: The conversation text to be transcribed.
    :return: Transcribed text.
    """
    # Configuration
    COMPUTING_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    WHISPER_MODEL = "medium.en"
    WHISPER_BATCH_SIZE = 8
    mtypes = {"cpu": "int8", "cuda": "float16"}
    
    temp_transcript = """
    Speaker 1: During my tenure of three years, I have worked on technologies like Java,  

    Speaker 1: Spring Boot, and I was working  

    Speaker 1: in one of the financial services bank that is BNP Paribas, one of our short pieces through Etsy.  

    Speaker 2: OK.  So what's the reason for switching your current job?  

    Speaker 1: I just uh uh once  

    Speaker 1: my contract  

    Speaker 1: was over without the I was just uh I think that I should look out uh for more uh for better opportunities and for uh to explore the new technologies and to learn something and upgrade my skin so that's why  

    Speaker 2: okay okay all right so So with respect to this messaging queue implementation, I am able to see in your CV.  So which messaging queue implementation you have done so far?  

    Speaker 1: Actually,  

    Speaker 1: I haven't done  

    Speaker 1: implementation messaging queue, but I have an idea about messaging queue.  So  

    Speaker 2: which queues you  

    Speaker 1: have done so far?  Yeah, we have used Kafka in our system.  And normally, everyone can message Kafka.  What is  

    Speaker 2: what is the use case?  What is the use case where you are using Kafka?  

    Speaker 1: So Kafka  

    Speaker 1: basically in our project there  

    Speaker 1: was a one functionality chat still  

    Speaker 1: We so basically our project was about to generate a report So once we generate a report we have to upload in our one of these  

    Speaker 1: screens,  

    Speaker 1: which is owned by some other  

    Speaker 1: team  

    Speaker 1: so other projects so we have to send that particular report and details about that particular report.  So in that case we have implemented Kafka in our project to send a configuration details of that report that basically is it a monthly report, daily report to which client it is need to be shown and name and file name all the reports.  So all that configuration we have sent through our to Kafka and also one more use case was said to be at.  we were fetching the data from our downstream applications.  Then after applying filtration logic and all the things, we will generate the report.  First, we are going through an API calls and all, and all the logics and implementation was done at the  

    Speaker 1: downstream application.  

    Speaker 1: But after that, we have implemented that we will fetch the data from the API from that application.  And that will be stored in our  

    Speaker 1: Kafka messaging topics and all.  

    Speaker 1: So we will be the consumer and they will  

    Speaker 1: be the producer as just  

    Speaker 1: implementation was going  

    Speaker 1: on when I was working on the project.  

    Speaker 2: Okay.  Okay, so apart from that, tell me how how to implement authentication or SAP endpoints.  

    Speaker 1: We can use Spring Boot Spring Security in our project.  We need to add up dependencies, Spring Boot starter security in our pom.xml file.  After that, we need to extend web security configure adapter class, which will provide us to customize the security in our project.  In our project, our two endpoints.  And so to override the Confuser method with authentication builder object, we can authenticate APIs and authorizations.  Also, we can use HTTP method.  So basic authentication and form-based authentication we can use  

    Speaker 1: for the Spring Security.  

    Speaker 2: What is JWT?  It  

    Speaker 1: is basically Java web 2.  It is basically a token-based authentication we used to apply for security in our projects.  

    Speaker 2: OK.  How much experience you have on microservices architecture?  

    Speaker 1: I haven't worked on microservices-based  

    Speaker 1: architecture.  

    Speaker 1: OK.  Any  

    Speaker 2: experience on the GRPC?  No.  OK.  So tell me with respect to this Kafka, do you know what is managed versus unmanaged Kafka?  Managed  

    Speaker 1: versus unmanaged.  No.  OK.  All right.  

    Speaker 2: Tell me what is try with resource.  

    Speaker 1: Try with resource.  

    Speaker 2: Yeah.  Like we do have try catch, right?  So similar to that, there is a try with resource as well.  OK, try  

    Speaker 1: and fetch  

    Speaker 1: block.  So it is basically the try with resource.  is an implementation in which we don't need to apply a catch block in that.  

    Speaker 1: A resource will be used.  

    Speaker 2: Why we use JPA?  

    Speaker 1: JPA is basically we use to communicate with our database.  It is basically a used ORM, Object Relational Mapping technique to communicate with the database.  

    Speaker 1: So  

    Speaker 1: we can convert the database and we can communicate between database and our objects through it.  

    Speaker 2: So say for example, I have a requirement where I need to execute certain piece of code at certain given time on daily basis.  How can I achieve it with Spring Boot?  

    Speaker 1: We are certain piece of code at certain our time.  Okay,  

    Speaker 2: correct.  

    Speaker 1: Yeah, we can use scheduler at the scheduler Scheduling in our project with  

    Speaker 1: the help of scheduler and rotation.  

    Speaker 2: Okay.  Okay.  Okay.  All right What is transaction rollback  

    Speaker 1: Okay, so transaction rollback is basically when we try to fetch the any data or when we try to update our database or table or something.  So when we use at the right transaction, notice a notation on any method or any service.  But suppose if that method particularly in between the transaction happens between, it will throw an error or something.  So it will roll back whole transaction, I mean, whole the process.  So the database don't get affects or it don't get partially update.  So either it should be completed successfully or it should be rolled back completely.  So consistency of database can be maintained.  

    Speaker 2: OK.  OK.  So tell me one thing while implementing REST APIs, we generally validate the request body coming in, right?  So how to validate that request body?  How  

    Speaker 1: to validate  

    Speaker 1: a request body?  

    Speaker 2: Yeah, so for any specific APIs, if you are as a client, you are sending some JSON object, right?  so you need to validate at application layer as well I mean at API level you need to validate the data so that so basically data sanitization and also so that some garbage data should not come in so how do you we  

    Speaker 1: can use  

    Speaker 1: the validations and notations to  

    Speaker 2: which generations which are notations  

    Speaker 1: not null or  

    Speaker 1: if any  

    Speaker 1: email field is there so  

    Speaker 1: we can use the accurate email and at the right value annotation so that maybe we  

    Speaker 2: can use that what is at the right valid annotation  

    Speaker 1: it will check the validity of the field that if a field is a type of particular object  

    Speaker 1: okay  

    Speaker 2: so so so if you if you apply at the right rest controller annotation on a class Do you still need to apply at the rate request body, at the rate response body annotations?  

    Speaker 1: No, REST controller is basically a combination of at  

    Speaker 1: the rate response, combination of at the rate response  

    Speaker 1: body and at the  

    Speaker 1: rate controller.  So we  

    Speaker 1: don't need  

    Speaker 1: to explicitly at the response body annotation.  

    Speaker 2: All right.  On the database front, so which databases you worked upon?  

    Speaker 1: So  

    Speaker 1: I have  

    Speaker 1: used MS SQL we have MS SQL Okay,  

    Speaker 2: so tell me what is left join?  

    Speaker 1: Okay, so  

    Speaker 1: left join  

    Speaker 1: suppose  

    Speaker 1: I have a two tables employee table and employees department  

    Speaker 1: table,  

    Speaker 2: okay, and  

    Speaker 1: I have to join both this table based on the condition So it will fetch only that data from the employee department table, which satisfied the conditions and also fetch the data from employee table also, which doesn't satisfy the condition and put it if there is no relation for that particular field in that.  both the tables, it will take it as a null, so left-joint  

    Speaker 1: tables.  

    Speaker 2: So while querying, while making this query, if at all, I want to replace these null values coming in by some random text or we can say NA as not applicable, if I want to put it like that, how can I do that?  

    Speaker 1: So we can apply the condition and that is that for if there is a For example, I have employee city.  So if employee city is equals to  

    Speaker 1: unknown,  

    Speaker 1: so we can use allies to fetch it as value to the fetch it as right.  

    Speaker 2: Which condition you can apply?  So, if some value say for example, for one of the input department is not present right.  So, department is not present or department data will come up as null.  So, I want to update that null to I mean I want to replace that null with NA.  So, what condition you will apply in a query?  Have you ever used call case If then statements in the query  

    Speaker 1: I Sorry,  

    Speaker 2: if then statements in the query There is a yeah, yeah And credit  

    Speaker 1: so  

    Speaker 1: yeah  

    Speaker 1: we  

    Speaker 1: can  

    Speaker 1: we can use if then it will basically if else base condition  

    Speaker 2: okay okay all right last question why do we need interface  

    Speaker 1: Interfaces, so basically interfaces are to implement our abstraction  

    Speaker 1: in  

    Speaker 1: our system.  We don't want user to see all the details.  Implementation, we just want that user will get the functionality because user had only do two with that, had two things with that.  so they don't need to know the implementation of that particular functionality so to achieve the abstraction we use implement interfaces which have only abstract  

    Speaker 1: methods for  

    Speaker 1: that we need to implement  

    Speaker 1: further  

    Speaker 2: all right okay i'm done for the interview do you have any questions for me okay  

    Speaker 1: so any feedback for me  

    Speaker 2: so far so all good But yeah, you can improve a bit more on your microservices application security.  And  

    Speaker 1: that's what  

    Speaker 2: I think.  So it's like you shouldn't be just the consumer of the particular service.  You should know how to, you know, get that service up and running so that you will be integrated with multiple services and you will get to know in which scenarios in which use cases you can use those services there are alternatives for Kafka as well like Google pops up is there it's alternative for Kafka then gRPC is the best for inter process communication if you're dealing with a micro service architecture then instead of making rest rest template calls you can just call gi you can just make a gRPC call to keep it light to it and quicker yeah those things you should explore upon yeah yeah  

    Speaker 1: okay yeah okay  

    Speaker 2: anything else  

    Speaker 1: uh no thank you so  

    Speaker 2: much thank you bye  
    """
    
    temp_qna = """
    1. Why are you switching your current job?
    Answer: To explore new technologies and upgrade skills.
    Correctness: Right.
    Rating: 4/5 (Clear but could be more concise).
    2. Which messaging queue implementation have you done?
    Answer: No direct implementation but familiar with Kafka.
    Correctness: Partially correct (shows familiarity but lacks hands-on experience).
    Rating: 3/5.
    3. What is the use case of Kafka in your project?
    Answer: Used for report configuration, storage in messaging topics, and fetching data from downstream applications.
    Correctness: Right.
    Rating: 4/5 (Explained with details).
    4. How to implement authentication for APIs in Spring Boot?
    Answer: Use Spring Security, add dependencies, and override methods in WebSecurityConfigurerAdapter.
    Correctness: Right.
    Rating: 5/5.
    5. What is JWT?
    Answer: Token-based authentication for security.
    Correctness: Right.
    Rating: 5/5.
    6. Experience with microservices architecture?
    Answer: No experience.
    Correctness: Right (honest but lacks exposure).
    Rating: 2/5.
    7. Experience with gRPC?
    Answer: No experience.
    Correctness: Right.
    Rating: 2/5.
    8. What is managed vs. unmanaged Kafka?
    Answer: No knowledge.
    Correctness: Incorrect (should know basics of managed services).
    Rating: 1/5.
    9. What is try-with-resources in Java?
    Answer: Try-with-resources avoids the need for explicit resource management.
    Correctness: Right (but explanation was incomplete).
    Rating: 3/5.
    10. Why use JPA?
    Answer: For Object Relational Mapping (ORM) to communicate between database and objects.
    Correctness: Right.
    Rating: 4/5.
    11. How to schedule tasks in Spring Boot?
    Answer: Use @Scheduled annotation.
    Correctness: Right.
    Rating: 5/5.
    12. What is transaction rollback?
    Answer: Rolls back the transaction to maintain database consistency in case of failure.
    Correctness: Right.
    Rating: 4/5.
    13. How to validate request bodies in REST APIs?
    Answer: Use annotations like @NotNull, @Valid, etc.
    Correctness: Right.
    Rating: 5/5.
    14. Why use @RestController in Spring?
    Answer: Combines @Controller and @ResponseBody annotations.
    Correctness: Right.
    Rating: 4/5.
    15. Which databases have you worked on?
    Answer: MS SQL.
    Correctness: Right.
    Rating: 3/5 (limited exposure).
    16. What is a LEFT JOIN?
    Answer: Fetches data from the left table and matches rows in the right table, filling unmatched rows with NULL.
    Correctness: Right.
    Rating: 5/5.
    17. How to replace NULL values with custom text in SQL?
    Answer: Use CASE statements.
    Correctness: Right.
    Rating: 4/5 (partial explanation).
    18. Why do we need interfaces in Java?
    Answer: For abstraction to hide implementation details and define functionalities.
    Correctness: Right.
    Rating: 4/5.
    """
    
    # return {
    #     "transcript": temp_transcript,
    #     "qna": temp_qna
    # }
    
    # Generate unique session directory
    session_id = str(uuid.uuid4())
    session_path = os.path.join("service/conversation_diarization/temp_outputs", session_id)
    os.makedirs(session_path, exist_ok=True)

    AUDIO_FILE_PATH = request.interview_link

    # Transcribe the audio file
    whisper_model = faster_whisper.WhisperModel(
        WHISPER_MODEL,
        device=COMPUTING_DEVICE,
        compute_type=mtypes[COMPUTING_DEVICE]
    )
    whisper_pipeline = faster_whisper.BatchedInferencePipeline(whisper_model)
    audio_waveform = faster_whisper.decode_audio(AUDIO_FILE_PATH)
    audio_waveform_tensors = torch.from_numpy(audio_waveform)

    transcript_segments, transcript_info = whisper_pipeline.transcribe(
        audio_waveform,
        batch_size=WHISPER_BATCH_SIZE
    )

    full_transcript = "".join(segment.text for segment in transcript_segments)

    # clear gpu vram
    del whisper_model, whisper_pipeline
    # torch.cuda.empty_cache()

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
    
    prompt = create_prompt(processed_transcript)
            
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
        "transcript": processed_transcript,
        "qna": response_text_json
    }
