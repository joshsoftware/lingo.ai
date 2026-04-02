"""
Helper module for tracking preprocessing steps
"""
from typing import List, Dict, Any
import time
from datetime import datetime

class PreprocessingTracker:
    """Tracks preprocessing steps for error logging"""
    
    def __init__(self):
        self.steps: List[Dict[str, Any]] = []
        self.start_time = time.time()
    
    def add_step(self, step_name: str, status: str = "completed", details: Any = None, error: Exception = None):
        """
        Add a preprocessing step.
        
        Args:
            step_name: Name of the preprocessing step (e.g., "audio_upload", "transcription", "intent_detection")
            status: Status of the step ("started", "completed", "failed")
            details: Additional details about the step
            error: Exception if the step failed
        """
        elapsed_time = (time.time() - self.start_time) * 1000  # milliseconds
        
        step_data = {
            "step": step_name,
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "elapsed_time_ms": round(elapsed_time, 2),
        }
        
        if details:
            step_data["details"] = details
        
        if error:
            step_data["error"] = {
                "type": type(error).__name__,
                "message": str(error),
            }
        
        self.steps.append(step_data)
    
    def get_steps(self) -> List[Dict[str, Any]]:
        """Get all tracked preprocessing steps"""
        return self.steps
    
    def get_logs_text(self) -> str:
        """Get free-form text representation of preprocessing logs"""
        if not self.steps:
            return ""
        
        log_lines = []
        for step in self.steps:
            line = f"[{step['timestamp']}] {step['step']}: {step['status']}"
            if 'error' in step:
                line += f" - Error: {step['error']['message']}"
            log_lines.append(line)
        
        return "\n".join(log_lines)
