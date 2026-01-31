"""
Global error logging middleware for FastAPI
Captures all API errors automatically
"""
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message
import time
import json
import traceback
from typing import Dict, Any, Optional
from banking.database import SessionLocal
from banking.error_logs import APIErrorLog
from logger import logger
import uuid

# Sensitive fields to sanitize from request/response
SENSITIVE_FIELDS = {
    "password", "password_hash", "token", "access_token", "refresh_token",
    "authorization", "api_key", "apikey", "secret", "secret_key", "private_key",
    "credit_card", "card_number", "cvv", "ssn", "social_security_number"
}

def sanitize_data(data: Any, max_depth: int = 10) -> Any:
    """
    Recursively sanitize sensitive data from dictionaries/lists.
    Replaces sensitive field values with '[REDACTED]'
    """
    if max_depth <= 0:
        return data
    
    if isinstance(data, dict):
        sanitized = {}
        for key, value in data.items():
            key_lower = str(key).lower()
            # Check if key contains sensitive field name
            is_sensitive = any(sensitive in key_lower for sensitive in SENSITIVE_FIELDS)
            
            if is_sensitive:
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, (dict, list)):
                sanitized[key] = sanitize_data(value, max_depth - 1)
            else:
                sanitized[key] = value
        return sanitized
    
    elif isinstance(data, list):
        return [sanitize_data(item, max_depth - 1) for item in data]
    
    return data

def sanitize_headers(headers: Dict[str, str]) -> Dict[str, str]:
    """Sanitize sensitive headers"""
    sanitized = {}
    sensitive_headers = {"authorization", "cookie", "x-api-key", "x-auth-token"}
    
    for key, value in headers.items():
        key_lower = key.lower()
        if any(sensitive in key_lower for sensitive in sensitive_headers):
            sanitized[key] = "[REDACTED]"
        else:
            sanitized[key] = value
    
    return sanitized

async def extract_request_body(request: Request) -> Optional[Dict[str, Any]]:
    """Extract and parse request body"""
    try:
        # Check content type
        content_type = request.headers.get("content-type", "").lower()
        
        if "application/json" in content_type:
            body = await request.json()
            return sanitize_data(body)
        elif "application/x-www-form-urlencoded" in content_type:
            form = await request.form()
            form_dict = {key: value for key, value in form.items()}
            return sanitize_data(form_dict)
        elif "multipart/form-data" in content_type:
            form = await request.form()
            form_dict = {}
            for key, value in form.items():
                # Handle file uploads
                if hasattr(value, "filename"):
                    form_dict[key] = {
                        "filename": value.filename,
                        "content_type": value.content_type,
                        "size": getattr(value, "size", None),
                        "type": "file"
                    }
                else:
                    form_dict[key] = value
            return sanitize_data(form_dict)
        else:
            # Try to read as text
            body = await request.body()
            if body:
                try:
                    return {"raw": body.decode("utf-8")[:1000]}  # Limit size
                except:
                    return {"raw": "[BINARY_DATA]"}
    except Exception as e:
        logger.warning(f"Failed to extract request body: {e}")
        return None

def extract_file_metadata(request: Request) -> Optional[Dict[str, Any]]:
    """Extract file metadata from request"""
    try:
        content_type = request.headers.get("content-type", "").lower()
        files_metadata = []
        
        if "multipart/form-data" in content_type:
            # Files would be extracted in extract_request_body
            # This is a placeholder - actual file extraction happens in the endpoint
            pass
        
        return files_metadata if files_metadata else None
    except Exception as e:
        logger.warning(f"Failed to extract file metadata: {e}")
        return None

