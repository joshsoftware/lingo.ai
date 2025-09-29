"""
Session Data Merger

This module provides utilities for merging session data from Redis
with new voice input data for session continuation scenarios.
"""
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class SessionDataMerger:
    """
    Handles merging of session data from Redis with new voice input data.
    
    This class provides utilities for:
    - Intelligent merging of new intent data with existing orchestrator data
    - Conflict resolution for missing parameters
    - Data validation and consistency checks
    - Session data preparation for storage
    """
    
    @staticmethod
    def merge_intent_with_session(
        existing_session_data: Dict[str, Any],
        new_intent_data: Dict[str, Any],
        banking_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Merge new intent data with existing session data intelligently.
        
        Args:
            existing_session_data: Session data from Redis
            new_intent_data: New intent data from current audio processing
            banking_params: Banking parameters (customer_id, phone, etc.)
        
        Returns:
            Merged parameters dictionary for orchestrator processing
        """
        logger.info("Starting intelligent merge of intent data with session data")
        
        # Start with banking parameters as base
        merged_params = {**banking_params}
        
        # Add new intent data
        merged_params.update(new_intent_data)
        
        # Get previous orchestrator data if available
        previous_orchestrator_data = existing_session_data.get("orchestrator_data", {})
        
        if previous_orchestrator_data:
            # Add previous orchestrator data for context
            merged_params["previous_orchestrator_data"] = previous_orchestrator_data
            
            # Handle missing parameters from previous call
            merged_params = SessionDataMerger._handle_missing_parameters(
                merged_params,
                previous_orchestrator_data,
                new_intent_data
            )
            
            # Handle conflict resolution scenarios
            merged_params = SessionDataMerger._handle_conflict_resolution(
                merged_params,
                previous_orchestrator_data,
                new_intent_data
            )
        
        # Mark as session continuation
        merged_params["session_continuation"] = True
        
        # Add session metadata
        merged_params["session_merge_timestamp"] = str(datetime.now())
        
        logger.info(f"Merge completed. Final params keys: {list(merged_params.keys())}")
        return merged_params
    
    @staticmethod
    def _handle_missing_parameters(
        merged_params: Dict[str, Any],
        previous_orchestrator_data: Dict[str, Any],
        new_intent_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Handle missing parameters from previous orchestrator calls.
        
        Args:
            merged_params: Current merged parameters
            previous_orchestrator_data: Previous orchestrator response
            new_intent_data: New intent data from current audio
        
        Returns:
            Updated merged parameters with missing parameter handling
        """
        missing_params = previous_orchestrator_data.get("missing_parameters", [])
        
        if not missing_params:
            return merged_params
        
        logger.info(f"Handling missing parameters from previous call: {missing_params}")
        
        # Track which missing parameters are now provided
        resolved_params = []
        
        for param in missing_params:
            if param in new_intent_data and new_intent_data[param]:
                logger.info(f"Missing parameter '{param}' now provided: {new_intent_data[param]}")
                merged_params[f"resolved_{param}"] = new_intent_data[param]
                resolved_params.append(param)
        
        # Add metadata about resolved parameters
        if resolved_params:
            merged_params["resolved_missing_parameters"] = resolved_params
            logger.info(f"Resolved missing parameters: {resolved_params}")
        
        # Keep track of still missing parameters
        still_missing = [p for p in missing_params if p not in resolved_params]
        if still_missing:
            merged_params["still_missing_parameters"] = still_missing
            logger.info(f"Still missing parameters: {still_missing}")
        
        return merged_params
    
    @staticmethod
    def _handle_conflict_resolution(
        merged_params: Dict[str, Any],
        previous_orchestrator_data: Dict[str, Any],
        new_intent_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Handle conflict resolution scenarios from previous orchestrator calls.
        
        Args:
            merged_params: Current merged parameters
            previous_orchestrator_data: Previous orchestrator response
            new_intent_data: New intent data from current audio
        
        Returns:
            Updated merged parameters with conflict resolution handling
        """
        # Check if previous call had conflicts (like multiple beneficiaries)
        if (previous_orchestrator_data.get("success") == "false" and 
            previous_orchestrator_data.get("needs_more_input", False)):
            
            conflict_type = previous_orchestrator_data.get("conflict_type", "")
            
            if conflict_type == "multiple_beneficiaries":
                logger.info("Handling multiple beneficiaries conflict resolution")
                
                # If new audio provides recipient info, it might be resolving the conflict
                if "recipient" in new_intent_data:
                    merged_params["conflict_resolution_recipient"] = new_intent_data["recipient"]
                    merged_params["resolving_conflict"] = True
                    merged_params["previous_conflict_type"] = "multiple_beneficiaries"
                    logger.info(f"Attempting to resolve beneficiary conflict with: {new_intent_data['recipient']}")
            
            elif conflict_type == "missing_fields":
                logger.info("Handling missing fields conflict resolution")
                
                # Check if any of the missing fields are now provided
                missing_fields = previous_orchestrator_data.get("missing_parameters", [])
                for field in missing_fields:
                    if field in new_intent_data and new_intent_data[field]:
                        merged_params[f"conflict_resolved_{field}"] = new_intent_data[field]
                        merged_params["resolving_conflict"] = True
                        merged_params["previous_conflict_type"] = "missing_fields"
                        logger.info(f"Attempting to resolve missing field '{field}' with: {new_intent_data[field]}")
        
        return merged_params
    
    @staticmethod
    def prepare_updated_session_data(
        existing_session_data: Dict[str, Any],
        new_translation: str,
        new_intent_data: Dict[str, Any],
        new_orchestrator_data: Dict[str, Any],
        banking_params: Dict[str, Any],
        language: str
    ) -> Dict[str, Any]:
        """
        Prepare updated session data for Redis storage with intelligent merging.
        
        Args:
            existing_session_data: Existing session data from Redis
            new_translation: New translation text from current audio
            new_intent_data: New intent data from current audio
            new_orchestrator_data: New orchestrator response
            banking_params: Banking parameters
            language: Detected language
        
        Returns:
            Updated session data dictionary ready for Redis storage
        """
        logger.info("Preparing updated session data for Redis storage")
        
        # Start with existing session data
        updated_data = existing_session_data.copy()
        
        # Update translations history
        existing_translations = existing_session_data.get("translations", [])
        updated_data["translations"] = existing_translations + [new_translation]
        
        # Update intent data history (keep last N entries to avoid unbounded growth)
        intent_history = existing_session_data.get("intent_history", [])
        intent_history.append({
            "timestamp": str(datetime.now()),
            "intent_data": new_intent_data
        })
        # Keep only last 10 intent entries
        updated_data["intent_history"] = intent_history[-10:]
        updated_data["intent_data"] = new_intent_data  # Current intent data
        
        # Update orchestrator data and keep history
        orchestrator_history = existing_session_data.get("orchestrator_history", [])
        orchestrator_history.append({
            "timestamp": str(datetime.now()),
            "orchestrator_data": new_orchestrator_data
        })
        # Keep only last 10 orchestrator entries
        updated_data["orchestrator_history"] = orchestrator_history[-10:]
        updated_data["orchestrator_data"] = new_orchestrator_data  # Current orchestrator data
        
        # Update banking parameters if provided
        for key, value in banking_params.items():
            if value is not None:
                updated_data[key] = value
        
        # Update language
        updated_data["language"] = language
        
        # Update session metadata
        updated_data["last_updated"] = str(datetime.now())
        updated_data["turn_count"] = existing_session_data.get("turn_count", 0) + 1
        
        # Maintain session statistics
        if "session_stats" not in updated_data:
            updated_data["session_stats"] = {}
        
        stats = updated_data["session_stats"]
        stats["total_translations"] = len(updated_data["translations"])
        stats["last_activity"] = str(datetime.now())
        
        # Track conflict resolution progress
        if new_orchestrator_data.get("resolved_previous_conflict", False):
            stats["conflicts_resolved"] = stats.get("conflicts_resolved", 0) + 1
        
        if new_orchestrator_data.get("needs_more_input", False):
            stats["pending_conflicts"] = stats.get("pending_conflicts", 0) + 1
        
        logger.info(f"Updated session data prepared with {stats.get('total_translations', 0)} translations and turn count {updated_data.get('turn_count', 0)}")
        
        return updated_data
    
    @staticmethod
    def validate_session_data_consistency(session_data: Dict[str, Any]) -> bool:
        """
        Validate session data consistency and structure.
        
        Args:
            session_data: Session data to validate
        
        Returns:
            True if data is consistent, False otherwise
        """
        required_fields = ["session_id", "created_at", "last_updated"]
        
        for field in required_fields:
            if field not in session_data:
                logger.warning(f"Session data missing required field: {field}")
                return False
        
        # Validate translations list consistency
        translations = session_data.get("translations", [])
        if not isinstance(translations, list):
            logger.warning("Session data translations field is not a list")
            return False
        
        # Validate turn count consistency
        turn_count = session_data.get("turn_count", 0)
        if turn_count != len(translations):
            logger.warning(f"Turn count ({turn_count}) doesn't match translations count ({len(translations)})")
            return False
        
        logger.info("Session data consistency validation passed")
        return True