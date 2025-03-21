from fastapi.security import OAuth2AuthorizationCodeBearer


SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
CLIENT_SECRETS_FILE = 'credentials.json'
REDIRECT_URI = "http://localhost:8001/auth/google/callback"
OAUTH2_SCHEME = OAuth2AuthorizationCodeBearer(
    tokenUrl="",
    authorizationUrl="https://accounts.google.com/o/oauth2/auth"
)
USER_ID = ""
