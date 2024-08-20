# README
Voice to text from major languages supported by whisper model, this applicationn will transcibe the uploaded or recored audio to its original language, translate to Englis and and summarise in English.

**Supported Languages (by whispher model)**
1. Indian Languages:
    _Hindi, Kannada, Marathi and Tamil_

2. Other languages:
    _Afrikaans, Arabic, Armenian, Azerbaijani, Belarusian, Bosnian, Bulgarian, Catalan, Chinese, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, Galician, German, Greek, Hebrew, Hungarian, Icelandic, Indonesian, Italian, Japanese, Kazakh, Korean, Latvian, Lithuanian, Macedonian, Malay, Maori, Nepali, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swahili, Swedish, Tagalog, Thai, Turkish, Ukrainian, Urdu, Vietnamese, and Welsh._



**Supported audio format**

_m4a, mp3, webm, mp4, mpga, wav, mpeg_

**Pre-requisite:**
Note: Following instructions a for linux, 
python 3.8.1 or above

    sudo apt-get update
    sudo apt-get install python3.8.1

Ollam
For Linux:
     curl -fsSL https://ollama.com/install.sh | sh
For Mac:
    https://ollama.com/download/Ollama-darwin.zip
For Windows
    https://ollama.com/download/OllamaSetup.exe
    
Llama 3.1 model

     ollama run llama3.1

**Setup**
Clone this github repository
    git clone

Create python virtual environment

    python3 -m venv lingo .

Activate the virtual environment

    source lingo/bin/activate

Install dependencies

    pip install -r requirements.txt

Execute the applilcation

    python3 app.py

It will execute and prints the url, http://localhost:77434, in the output console, copy the url and paste in the brwoser
    