class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all API errors"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        
        # Store request details (extract before processing to avoid consuming body)
        request_headers = sanitize_headers(dict(request.headers))
        request_query_params = dict(request.query_params) if request.query_params else None
        
        # For request body, we'll try to peek but not consume
        # Store in request.state so endpoints can still read it
        request_body = None
        try:
            # Only extract body for non-streaming requests
            if request.method in ["POST", "PUT", "PATCH"]:
                # Peek at body without consuming (this is tricky - we'll handle it in exception handlers)
                # For now, we'll extract it but endpoints should still be able to read it
                # FastAPI handles this internally, so we'll skip body extraction here
                # and let exception handlers extract it if needed
                pass
        except:
            pass
        
        try:
            # Process request
            response = await call_next(request)
            
            execution_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            # Log errors (4xx and 5xx status codes)
            if response.status_code >= 400:
                # Extract request body from request.state if stored by endpoint
                # Otherwise, try to extract it now (may fail if already consumed)
                extracted_request_body = getattr(request.state, "request_body", None)
                if extracted_request_body is None:
                    try:
                        extracted_request_body = await extract_request_body(request)
                    except:
                        extracted_request_body = None
                
                # Capture response body for error logging
                response_body_text = None
                try:
                    # Try to get response body if it's already rendered
                    if hasattr(response, "body") and response.body:
                        response_body_text = response.body.decode("utf-8")[:5000] if isinstance(response.body, bytes) else str(response.body)[:5000]
                except Exception as e:
                    logger.warning(f"Failed to capture response body: {e}")
                
                # Log error asynchronously without blocking
                await self._log_error(
                    request=request,
                    response_body=response_body_text,
                    error=None,
                    status_code=response.status_code,
                    execution_time=execution_time,
                    request_body=extracted_request_body,
                    request_headers=request_headers,
                    request_query_params=request_query_params,
                    correlation_id=correlation_id,
                )
            
            return response
            
        except Exception as e:
            execution_time = (time.time() - start_time) * 1000
            
            # Try to extract request body if not already extracted
            extracted_request_body = getattr(request.state, "request_body", None)
            if extracted_request_body is None:
                try:
                    extracted_request_body = await extract_request_body(request)
                except:
                    extracted_request_body = None
            
            # Log the exception
            await self._log_error(
                request=request,
                response_body=None,
                error=e,
                status_code=500,
                execution_time=execution_time,
                request_body=extracted_request_body,
                request_headers=request_headers,
                request_query_params=request_query_params,
                correlation_id=correlation_id,
            )
            
            # Return error response
            return JSONResponse(
                status_code=500,
                content={
                    "message": str(e),
                    "correlation_id": correlation_id,
                    "error_type": type(e).__name__
                }
            )
    
    async def _log_error(
        self,
        request: Request,
        response_body: Optional[str] = None,
        error: Optional[Exception] = None,
        status_code: int = 500,
        execution_time: float = 0.0,
        request_body: Optional[Dict[str, Any]] = None,
        request_headers: Optional[Dict[str, str]] = None,
        request_query_params: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
    ):
        """Log error to database"""
        try:
            db = SessionLocal()
            try:
                # Extract user info if available (from request state or headers)
                user_id = getattr(request.state, "user_id", None)
                ip_address = request.client.host if request.client else None
                
                # Extract file metadata from request body
                attachment_metadata = None
                attachment_storage_url = None
                if request_body:
                    for key, value in request_body.items():
                        if isinstance(value, dict) and value.get("type") == "file":
                            attachment_metadata = {
                                "field_name": key,
                                "filename": value.get("filename"),
                                "content_type": value.get("content_type"),
                                "size": value.get("size"),
                            }
                            # If there's a storage URL in metadata, extract it
                            if "storage_url" in value:
                                attachment_storage_url = value.get("storage_url")
                            break
                
                # Create error object if not provided
                if error is None:
                    class HTTPError(Exception):
                        pass
                    error = HTTPError(f"HTTP {status_code}")
                
                error_log = APIErrorLog(
                    endpoint=request.url.path,
                    http_method=request.method,
                    request_headers=request_headers,
                    request_body=request_body,
                    request_query_params=request_query_params,
                    response_status_code=status_code,
                    response_body=response_body,
                    execution_time_ms=execution_time,
                    attachment_metadata=attachment_metadata,
                    attachment_storage_url=attachment_storage_url,
                    error_type=type(error).__name__,
                    error_message=str(error),
                    error_traceback=traceback.format_exc() if error else None,
                    failure_stage=None,  # Will be set by specific endpoints if needed
                    user_id=user_id,
                    ip_address=ip_address,
                    correlation_id=correlation_id,
                )
                
                db.add(error_log)
                db.commit()
                logger.info(f"Error logged to database: {error_log.id} (correlation_id: {correlation_id})")
            except Exception as db_error:
                logger.error(f"Failed to log error to database: {db_error}")
                logger.error(traceback.format_exc())
                db.rollback()
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Critical error in error logging middleware: {e}")
            logger.error(traceback.format_exc())
