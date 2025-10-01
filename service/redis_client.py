import redis
import json
import uuid
from typing import Dict, Any, Optional
from config import redis_host, redis_port, redis_db, redis_password
from logger import logger

class RedisSessionManager:
    def __init__(self):
        """Initialize Redis client for session management."""
        try:
            self.redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                password=redis_password,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Redis connection established successfully")
        except redis.ConnectionError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
        except Exception as e:
            logger.error(f"Error initializing Redis client: {e}")
            raise

    def generate_session_id(self) -> str:
        """Generate a unique session ID."""
        return str(uuid.uuid4())

    def store_session(self, session_id: str, session_data: Dict[str, Any], expiry_seconds: int = 600) -> bool:
        """
        Store session data in Redis.
        
        Args:
            session_id: Unique session identifier
            session_data: Dictionary containing session information
            expiry_seconds: Session expiry time in seconds (default 10 mins)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            session_json = json.dumps(session_data)
            result = self.redis_client.setex(
                name=f"session:{session_id}",
                time=expiry_seconds,
                value=session_json
            )
            logger.info(f"Session {session_id} stored successfully")
            return result
        except Exception as e:
            logger.error(f"Error storing session {session_id}: {e}")
            return False

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve session data from Redis.
        
        Args:
            session_id: Unique session identifier
            
        Returns:
            Dict containing session data or None if not found
        """
        try:
            session_json = self.redis_client.get(f"session:{session_id}")
            if session_json:
                session_data = json.loads(session_json)
                logger.info(f"Session {session_id} retrieved successfully")
                return session_data
            else:
                logger.info(f"Session {session_id} not found")
                return None
        except Exception as e:
            logger.error(f"Error retrieving session {session_id}: {e}")
            return None

    def update_session(self, session_id: str, update_data: Dict[str, Any], expiry_seconds: int = 3600) -> bool:
        """
        Update existing session data by merging with new data.
        
        Args:
            session_id: Unique session identifier
            update_data: Dictionary containing new data to merge
            expiry_seconds: Reset expiry time in seconds
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Get existing session data
            existing_data = self.get_session(session_id)
            if existing_data is None:
                logger.warning(f"Session {session_id} not found for update")
                return False
            
            # Merge new data with existing data
            merged_data = {**existing_data, **update_data}
            
            # Store updated data
            return self.store_session(session_id, merged_data, expiry_seconds)
        except Exception as e:
            logger.error(f"Error updating session {session_id}: {e}")
            return False

    def delete_session(self, session_id: str) -> bool:
        """
        Delete session from Redis.
        
        Args:
            session_id: Unique session identifier
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            result = self.redis_client.delete(f"session:{session_id}")
            logger.info(f"Session {session_id} deleted: {bool(result)}")
            return bool(result)
        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {e}")
            return False

    def session_exists(self, session_id: str) -> bool:
        """
        Check if session exists in Redis.
        
        Args:
            session_id: Unique session identifier
            
        Returns:
            bool: True if session exists, False otherwise
        """
        try:
            exists = self.redis_client.exists(f"session:{session_id}")
            return bool(exists)
        except Exception as e:
            logger.error(f"Error checking session existence {session_id}: {e}")
            return False

    def extend_session(self, session_id: str, expiry_seconds: int = 600) -> bool:
        """
        Extend the session expiry time.
        
        Args:
            session_id: Unique session identifier
            expiry_seconds: New expiry time in seconds
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            result = self.redis_client.expire(f"session:{session_id}", expiry_seconds)
            logger.info(f"Session {session_id} expiry extended: {bool(result)}")
            return bool(result)
        except Exception as e:
            logger.error(f"Error extending session expiry {session_id}: {e}")
            return False

# Global session manager instance
session_manager = RedisSessionManager()
