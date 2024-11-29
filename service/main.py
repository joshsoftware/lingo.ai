from multiprocessing import pool
import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from logger import logger
from dotenv import load_dotenv
from conversation_diarization.speaker_diarization import transcription_with_speaker_diarization
from starlette.middleware.cors import CORSMiddleware
from audio_service import translate_with_whisper
from conversation_diarization.dbcon import initDbConnection
from conversation_diarization.jd_interview_aligner import align_interview_with_job_description
from conversation_diarization.request import InterviewAnalysisRequest
from summarizer import summarize_using_openai
from pydantic import BaseModel
from psycopg2 import pool

dbCursor = initDbConnection()

app = FastAPI()

# Add CORS middleware to the application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def root_route():
    return 'Hello, this is the root route for lingo ai server'

class Body(BaseModel):
    audio_file_link: str
    speaker_diarization: bool

@app.post("/upload-audio")
async def upload_audio(body: Body):
    try:
        #check if string is empty
        if body.audio_file_link == "":
            return JSONResponse(status_code=400, content={"message":"Invalid file link"})
        # Check file type
        if not body.audio_file_link.endswith(('.m4a', '.mp4','.mp3','.webm','.mpga','.wav','.mpeg','.ogg')):
            logger.error("invalid file type")
            return JSONResponse(status_code=400, content={"message":"Invalid file type"})
        #translation = translate_with_whisper(transcription)
        translation = translate_with_whisper(body.audio_file_link)

        logger.info("translation done")
        #summary = summarize_using_openai(translation)
        summary = summarize_using_openai(translation)

        logger.info("summary done")

        return JSONResponse(content={"message": "File processed successfully!", "translation":translation, "summary": summary}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"message": str(e)}, status_code=500)


