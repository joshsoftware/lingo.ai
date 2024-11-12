from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import os
from dotenv import load_dotenv
from google.oauth2 import service_account
from datetime import datetime, timezone
from audio_service import translate_with_whisper
from summarizer import summarize_using_openai
from logger import logger
import ssl
import httplib2
from google_auth_httplib2 import AuthorizedHttp
import time
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# If modifying these scopes, delete the file token.json.
SCOPES = [
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive"
]

def get_credentials():
    """Get Google Drive API credentials."""
    credentials = service_account.Credentials.from_service_account_file(
        os.getenv("SERVICE_ACCOUNT_FILE"), scopes=SCOPES)
    return credentials

def user_account_creds():
    '''Get user account credentials'''
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                os.getenv("GOOGLE_ACCOUNT_FILE"),
                SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open("token.json", "w") as token:
            token.write(creds.to_json())
    return creds
    
def get_folder_id(service, folder_name):
    """Get the ID of a folder by name."""
    try:
        results = (
            service.files()
            .list(q=f"mimeType='application/vnd.google-apps.folder' and name='{folder_name}'", fields="files(id, name)")
            .execute()
        )
        items = results.get("files", [])
        if not items:
            logger.info(f"No folder found with the name '{folder_name}'.")
            return None
        return items[0]['id']
    except HttpError as error:
        logger.warning(f"An error occurred: {error}")
        return None

def get_files_in_folder(service, folder_id):
    """Get all files in a specific folder by folder ID."""
    try:
        results = (
            service.files()
            .list(q=f"'{folder_id}' in parents", fields="nextPageToken, files(id, name, createdTime, modifiedTime, size, mimeType, webViewLink)")
            .execute()
        )
        items = results.get("files", [])
        return items
    except HttpError as error:
        logger.warning(f"An error occurred: {error}")
        return []
    
def make_file_public(service, file_id):
    """Make a file public."""
    try:
        permission = {
            'type': 'anyone',
            'role': 'reader',
        }
        service.permissions().create(fileId=file_id, body=permission).execute()
        service.files().get(fileId=file_id, fields='webViewLink').execute()
        return 'https://www.googleapis.com/drive/v3/files/'+ file_id + '?alt=media&key=' + os.getenv("GCP_API_KEY")
    except HttpError as error:
        logger.warning(f"An error occurred while making file Public: {error}")
        return None

def revoke_public_access_with_retry(service, file_id, max_retries=3):
    """Attempt to revoke public access, with retries in case of SSL errors."""
    for attempt in range(max_retries):
        try:
            permissions = service.permissions().list(fileId=file_id).execute()
            for permission in permissions.get('permissions', []):
                if permission['role'] == 'reader' and permission['type'] == 'anyone':
                    service.permissions().delete(fileId=file_id, permissionId=permission['id']).execute()
            break
        except (HttpError, ssl.SSLEOFError) as e:
            logger.warning(f"Attempt {attempt + 1} failed for revoke public access: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                logger.warning("Max retries reached. Could not revoke public access.")


def filter_files_by_date(files):
    """Filter files to include only those created or modified today."""
    today = datetime.now(timezone.utc).date()
    filtered_files = []
    for file in files:
        created_time = datetime.fromisoformat(file['createdTime'][:-1]).date()
        modified_time = datetime.fromisoformat(file['modifiedTime'][:-1]).date()
        if created_time == today:
            filtered_files.append(file)
    return filtered_files

ssl_context = ssl.create_default_context()
ssl_context.set_ciphers("DEFAULT@SECLEVEL=1")

def append_to_sheet(sheets_service, sheet_id, data, retries=3):
    body = {'values': data}
    for attempt in range(retries):
        try:
            sheets_service.spreadsheets().values().append(
                spreadsheetId=sheet_id,
                range="Sheet1!A:C",
                valueInputOption="RAW",
                insertDataOption="INSERT_ROWS",
                body=body
            ).execute()
            break
        except ssl.SSLEOFError:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            else:
                raise

def get_transcription_and_summary(file, drive_service, existing_file_ids, new_rows, results):
    public_link = make_file_public(drive_service, file['id'])
    if file['id'] and file['id'] not in existing_file_ids:
        
        mime_type = file.get('mimeType', '')
        if mime_type.startswith('audio/') or mime_type.startswith('video/'):
            translation = translate_with_whisper(public_link)
            logger.info(f"Translation for file '{file['name']}' completed.")
            logger.info("Translation: %s", translation)
            
            summary = summarize_using_openai(translation)
            logger.info(f"Summary for file '{file['name']}' completed.")
            logger.info("Summary: %s", summary)

            created_time_str = file['createdTime'].replace("Z", "+00:00")
            created_time = datetime.fromisoformat(created_time_str).date()

            results.append({
                'file id': file['id'],
                'transcription': translation,
                'summary': summary
            })
            
            new_rows.append([file['id'], file['name'], translation, summary, created_time.isoformat()])
            
        revoke_public_access_with_retry(drive_service, file['id'])


def main():
    ssl_context = ssl.create_default_context()
    ssl_context.set_ciphers("DEFAULT@SECLEVEL=1")

    http = httplib2.Http()
    http.ssl_context = ssl_context
    creds = get_credentials()
    authed_http = AuthorizedHttp(creds, http=http)

    drive_service = build("drive", "v3", http=authed_http)
    sheets_service = build("sheets", "v4", http=authed_http)
 
    sheet_id = "1fDoslff2Asbrys5xvFtHgiBWW02555Or_vOTurTC1yk"
    
    folder_name = "Interview Recordings"
    folder_id = get_folder_id(drive_service, folder_name)
    
    try:
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=sheet_id, range="Sheet1!A:A"
        ).execute()
        values = result.get('values', [])
        existing_file_ids = {row[0] for row in values if row}
    except HttpError as error:
        logger.warning(f"An error occurred while retrieving sheet data: {error}")
        return

    results = []

    if folder_id:
        files = get_files_in_folder(drive_service, folder_id)
        files = filter_files_by_date(files)        
        new_rows = []

        for file in files:
            get_transcription_and_summary(file, drive_service, existing_file_ids, new_rows, results)

        if new_rows:
            append_to_sheet(sheets_service, sheet_id, new_rows)
        
        return results
    
    else:
        return []


if __name__ == "__main__":
    files = main()
