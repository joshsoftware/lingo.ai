import os
import asyncpg
import logging
from typing import Optional, Tuple
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime

logger = logging.getLogger(__name__)

class GoogleAuthHelper:
    def __init__(self):
        self.client_id = os.getenv("CLIENT_ID")
        self.client_secret = os.getenv("CLIENT_SECRET")
        self.token_uri = os.getenv("TOKEN_URI", "https://oauth2.googleapis.com/token")
        self.db_url = os.getenv("DATABASE_URL", "postgresql://lingo_user:lingo_password@localhost:5432/lingo_db")
        
        # Connection pool
        self._pool: Optional[asyncpg.Pool] = None
    
    async def _get_pool(self) -> asyncpg.Pool:
        """Get or create connection pool"""
        if self._pool is None:
            self._pool = await asyncpg.create_pool(
                self.db_url,
                min_size=1,
                max_size=10,
                command_timeout=30
            )
        return self._pool
    
    async def get_user_tokens(self, user_id: str) -> Optional[Tuple[str, str]]:
        """Get tokens from database for a user"""
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                'SELECT "accessToken", "refreshToken" FROM bot WHERE "user_id" = $1',
                user_id
            )
            if row and row[0] and row[1]:
                return row[0], row[1]
            return None
    
    async def update_tokens(self, user_id: str, access_token: str, refresh_token: str = None):
        """Update tokens in database"""
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            if refresh_token:
                await conn.execute(
                    'UPDATE bot SET "accessToken" = $1, "refreshToken" = $2, "updatedAt" = $3 WHERE "user_id" = $4',
                    access_token, refresh_token, datetime.utcnow(), user_id
                )
            else:
                await conn.execute(
                    'UPDATE bot SET "accessToken" = $1, "updatedAt" = $2 WHERE "user_id" = $3',
                    access_token, datetime.utcnow(), user_id
                )
    
    def create_credentials(self, access_token: str, refresh_token: str) -> Credentials:
        """Create Google credentials object"""
        return Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri=self.token_uri,
            client_id=self.client_id,
            client_secret=self.client_secret
        )
    
    async def get_valid_credentials(self, user_id: str) -> Optional[Credentials]:
        """
        Get valid Google credentials for a user, refreshing if necessary.
        This is the main function that handles token refresh automatically.
        """
        try:
            # Get tokens from database
            tokens = await self.get_user_tokens(user_id)
            if not tokens:
                logger.warning(f"No tokens found for user {user_id}")
                return None
            
            access_token, refresh_token = tokens
            
            # Create credentials
            creds = self.create_credentials(access_token, refresh_token)
            
            # Check if token is expired and refresh if needed
            if creds.expired and creds.refresh_token:
                logger.info(f"Token expired for user {user_id}, refreshing...")
                try:
                    creds.refresh(Request())
                    
                    # Update database with new tokens
                    new_refresh_token = creds.refresh_token or refresh_token
                    await self.update_tokens(user_id, creds.token, new_refresh_token)
                    
                    logger.info(f"Token refreshed successfully for user {user_id}")
                except Exception as e:
                    logger.error(f"Failed to refresh token for user {user_id}: {e}")
                    return None
            
            return creds
            
        except Exception as e:
            logger.error(f"Error getting valid credentials for user {user_id}: {e}")
            return None
    
    def build_calendar_service(self, credentials: Credentials):
        """Build Google Calendar service with credentials"""
        return build('calendar', 'v3', credentials=credentials, cache_discovery=False)
    
    async def cleanup(self):
        """Cleanup resources"""
        if self._pool:
            await self._pool.close()
            self._pool = None

# Global instance
google_auth_helper = GoogleAuthHelper() 