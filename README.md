# Solution Overview:

This solution aims to automate the extraction of key information from telephonic conversations conducted in various Indian languages, ensuring data security by processing audio and text locally. The system will handle transcription, entity extraction, summarization, and translation of conversations, all without reliance on cloud services to mitigate risks of data breaches and leaks. This solution will enhance customer service efficiency, reduce manual effort, and improve the accuracy of customer data extraction, all while addressing data privacy concerns by avoiding cloud-based data processing.

**Targeted Customers:**

    Non-Banking Financial Companies (NBFCs), Insurance companies, and medium/large call centers that operate in multilingual environments and handle a significant volume of customer calls.

**Supported Languages**

1. Indian Languages:
    _Hindi, Kannada, Marathi and Tamil_

2. Other languages:
    _Afrikaans, Arabic, Armenian, Azerbaijani, Belarusian, Bosnian, Bulgarian, Catalan, Chinese, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, Galician, German, Greek, Hebrew, Hungarian, Icelandic, Indonesian, Italian, Japanese, Kazakh, Korean, Latvian, Lithuanian, Macedonian, Malay, Maori, Nepali, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swahili, Swedish, Tagalog, Thai, Turkish, Ukrainian, Urdu, Vietnamese, and Welsh._

**Supported audio format**

_m4a, mp3, webm, mp4, mpga, wav, mpeg_
**Detailed Approach:**
1. Speech Recognition

    Technology:
        The Whisper Model will be employed for Automatic Speech Recognition (ASR).
        This model is capable of accurately transcribing conversations in multiple Indian languages, such as Hindi, Tamil, Telugu, Bengali, and others.
    Objective:
        Convert audio recordings into text transcriptions in the original language of the conversation, ensuring high fidelity and accuracy.

2. Language Identification

    Technology:
        Language identification will be handled using LLaMA or a similar NLP-based model, trained to recognize various Indian languages from the transcribed text.
    Objective:
        Automatically detect the language of the conversation and appropriately tag the transcription for further processing, enabling a multi-language system.

3. Key Entity Extraction

    Technology:
        LLaMA or other suitable NLP models will be used for Named Entity Recognition (NER), which will focus on identifying and extracting essential details such as names, addresses, phone numbers, account information, and other relevant entities from the transcriptions.
    Features:
        The system will extract key entities in both the original language of the conversation and their corresponding English translations.
        If specific entities are absent in the conversation, the system will return blank or null values for those entities, ensuring seamless integration without unnecessary errors or noise in the data.

4. Translation

    Technology:
        NLP translation models will be employed to convert the extracted transcriptions and key entities into English, ensuring clarity and consistency for downstream processing.
    Objective:
        Translate the conversation's core elements to English while retaining the meaning and context, helping streamline operations across multilingual environments.

5. Summarization

    Technology:
        NLP-based summarization models will be integrated to condense long conversations into brief, actionable summaries.
    Objective:
        Provide concise summaries of calls, focusing on the key points and outcomes, improving operational efficiency by reducing the need to process entire conversations manually.

6. Integration with Existing Systems

    Objective:
        Integrate the solution with existing systems such as the customer’s CRM and call recording infrastructure.
        Automate updates of customer records with transcribed and summarized information, improving workflow and reducing manual effort.

**Proof of Concept (PoC) Plan:**

    Demo Objectives:
        Build a demonstration that showcases the system's ability to transcribe, summarize, and extract entities from audio recordings.
        Support live audio input or pre-recorded audio file uploads.

    Flow:
        Input: The system accepts an audio file in an Indian language.
        Process:
            Language identification and transcription using Whisper.
            Entity extraction and summarization using LLaMA.
            Optional translation of extracted data into English.
        Output: The system provides a structured output, including the transcription, identified entities, and summary.

**Scenarios:**

    Language Identification:
        The system should accurately identify the language of the uploaded audio file from the range of supported Indian languages.
    Summarization:
        The solution must summarise the conversation in the English language/
        


**Technology Stack:**

    AI Models: Whisper for ASR, LLaMA for NLP tasks (entity extraction, language identification, and summarization).
    Backend: Python FastAPI for API creation and managing workflows.
    Frontend: NextJS for a dynamic and interactive user interface.


**[Backend Setup instructions](https://github.com/joshsoftware/lingo.ai/blob/dev/service/README.md)**

**[Frontend Setup instructions](https://github.com/joshsoftware/lingo.ai/blob/dev/app/README.md)**

**Start the services**

For Python server: _sudo service lingo-uvicorn restart_

For Next UI: _sudo service lingo-ui restart_

**Log**

 For Python server: _journalctl -u lingo-uvicorn_

For Next UI: _journalctl -u lingo-ui_

