import os
import re
from fastapi import APIRouter, Query, Depends, HTTPException
from fastapi.responses import JSONResponse, Response, FileResponse
from banking.database import SessionLocal
from banking.error_logs import APIErrorLog
from error_logger import ERROR_AUDIO_DIR
from sqlalchemy import desc, func
from typing import Optional
from datetime import datetime
import csv
import io
from logger import logger

router = APIRouter(prefix="/admin", tags=["admin"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_admin_role():
    """
    TODO: Implement proper admin authentication/authorization
    For now, this is a placeholder - you should add proper JWT/auth checks
    """
    return True

@router.get("/error-logs")
async def get_error_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    endpoint: Optional[str] = None,
    failure_stage: Optional[str] = None,
    error_type: Optional[str] = None,
    session_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db = Depends(get_db),
    _admin_check = Depends(check_admin_role),
):
    """
    Get paginated list of error logs with optional filters.
    Only accessible by admin users.
    """
    try:
        query = db.query(APIErrorLog)
        
        # Apply filters
        if endpoint:
            query = query.filter(APIErrorLog.endpoint.contains(endpoint))
        if failure_stage:
            query = query.filter(APIErrorLog.failure_stage == failure_stage)
        if error_type:
            query = query.filter(APIErrorLog.error_type == error_type)
        if session_id:
            query = query.filter(APIErrorLog.session_id == session_id)
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(APIErrorLog.created_at >= start_dt)
            except ValueError:
                pass
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(APIErrorLog.created_at <= end_dt)
            except ValueError:
                pass
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        error_logs = query.order_by(desc(APIErrorLog.created_at)).offset(skip).limit(limit).all()
        
        # Convert to dict
        logs_data = [log.to_dict() for log in error_logs]
        
        return JSONResponse(content={
            "total": total,
            "skip": skip,
            "limit": limit,
            "data": logs_data
        })
    except Exception as e:
        logger.error(f"Error fetching error logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/error-logs/stats")
async def get_error_stats(
    db = Depends(get_db),
    _admin_check = Depends(check_admin_role),
):
    """
    Get statistics about error logs.
    """
    try:
        total_errors = db.query(func.count(APIErrorLog.id)).scalar()
        
        # Errors by failure stage
        stage_stats = db.query(
            APIErrorLog.failure_stage,
            func.count(APIErrorLog.id).label('count')
        ).group_by(APIErrorLog.failure_stage).all()
        
        # Errors by error type
        type_stats = db.query(
            APIErrorLog.error_type,
            func.count(APIErrorLog.id).label('count')
        ).group_by(APIErrorLog.error_type).order_by(desc('count')).limit(10).all()
        
        # Errors by endpoint
        endpoint_stats = db.query(
            APIErrorLog.endpoint,
            func.count(APIErrorLog.id).label('count')
        ).group_by(APIErrorLog.endpoint).order_by(desc('count')).all()
        
        return JSONResponse(content={
            "total_errors": total_errors,
            "by_failure_stage": {stage: count for stage, count in stage_stats},
            "top_error_types": {error_type: count for error_type, count in type_stats},
            "by_endpoint": {endpoint: count for endpoint, count in endpoint_stats},
        })
    except Exception as e:
        logger.error(f"Error fetching error stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/error-logs/export")
async def export_error_logs_csv(
    endpoint: Optional[str] = None,
    failure_stage: Optional[str] = None,
    error_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db = Depends(get_db),
    _admin_check = Depends(check_admin_role),
):
    """
    Export error logs as CSV file.
    """
    try:
        query = db.query(APIErrorLog)
        
        # Apply same filters as get_error_logs
        if endpoint:
            query = query.filter(APIErrorLog.endpoint.contains(endpoint))
        if failure_stage:
            query = query.filter(APIErrorLog.failure_stage == failure_stage)
        if error_type:
            query = query.filter(APIErrorLog.error_type == error_type)
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(APIErrorLog.created_at >= start_dt)
            except ValueError:
                pass
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(APIErrorLog.created_at <= end_dt)
            except ValueError:
                pass
        
        error_logs = query.order_by(desc(APIErrorLog.created_at)).all()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "ID", "Endpoint", "Error Type", "Error Message", "Failure Stage",
            "Audio File Name", "Translated Text", "Detected Language",
            "Error Traceback", "Preprocessing Logs", "Intent Data", "Created At"
        ])
        
        # Write data rows
        for log in error_logs:
            writer.writerow([
                log.id,
                log.endpoint,
                log.error_type,
                log.error_message[:500] if log.error_message else "",  # Truncate long messages
                log.failure_stage or "",
                log.audio_file_name or "",
                log.translated_text or "",
                log.detected_language or "",
                log.error_traceback[:5000] if log.error_traceback else "",  # Full traceback
                log.preprocessing_logs_text[:5000] if log.preprocessing_logs_text else "",  # Full logs
                str(log.intent_data) if log.intent_data else "",
                log.created_at.isoformat() if log.created_at else "",
            ])
        
        # Generate filename with timestamp
        filename = f"error_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        logger.error(f"Error exporting error logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/error-logs/audio/{filename}")
async def get_error_log_audio(
    filename: str,
    _admin_check = Depends(check_admin_role),
):
    """
    Serve stored audio file for an error log (for playback in admin UI).
    """
    # Prevent path traversal: only allow safe filenames (hex + extension)
    if not re.match(r"^[a-f0-9]{32}\.(wav|mp3|m4a|ogg|webm|flac)$", filename, re.IGNORECASE):
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = os.path.join(ERROR_AUDIO_DIR, filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    ext = filename.rsplit(".", 1)[-1].lower()
    media_types = {"wav": "audio/wav", "mp3": "audio/mpeg", "m4a": "audio/mp4", "ogg": "audio/ogg", "webm": "audio/webm", "flac": "audio/flac"}
    media_type = media_types.get(ext, "audio/wav")
    return FileResponse(path, media_type=media_type)

@router.get("/error-logs/{log_id}")
async def get_error_log_detail(
    log_id: int,
    db = Depends(get_db),
    _admin_check = Depends(check_admin_role),
):
    """
    Get detailed information about a specific error log.
    """
    try:
        error_log = db.query(APIErrorLog).filter(APIErrorLog.id == log_id).first()
        if not error_log:
            raise HTTPException(status_code=404, detail="Error log not found")
        
        return JSONResponse(content=error_log.to_dict())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching error log detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))
