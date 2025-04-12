from fastapi.security import OAuth2AuthorizationCodeBearer
import os


SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
base_dir = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRETS_FILE = os.path.join(base_dir, "credentials.json")
# CLIENT_SECRETS_FILE = 'credentials.json'
REDIRECT_URI = "http://localhost:8001/auth/google/callback"
OAUTH2_SCHEME = OAuth2AuthorizationCodeBearer(
    tokenUrl="",
    authorizationUrl="https://accounts.google.com/o/oauth2/auth"
)
USER_ID = "huvcypmasa5xwgyf"
WEBHOOK_ADDR = "https://7d7d-202-149-221-42.ngrok-free.app/meetings/webhook/calendar"