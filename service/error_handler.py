"""
Global exception handler for FastAPI
Catches all unhandled exceptions and logs them
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
from logger import logger
from error_logger import log_api_error
from typing import Dict, Any
import json

async def extract_request_context(request: Request) -> Dict[str, Any]:
    """Extract request context for error logging"""
    try:
        # Get request body if available
        request_body = None
        try:
            if request.method in ["POST", "PUT", "PATCH"]:
                body = await request.body()
                if body:
                    try:
                        request_body = json.loads(body.decode("utf-8"))
                    except:
                        request_body = {"raw": body.decode("utf-8")[:1000]}
        except:
            pass
        
        # Get query parameters
        query_params = dict(request.query_params) if request.query_params else None
        
        # Get headers (sanitized)
        headers = {}
        sensitive_headers = {"authorization", "cookie", "x-api-key"}
        for key, value in request.headers.items():
            if key.lower() in sensitive_headers:
                headers[key] = "[REDACTED]"
            else:
                headers[key] = value
        
        return {
            "request_body": request_body,
            "query_params": query_params,
            "headers": headers,
        }
    except Exception as e:
        logger.warning(f"Failed to extract request context: {e}")
        return {}

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler for all unhandled exceptions"""
    try:
        # Extract request context
        context = await extract_request_context(request)
        
        # Get correlation ID if set by middleware
        correlation_id = getattr(request.state, "correlation_id", None)
        
        # Log error using the error logger
        log_api_error(
            endpoint=request.url.path,
            error=exc,
            failure_stage="exception_handler",
            http_method=request.method,
            request_headers=context.get("headers"),
            request_body=context.get("request_body"),
            request_query_params=context.get("query_params"),
            response_status_code=500,
            correlation_id=correlation_id,
            ip_address=request.client.host if request.client else None,
        )
        
        logger.error(f"Unhandled exception: {traceback.format_exc()}")
        
        return JSONResponse(
            status_code=500,
            content={
                "message": "Internal server error",
                "error_type": type(exc).__name__,
                "correlation_id": correlation_id,
            }
        )
    except Exception as e:
        logger.error(f"Error in global exception handler: {e}")
        return JSONResponse(
            status_code=500,
            content={"message": "Internal server error"}
        )

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handler for HTTP exceptions (4xx, etc.)"""
    try:
        context = await extract_request_context(request)
        correlation_id = getattr(request.state, "correlation_id", None)
        
        # Log HTTP errors (4xx and 5xx)
        log_api_error(
            endpoint=request.url.path,
            error=exc,
            failure_stage="http_exception",
            http_method=request.method,
            request_headers=context.get("headers"),
            request_body=context.get("request_body"),
            request_query_params=context.get("query_params"),
            response_status_code=exc.status_code,
            response_body=str(exc.detail),
            correlation_id=correlation_id,
            ip_address=request.client.host if request.client else None,
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "message": exc.detail,
                "correlation_id": correlation_id,
            }
        )
    except Exception as e:
        logger.error(f"Error in HTTP exception handler: {e}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"message": exc.detail}
        )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handler for request validation errors"""
    try:
        context = await extract_request_context(request)
        correlation_id = getattr(request.state, "correlation_id", None)
        
        # Log validation errors
        log_api_error(
            endpoint=request.url.path,
            error=exc,
            failure_stage="validation",
            http_method=request.method,
            request_headers=context.get("headers"),
            request_body=context.get("request_body"),
            request_query_params=context.get("query_params"),
            response_status_code=422,
            response_body=json.dumps({"errors": exc.errors()}),
            preprocessing_logs_text=f"Validation errors: {json.dumps(exc.errors(), indent=2)}",
            correlation_id=correlation_id,
            ip_address=request.client.host if request.client else None,
        )
        
        return JSONResponse(
            status_code=422,
            content={
                "message": "Validation error",
                "errors": exc.errors(),
                "correlation_id": correlation_id,
            }
        )
    except Exception as e:
        logger.error(f"Error in validation exception handler: {e}")
        return JSONResponse(
            status_code=422,
            content={"message": "Validation error", "errors": exc.errors()}
        )
