import io
import os
from urllib.request import Request, urlopen
from PyPDF2 import PdfFileReader
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2 import service_account
from utils.constants import SCOPES
import logging
from googleapiclient.errors import HttpError

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def read_pdf(file_path):
    """Reads and prints the content of a .pdf file."""
    print(f"\nReading: {file_path}")
    try:
        remote_file = urlopen(Request(file_path)).read()
        memory_file = io.BytesIO(remote_file)
        
        reader = PdfFileReader(memory_file)
        
        for page in reader.pages:
            print(page.extract_text())
            content = page.extract_text()
            return content
    except Exception as e:
        print(f"Error reading .pdf file {file_path}: {e}")
        return f"Error reading .pdf file {file_path}: {e}"

def process_directory(directory_path):
    """Reads all .docx and .pdf files in the given directory."""
    try:
        for root, _, files in os.walk(directory_path):
            cnt = 0
            for file in files:
                cnt+=1
                print("***********************\n\n\nReading File No : ",cnt)

                original_file_path = os.path.join(root, file)
                if " " in file:
                    new_file_name = file.replace(" ", "_")
                    new_file_path = os.path.join(root, new_file_name)
                    os.rename(original_file_path, new_file_path)
                    print(f"Renamed file: {original_file_path} -> {new_file_path}")
                    file = new_file_name
                
                file_path = os.path.join(root, file)

                if file.lower().endswith('.docx'):
                    read_docx(file_path)
                elif file.lower().endswith('.pdf'):
                    read_pdf(file_path)
                else:
                    print(f"Unsupported file type: {file_path}")
    except Exception as e:
        print(f"Error processing directory {directory_path}: {e}")

if __name__ == "__main__":
    directory_path = input("Enter the directory path: ")
    process_directory(directory_path)

def get_credentials():
    """Get Google Docs API credentials."""
    try:
        credentials = service_account.Credentials.from_service_account_file(
            os.getenv("SERVICE_ACCOUNT_FILE"), scopes=SCOPES
        )
        logger.info("Credentials successfully loaded.")
        return credentials
    except Exception as error:
        logger.error(f"An error occurred while loading credentials: {error}")
        return None

def create_docs_service():
    """Create and return a Google Docs API service object."""
    creds = get_credentials()
    if not creds:
        logger.error("Unable to obtain credentials.")
        return None
    return build("docs", "v1", credentials=creds)

def read_google_doc(doc_id):
    """Read the content of a Google Docs document."""
    docs_service = create_docs_service()
    logger.info(f"Reading Google Docs document with ID: {doc_id}")
    try:
        # Retrieve the Google Docs document content
        document = docs_service.documents().get(documentId=doc_id).execute()

        # Extract the document content (text)
        doc_content = document.get('body').get('content')
        
        text = ''
        for element in doc_content:
            if 'paragraph' in element:
                for run in element['paragraph'].get('elements', []):
                    if 'textRun' in run:
                        text += run['textRun'].get('content')

        return text
    except HttpError as error:
        logger.error(f"Error reading Google Docs document: {error}")
        return None
    except Exception as error:
        logger.error(f"Unexpected error: {error}")
        return None

def process_transcript_from_google_doc(google_doc_url):
    """Process transcript from Google Doc."""
    try:
        doc_id = google_doc_url.split('/d/')[1].split('/')[0]
        transcription = read_google_doc(doc_id)
        if transcription is None:
            logger.error("Failed to retrieve transcription from the document.")
            return None
        return transcription
    except Exception as error:
        logger.error(f"Error processing Google Doc URL: {error}")
        return None

def read_docx(file_url):
    """Reads and extracts the relevant sections from a .pdf or a .docx file into a dictionary."""
    # ASD :TODO Add file handling for .pdf and .docx here if necessary.
    # For now, assume the file is a Google Docs URL
    result = process_transcript_from_google_doc(file_url)
    return {
        "result": result,
    }