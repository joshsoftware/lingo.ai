"""
Session Flow Handler

This module handles the new session-based flow for voice intent processing.
It manages to fetch session data from Redis and processing new voice input
in the context of existing session data.
"""
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from redis_client import session_manager
from orchestrator import orchestrate_banking_request
from detect_intent import translate

logger = logging.getLogger(__name__)


class SessionFlowHandler:
    """
    Handles the session-based flow for voice intent processing.
    
    This class manages:
    - Fetching existing session data from Redis
    - Merging new voice input with existing orchestrator data
    - Processing updated parameters and calling orchestrator
    - Managing session state updates
    """
    
    def __init__(self):
        self.session_manager = session_manager
    
    async def process_session_based_request(
        self,
        session_id: str,
        formatted_intent_data: Dict[str, Any],
        translation_text: str,
        language: str,
        banking_params_dict: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process a session-based voice intent request.
        
        Args:
            session_id: The session ID to fetch data for
            formatted_intent_data: The new intent data from current audio
            translation_text: The translation text from current audio
            language: The detected language
            banking_params_dict: Banking parameters (customer_id, phone, etc.)
        
        Returns:
            Dictionary containing the processed result with orchestrator data
        """
        logger.info(f"Processing session-based request for session: {session_id}")
        
        # Step 1: Fetch existing session data from Redis
        existing_session_data = self._fetch_session_data(session_id)
        if not existing_session_data:
            raise ValueError(f"Session {session_id} not found in Redis")
        
        # Step 2: Merge new intent data with existing session data
        merged_params = self._merge_session_data(
            existing_session_data,
            formatted_intent_data,
            banking_params_dict
        )
        
        # Step 3: Call orchestrator with merged data
        orchestrated_data = await orchestrate_banking_request(merged_params)
        
        # Step 4: Translate response message
        orchestrated_data['message'] = translate(orchestrated_data["message"], language)
        
        # Step 5: Update session data in Redis
        updated_session_data = self._prepare_updated_session_data(
            existing_session_data,
            translation_text,
            formatted_intent_data,
            orchestrated_data,
            banking_params_dict,
            language
        )
        
        self.session_manager.update_session(session_id, updated_session_data)
        
        # Step 6: Prepare response
        result = self._prepare_session_response(
            session_id,
            translation_text,
            formatted_intent_data,
            orchestrated_data,
            True  # session_continuation = True
        )
        
        logger.info(f"Session-based processing completed for session: {session_id}")
        return result
    
    def _fetch_session_data(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch existing session data from Redis.
        
        Args:
            session_id: The session ID to fetch
        
        Returns:
            Session data dictionary or None if not found
        """
        if not self.session_manager.session_exists(session_id):
            logger.warning(f"Session {session_id} does not exist in Redis")
            return None
        
        session_data = self.session_manager.get_session(session_id)
        logger.info(f"Fetched session data for {session_id}: keys = {list(session_data.keys()) if session_data else 'None'}")
        return session_data
    
    def _merge_session_data(
        self,
        existing_session_data: Dict[str, Any],
        new_intent_data: Dict[str, Any],
        banking_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Merge new intent data with existing session data.
        
        Args:
            existing_session_data: Existing session data from Redis
            new_intent_data: New intent data from current audio
            banking_params: Banking parameters
        
        Returns:
            Merged parameters for orchestrator call
        """
        logger.info("Merging new intent data with existing session data")
        
        # Start with banking parameters
        merged_params = {**banking_params}
        
        # Add new intent data
        merged_params.update(new_intent_data)
        
        # Add previous orchestrator data for context
        if "orchestrator_data" in existing_session_data:
            previous_orchestrator_data = existing_session_data["orchestrator_data"]
            merged_params["previous_orchestrator_data"] = previous_orchestrator_data
            logger.info("Added previous orchestrator data to merged params")
        
        # Mark as session continuation
        merged_params["session_continuation"] = True
        
        # If the previous call had missing parameters, check if new audio provides them
        if "orchestrator_data" in existing_session_data:
            prev_orchestrator = existing_session_data["orchestrator_data"]
            missing_params = prev_orchestrator.get("missing_parameters", [])
            
            if missing_params:
                logger.info(f"Previous call had missing parameters: {missing_params}")
                
                # Check if new intent data provides any of the missing parameters
                for param in missing_params:
                    if param in new_intent_data and new_intent_data[param]:
                        logger.info(f"New audio provided missing parameter '{param}': {new_intent_data[param]}")
                        merged_params[f"updated_{param}"] = new_intent_data[param]
        
        logger.info(f"Merged params keys: {list(merged_params.keys())}")
        return merged_params
    
    def _prepare_updated_session_data(
        self,
        existing_session_data: Dict[str, Any],
        new_translation: str,
        new_intent_data: Dict[str, Any],
        new_orchestrator_data: Dict[str, Any],
        banking_params: Dict[str, Any],
        language: str
    ) -> Dict[str, Any]:
        """
        Prepare updated session data for Redis storage.
        
        Args:
            existing_session_data: Existing session data
            new_translation: New translation text
            new_intent_data: New intent data
            new_orchestrator_data: New orchestrator response
            banking_params: Banking parameters
            language: Detected language
        
        Returns:
            Updated session data dictionary
        """
        # Start with existing session data
        updated_data = existing_session_data.copy()
        
        # Update translations list
        existing_translations = existing_session_data.get("translations", [])
        updated_data["translations"] = existing_translations + [new_translation]
        
        # Update intent data (keep history if needed, or just update with latest)
        updated_data["intent_data"] = new_intent_data
        
        # Update orchestrator data with latest response
        updated_data["orchestrator_data"] = new_orchestrator_data
        
        # Update banking params if provided
        for key, value in banking_params.items():
            if value is not None:
                updated_data[key] = value
        
        # Update language if changed
        updated_data["language"] = language
        
        # Update timestamp
        updated_data["updated_at"] = json.dumps({"timestamp": str(datetime.now())})
        
        return updated_data
    
    def _prepare_session_response(
        self,
        session_id: str,
        translation_text: str,
        intent_data: Dict[str, Any],
        orchestrator_data: Dict[str, Any],
        session_continuation: bool
    ) -> Dict[str, Any]:
        """
        Prepare the final response for session-based processing.
        
        Args:
            session_id: The session ID
            translation_text: Translation text
            intent_data: Intent data
            orchestrator_data: Orchestrator response
            session_continuation: Whether this is a session continuation
        
        Returns:
            Response dictionary
        """
        # Check if orchestrator indicates more input is needed
        needs_more_input = orchestrator_data.get("needs_more_input", False)
        missing_parameters = orchestrator_data.get("missing_parameters", [])
        
        result = {
            "session_id": session_id,
            "translation": translation_text,
            "intent_data": intent_data,
            "orchestrator_data": orchestrator_data,
            "needs_more_input": needs_more_input,
            "missing_parameters": missing_parameters,
            "session_continuation": session_continuation,
            "flow_type": "session_based"  # Indicate this used the new flow
        }
        
        return result