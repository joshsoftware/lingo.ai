from fastapi import APIRouter
from google_auth_oauthlib.flow import Flow
from app.core.config import CLIENT_SECRETS_FILE, SCOPES, REDIRECT_URI

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/google")
def authenticate_google():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
    return {"auth_url": auth_url}


@router.get("/google/callback")
def google_callback(code: str):
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    flow.fetch_token(code=code)
    creds = flow.credentials

    return {
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "expiry": creds.expiry
    }
