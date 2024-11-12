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

load_dotenv()

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
            print(f"No folder found with the name '{folder_name}'.")
            return None
        return items[0]['id']
    except HttpError as error:
        print(f"An error occurred: {error}")
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
        print(f"An error occurred: {error}")
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
        print(f"An error occurred: {error}")
        return None

def revoke_public_access(service, file_id):
    """Revoke public access to a file."""
    try:
        permissions = service.permissions().list(fileId=file_id).execute()
        for permission in permissions.get('permissions', []):
            if permission.get('type') == 'anyone':
                service.permissions().delete(fileId=file_id, permissionId=permission['id']).execute()
    except HttpError as error:
        print(f"An error occurred: {error}")


def filter_files_by_date(files):
    """Filter files to include only those created or modified today."""
    today = datetime.now(timezone.utc).date()
    filtered_files = []
    for file in files:
        created_time = datetime.fromisoformat(file['createdTime'][:-1]).date()
        modified_time = datetime.fromisoformat(file['modifiedTime'][:-1]).date()
        if created_time == today and modified_time == today:
            filtered_files.append(file)
    return filtered_files


def main():
    """Main function to return the names and ids of all files in the 'recordings' folder."""
    creds = get_credentials()
    service = build("drive", "v3", credentials=creds)
    
    folder_name = "Interview Recordings"
    folder_id = get_folder_id(service, folder_name)
    
    results = []
    
    if folder_id:
        files = get_files_in_folder(service, folder_id)
        files = filter_files_by_date(files)
        
        for file in files:
            public_link = make_file_public(service, file['id'])
            if public_link:
                print(f"Public link for file '{file['name']}': {public_link}")
                
                translation = translate_with_whisper(public_link)
                logger.info(f"Translation for file '{file['name']}' completed.")
                print("Translation:",translation)
                summary = summarize_using_openai(translation)
                
                logger.info(f"Summary for file '{file['name']}' completed.")
                print("Summary:",summary)
                                
                revoke_public_access(service, file['id'])
                print(f"Public access revoked for file '{file['name']}'")
                
                results.append({
                    'file_url': public_link,
                    'translation': translation,
                    'summary': summary
                })
            
        return results
    
    else:
        return []


if __name__ == "__main__":
    files = main()
    print(files)