@app.post("/analyse-interview")
async def analyse_interview(request: InterviewAnalysisRequest):
    try:
        # Request payload validation
        if request.interviewer_name == "" or request.candidate_name == "" or request.job_description_link == "" or request.interview_link == "":
            return JSONResponse(status_code=400, content={"message":"Invalid request, missing params"})
        
        # Create DB record
        # Pending
        
        # Perform transcription and speaker diarization
        # transcription_result = transcription_with_speaker_diarization(request)
        transcription_result = {
            "transcript": "Speaker 1: During my tenure of three years, I have worked on technologies like Java,  \n\nSpeaker 0: Spring Boot, and I was working  \n\nSpeaker 1: in one of the financial services bank that is BNP Paribas, one of our short pieces through Etsy.  \n\nSpeaker 2: OK.  So what's the reason for switching your current job?  \n\nSpeaker 1: I just uh uh once  \n\nSpeaker 0: my contract  \n\nSpeaker 1: was over without the I was just uh I think that I should look out uh for more uh for better opportunities and for uh to explore the new technologies and to learn something and upgrade my skin so that's why  \n\nSpeaker 2: okay okay all right so So with respect to this messaging queue implementation, I am able to see in your CV.  So which messaging queue implementation you have done so far?  \n\nSpeaker 1: Actually,  \n\nSpeaker 0: I haven't done  \n\nSpeaker 1: implementation messaging queue, but I have an idea about messaging queue.  So  \n\nSpeaker 2: which queues you  \n\nSpeaker 1: have done so far?  Yeah, we have used Kafka in our system.  What is the use case?  \n\nSpeaker 2: What is the use case where you have been using Kafka?  \n\nSpeaker 1: So Kafka  \n\nSpeaker 0: basically in our project there  \n\nSpeaker 1: was a one functionality chat still.  \n\nSpeaker 0: So basically our project was about to generate a report.  So once we generate a report we have to upload in our one of these  \n\nSpeaker 1: screens  \n\nSpeaker 0: which is owned by some other  \n\nSpeaker 1: team.  \n\nSpeaker 0: other projects.  So we have to send that particular report and details about that particular report.  So in that case, we have implemented Kafka in our project to send a configuration details of that report that basically is it a monthly report, daily report to which client it is need to be shown and name and file name all the reports.  So all that configuration we had sent through our to Kafka and also one more use case was said to be at.  we were fetching the data from our downstream applications.  Then after applying filtration logic and all the things, we will generate the report.  First, we are going through an API calls and all, and all the logics and implementation was done at the  \n\nSpeaker 1: downstream application.  \n\nSpeaker 0: But after that, we have implemented that we will fetch the data from the API from that application.  And that will be stored in our  \n\nSpeaker 1: Kafka messaging topics and all.  \n\nSpeaker 0: So we will be the consumer and they will  \n\nSpeaker 1: be the producer as just  \n\nSpeaker 0: implementation was going  \n\nSpeaker 1: on when I was working on the project.  \n\nSpeaker 2: Okay.  Okay, so apart from that, tell me how how to implement authentication or SAP endpoints.  \n\nSpeaker 0: We can use Spring Boot Spring Security in our project.  We need to add up dependencies, Spring Boot starter security in our pom.xml file.  After that, we need to extend web security configure adapter class, which will provide us to customize the security in our project.  In our project, our two endpoints.  And so to override the Confuser method with authentication builder object, we can authenticate APIs and authorizations.  Also, we can use HTTP method.  So basic authentication and form-based authentication we can use  \n\nSpeaker 1: for the Spring Security.  \n\nSpeaker 2: What is JWT?  It  \n\nSpeaker 0: is basically Java web 2.  So it is basically a token-based authentication we used to apply for security in our projects.  \n\nSpeaker 2: OK.  How much experience you have on microservices architecture?  \n\nSpeaker 0: I haven't worked on microservices-based  \n\nSpeaker 1: architecture.  \n\nSpeaker 0: OK.  Any  \n\nSpeaker 2: experience on the GRPC?  No.  OK.  So tell me with respect to this Kafka.  Do you know what is managed versus unmanaged Kafka?  Managed  \n\nSpeaker 1: versus unmanaged.  No.  I'm  \n\nSpeaker 2: not  \n\nSpeaker 1: sure.  All right.  \n\nSpeaker 2: Tell me what is try with resource.  \n\nSpeaker 1: Try with resource.  \n\nSpeaker 2: Yeah.  Like we do have try catch, right?  So similar to that, there is a try with resource as well.  OK.  Try  \n\nSpeaker 1: and fetch  \n\nSpeaker 0: block.  So it is basically the try with resource.  is an implementation in which we don't need to apply a catch block in that.  \n\nSpeaker 1: A resource will be used.  \n\nSpeaker 2: Why we use JPA?  \n\nSpeaker 0: JPA is basically we use to communicate with our database.  It is basically a used ORM, Object Relational Mapping technique to communicate with the database.  \n\nSpeaker 1: So  \n\nSpeaker 0: we can convert the database, we can communicate between database and our objects through it.  \n\nSpeaker 2: So say for example, I have a requirement where I need to execute certain piece of code at certain given time on daily basis.  How can I achieve it with Spring Boot?  \n\nSpeaker 0: We are certain piece of code at certain our time.  Okay,  \n\nSpeaker 2: correct.  \n\nSpeaker 0: Yeah, we can use scheduler at the right scheduler Scheduling in our project with  \n\nSpeaker 1: the help of scheduler and rotation.  \n\nSpeaker 2: Okay, okay All right What is transaction rollback  \n\nSpeaker 0: Okay, so transaction rollback is basically when we try to fetch any data or when we try to update our database or our table or something.  So when we use a direct transactional notation on any method or any service, but suppose if that method particularly in between the transaction happens between, it will throw an error or something.  So it will roll back whole transaction, I mean, whole process.  So the database don't get affects or it don't get partially update.  So either it should be completed successfully or it should be rolled back completely.  So consistency of database can be maintained.  \n\nSpeaker 2: OK.  OK.  So tell me one thing while implementing REST APIs, we generally validate the request body coming in, right?  So how to validate that request body?  How  \n\nSpeaker 0: to validate  \n\nSpeaker 1: a request body?  \n\nSpeaker 2: Yeah, so for any specific APIs, if you are as a client, you are sending some JSON object, right?  so you need to validate at application layer as well I mean at API level you need to validate the data so that so basically data sanitization and also so that some garbage data should not come in so how do you we  \n\nSpeaker 0: can use  \n\nSpeaker 1: the validations and notations to  \n\nSpeaker 2: which generations which are notations  \n\nSpeaker 0: not null or  \n\nSpeaker 1: if any  \n\nSpeaker 0: email field is there so  \n\nSpeaker 1: we can use the accurate email and at the right value annotation so that maybe we  \n\nSpeaker 2: can use that what is at the right valid annotation?  \n\nSpeaker 0: it will check the validity of the field that if a field is a type of particular object  \n\nSpeaker 1: okay  \n\nSpeaker 2: so so so if you if you apply at the right rest controller annotation on a class Do you still need to apply at the rate request body, at the rate response body annotations?  \n\nSpeaker 0: No, REST controller is basically a combination of at  \n\nSpeaker 1: the rate response, combination of at the rate response  \n\nSpeaker 0: body and at the  \n\nSpeaker 1: rate controller.  So we  \n\nSpeaker 0: don't need  \n\nSpeaker 1: to explicitly at the response body annotation.  \n\nSpeaker 2: All right.  On the database front, so which databases you worked upon?  \n\nSpeaker 1: So  \n\nSpeaker 0: I have  \n\nSpeaker 1: used MS SQL we have MS SQL Okay,  \n\nSpeaker 2: so tell me what is left join?  \n\nSpeaker 1: Okay, so  \n\nSpeaker 0: left join  \n\nSpeaker 1: suppose  \n\nSpeaker 0: I have a two tables employee table and Employees department  \n\nSpeaker 1: table,  \n\nSpeaker 2: okay, and  \n\nSpeaker 0: I have to join both this table based on the condition So it will fetch the data or it will fetch only that data from the employee department table which satisfied the conditions and also fetch the data from employee table also which doesn't satisfy the condition and put it if there is no relation for that particular field in that.  both the tables, it will take it as a null, so left-joint  \n\nSpeaker 1: tables.  \n\nSpeaker 2: So while querying, while making this query, if at all I want to replace these null values coming in by some random text or we can say NA as a not applicable, if I want to put it like that, how can I do that?  \n\nSpeaker 0: So we can apply the condition and that is that for, if there is a For example, I have employee city.  So if employee city is equals to  \n\nSpeaker 1: unknown,  \n\nSpeaker 0: so we can use allies to fetch it as value to the fetch it as right.  \n\nSpeaker 2: Which condition you can apply?  So, if some value say for example, for one of the input department is not present right.  So, department is not present or department data will come up as null.  So, I want to update that null to I mean I want to replace that null with NA.  So, what condition you will apply in a query?  Have you ever used call case If then statements in the query  \n\nSpeaker 1: I Sorry  \n\nSpeaker 2: if then statements in the query There is a yeah, yeah And credit  \n\nSpeaker 1: so  \n\nSpeaker 0: Yeah,  \n\nSpeaker 1: we  \n\nSpeaker 0: can  \n\nSpeaker 1: we can use if then it will basically if else based condition  \n\nSpeaker 2: Okay, all right Last question why do we need interface?  \n\nSpeaker 0: Interfaces, so basically interfaces are to implement our abstraction  \n\nSpeaker 1: in  \n\nSpeaker 0: our system.  We don't want user to see all the details.  Implementation, we just want that user will get the functionality because user had only do two with that, had two things with that.  so they don't need to know the implementation of that particular functionality so to achieve the abstraction we use implement interfaces which have only abstract  \n\nSpeaker 1: methods for  \n\nSpeaker 0: that we need to implement  \n\nSpeaker 1: further  \n\nSpeaker 2: all right okay i'm done for the interview do you have any questions for me okay  \n\nSpeaker 1: so any feedback for me  \n\nSpeaker 2: so far so all good But yeah, you can improve a bit more on your microservices application security.  And  \n\nSpeaker 0: that's what  \n\nSpeaker 2: I think.  So it's like you shouldn't be just the consumer of the particular service.  You should know how to, you know, get that service up and running so that you will be integrated with multiple services and you will get to know in which scenarios in which use cases you can.  use those services there are alternatives for Kafka as well like Google pops up is there it's alternative for Kafka then gRPC is the best for inter process communication if you're dealing with a micro service architecture then instead of making rest rest template calls you can just call gi you can just make a gRPC call to keep it lightweight and quicker yeah those things you should explore upon yeah yeah  \n\nSpeaker 1: okay yeah okay  \n\nSpeaker 2: anything else  \n\nSpeaker 1: uh no thank you so  \n\nSpeaker 2: much thank you bye  ",
            "qna": {
            "rating_scale": [
                1,
                10
            ],
            "result": [
                {
                "id": 1,
                "question": "During my tenure of three years, I have worked on technologies like Java,",
                "answer": "",
                "correctness": "unknown",
                "remark": "",
                "rating": 5
                },
                {
                "id": 2,
                "question": "Speaker 1: During my tenure of three years, I have worked on technologies like Java,",
                "answer": "",
                "correctness": "unknown",
                "remark": "",
                "rating": 5
                },
                {
                "id": 3,
                "question": "So while querying, while making this query, if at all I want to replace these null values coming in by some random text or we can say NA as a not applicable, if I want to put it like that, how can I do that?",
                "answer": "So we can apply the condition and that is that for, if there is a For example, I have employee city.  So if employee city is equals to unknown, so we can use allies to fetch it as value to the fetch it as right.",
                "correctness": "partially right",
                "remark": "",
                "rating": 7
                },
                {
                "id": 4,
                "question": "Which condition you can apply?  So, if some value say for example, for one of the input department is not present right.  So, department is not present or department data will come up as null.  So, I want to update that null to I mean I want to replace that null with NA.  So, what condition you will apply in a query?  Have you ever used call case If then statements in the query",
                "answer": "I Sorry so we can use if then it will basically if else based condition",
                "correctness": "right",
                "remark": "",
                "rating": 9
                },
                {
                "id": 5,
                "question": "Why do we need interface?",
                "answer": "Interfaces, so basically interfaces are to implement our abstraction in our system.  We don't want user to see all the details.  Implementation, we just want that user will get the functionality because user had only do two with that, had two things with that.  so they don't need to know the implementation of that particular functionality so to achieve the abstraction we use implement interfaces which have only abstract methods for that we need to implement further",
                "correctness": "right",
                "remark": "",
                "rating": 9
                },
                {
                "id": 6,
                "question": "Any feedback for me?",
                "answer": "so far so all good But yeah, you can improve a bit more on your microservices application security.  And that's what I think.  So it's like you shouldn't be just the consumer of the particular service.  You should know how to, you know, get that service up and running so that you will be integrated with multiple services and you will get to know in which scenarios in which use cases you can. use those services there are alternatives for Kafka as well like Google pops up is there it's alternative for Kafka then gRPC is the best for inter process communication if you're dealing with a micro service architecture then instead of making rest rest template calls you can just call gi you can just make a gRPC call to keep it lightweight and quicker yeah those things you should explore upon yeah yeah",
                "correctness": "right",
                "remark": "",
                "rating": 9
                }
            ]
            }
        }
        # return JSONResponse(content={"message": transcription_result}, status_code=200)
        
        # Go further with job description based analysis
        jd_description = align_interview_with_job_description(request.job_description_link, transcription_result['qna'])
        return JSONResponse(content={"result": jd_description}, status_code=200)
        
        # Update DB record
        # Pending
        
        # Return response
        #TODO: include record id below
        return JSONResponse(content={"message": "Request processed successfully"}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"result": str(e)}, status_code=500)