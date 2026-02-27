"""
Session Service for Voice Intent API

This module provides utilities for session management, flow decision logic,
and session data operations to make the main API code DRY and maintainable.
"""

import json
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from redis_client import session_manager
from orchestrator import orchestrate_banking_request
from detect_intent import translate

logger = logging.getLogger(__name__)


class SessionService:
    """Service class for handling session-related operations."""
    
    @staticmethod
    def should_use_session_flow(session_id: Optional[str]) -> bool:
        """Determine if request should use session-based flow."""
        return session_id is not None and session_manager.session_exists(session_id)
    
    @staticmethod
    def get_session_data(session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve session data with error handling."""
        try:
            return session_manager.get_session(session_id)
        except Exception as e:
            logger.error(f"Error retrieving session {session_id}: {e}")
            return None
    
    @staticmethod
    def update_intent_with_missing_field(
        intent_data: Dict[str, Any], 
        missing_field: str, 
        new_value: str
    ) -> Dict[str, Any]:
        """Update intent data with new value for missing field."""
        updated_intent = intent_data.copy()
        updated_intent["entities"] = updated_intent.get("entities", {})
        updated_intent["entities"][missing_field] = new_value.strip()
        return updated_intent
    
    @staticmethod
    def prepare_session_banking_params(session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract banking parameters from session data."""
        return {
            "customer_id": session_data.get("customer_id"),
            "phone": session_data.get("phone"),
            "transaction_type": session_data.get("transaction_type"),
            "payment_method": session_data.get("payment_method")
        }
    
    @staticmethod
    def update_session_after_processing(
        session_id: str,
        session_data: Dict[str, Any],
        translation_text: str,
        updated_intent_data: Dict[str, Any],
        orchestrated_data: Dict[str, Any]
    ) -> None:
        """Update session data after successful processing."""
        # Update session data
        session_data["translations"].append(translation_text)
        session_data["intent_data"] = updated_intent_data
        session_data["orchestrator_data"] = orchestrated_data
        session_data["turn_count"] = session_data.get("turn_count", 1) + 1
        session_data["updated_at"] = json.dumps({"timestamp": str(datetime.now())})
        
        # Remove the missing_field since it's now resolved
        if "missing_field" in session_data:
            del session_data["missing_field"]
        
        # Store updated session
        session_manager.store_session(session_id, session_data)
    
    @staticmethod
    def detect_missing_field_from_orchestrator_response(orchestrated_data: Dict[str, Any]) -> Optional[str]:
        """Detect which field is missing based on the orchestrator response."""
        if orchestrated_data.get("success") == "false":
            message = orchestrated_data.get("message", "").lower()
            if "multiple" in message and ("beneficiaries" in message or "choose from" in message):
                return "recipient"
            elif "missing" in message or "need" in message:
                return "recipient"  # Default to recipient for most missing field cases
        return None
    
    @staticmethod
    def update_session_after_orchestrator_response(
        session_id: str,
        session_data: Dict[str, Any],
        translation_text: str,
        updated_intent_data: Dict[str, Any],
        orchestrated_data: Dict[str, Any]
    ) -> None:
        """Update session data after orchestrator response, handling both success and failure scenarios."""
        # Update common session data
        session_data["translations"].append(translation_text)
        session_data["intent_data"] = updated_intent_data
        session_data["orchestrator_data"] = orchestrated_data
        session_data["turn_count"] = session_data.get("turn_count", 1) + 1
        session_data["updated_at"] = json.dumps({"timestamp": str(datetime.now())})
        
        # Check if orchestrator response indicates missing fields
        missing_field = SessionService.detect_missing_field_from_orchestrator_response(orchestrated_data)
        
        if missing_field:
            # If there's still a missing field, update it in session data
            session_data["missing_field"] = missing_field
            logger.info(f"Updated session {session_id} with missing_field: {missing_field}")
        else:
            # If successful, remove the missing_field since it's now resolved
            if "missing_field" in session_data:
                del session_data["missing_field"]
                logger.info(f"Removed missing_field from session {session_id} - successfully processed")
        
        # Store updated session
        session_manager.store_session(session_id, session_data)
    
    @staticmethod
    def create_new_session_data(
        session_id: str,
        customer_id: Optional[int],
        phone: Optional[str],
        transaction_type: Optional[str],
        payment_method: Optional[str],
        language: str,
        translation_text: str,
        intent_data: Dict[str, Any],
        orchestrated_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create new session data structure."""
        session_data = {
            "session_id": session_id,
            "customer_id": customer_id,
            "phone": phone,
            "transaction_type": transaction_type,
            "payment_method": payment_method,
            "language": language,
            "translations": [translation_text],
            "intent_data": intent_data,
            "orchestrator_data": orchestrated_data,
            "created_at": json.dumps({"timestamp": str(datetime.now())}),
            "updated_at": json.dumps({"timestamp": str(datetime.now())}),
            "turn_count": 1
        }
        
        # Check for missing fields and add to session if needed
        missing_field = SessionService.detect_missing_field_from_orchestrator_response(orchestrated_data)
        if missing_field:
            session_data["missing_field"] = missing_field
            logger.info(f"Stored missing_field: {missing_field}")
        
        return session_data
    
    @staticmethod
    def format_api_response(
        session_id: str,
        translation_text: str,
        intent_data: Dict[str, Any],
        orchestrated_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Format the standardized API response."""
        return {
            "session_id": session_id,
            "translation": translation_text,
            "intent_data": intent_data,
            "orchestrator_data": orchestrated_data
        }


class SessionFlowProcessor:
    """Processor for handling session-based and new session flows."""
    
    def __init__(self):
        self.session_service = SessionService()
    
    async def process_existing_session(
        self,
        session_id: str,
        translation_text: str,
        language: str,
        formatted_intent_data: Dict[str, Any],
        otp: Optional[str] = None,
        beneficiary_name: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Process existing session flow.
        
        Returns:
            Tuple of (success, response_data)
        """
        # Get existing session data
        existing_session_data = self.session_service.get_session_data(session_id)
        if not existing_session_data:
            return False, {"message": f"Session {session_id} not found"}

        missing_field = existing_session_data.get("missing_field")
        existing_intent_data = existing_session_data.get("intent_data", {})
        existing_intent = existing_intent_data.get("intent", "").lower()
        new_intent = formatted_intent_data.get("intent", "").lower()

        # Handle OTP flow (when OTP is provided without missing_field - e.g., confirming a transaction)
        if otp and not missing_field:
            updated_intent_data = existing_intent_data.copy()
            updated_intent_data["entities"] = existing_intent_data.get("entities", {}).copy()
            updated_intent_data["entities"]["otp"] = otp  # explicitly add otp

        # Handle beneficiary_name flow
        elif beneficiary_name:
            updated_intent_data = existing_intent_data.copy()
            updated_intent_data["entities"] = existing_intent_data.get("entities", {}).copy()
            updated_intent_data["entities"]["recipient"] = beneficiary_name  # explicitly add beneficiary

        # Handle case where there's a missing field to update
        elif missing_field:
            if (
                formatted_intent_data.get("intent")
                and formatted_intent_data["intent"].lower() != "unknown"
                and formatted_intent_data.get("entities")
            ):
                updated_intent_data = existing_intent_data.copy()
                updated_intent_data["entities"] = existing_intent_data.get("entities", {}).copy()

                # Update the missing field specifically
                new_value = formatted_intent_data["entities"].get(missing_field, translation_text)
                if new_value is not None:
                    updated_intent_data["entities"][missing_field] = str(new_value).strip()

                # Also update other entities from formatted_intent_data if present
                for key, value in formatted_intent_data["entities"].items():
                    if value:
                        updated_intent_data["entities"][key] = value
            else:
                updated_intent_data = self.session_service.update_intent_with_missing_field(
                    existing_intent_data,
                    missing_field,
                    translation_text
                )

        # Handle case where there's no missing_field - allow new intent if it's different or complete
        elif not missing_field:
            # If new intent is different from existing intent, process it as a new transaction
            # OR if new intent has entities (even if same intent, user might be providing complete info)
            new_entities = formatted_intent_data.get("entities", {})
            has_entities = new_entities and any(v is not None and v != "" for v in new_entities.values())
            
            if (
                formatted_intent_data.get("intent")
                and formatted_intent_data["intent"].lower() != "unknown"
                and (new_intent != existing_intent or has_entities)
            ):
                # Use the new intent data directly (new transaction in same session)
                updated_intent_data = formatted_intent_data.copy()
                updated_intent_data["entities"] = formatted_intent_data.get("entities", {}).copy()
            else:
                return False, {"message": "No missing field to update in session and new intent is incomplete or same as existing"}

        # Prepare parameters for orchestrator
        session_banking_params = self.session_service.prepare_session_banking_params(existing_session_data)
        merged_params = {**session_banking_params, **updated_intent_data}
        if otp and not missing_field:
            merged_params = {**merged_params, "otp": otp}
        
         # Call orchestrator with updated data
        orchestrated_data = await orchestrate_banking_request(merged_params)
        
        # Update session data - handle both success and failure scenarios
        self.session_service.update_session_after_orchestrator_response(
            session_id,
            existing_session_data,
            translation_text,
            updated_intent_data,
            orchestrated_data
        )

        if orchestrated_data.get("success") == "true":
            session_manager.delete_session(session_id)

        # Translate response message
        message = orchestrated_data.get('data', {}).get('message')
        if not message:
            message = orchestrated_data['message']
        orchestrated_data['message'] = translate(message, language)
        orchestrated_data['data']['message'] = orchestrated_data['message']
        
        # Return success response
        response = self.session_service.format_api_response(
            session_id,
            translation_text,
            updated_intent_data,
            orchestrated_data
        )
        
        return True, response
    
    async def process_new_session(
        self,
        customer_id: Optional[int],
        phone: Optional[str],
        transaction_type: Optional[str],
        payment_method: Optional[str],
        language: str,
        translation_text: str,
        formatted_intent_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process new session flow."""
        # Generate a new session ID
        current_session_id = session_manager.generate_session_id()
        logger.info(f"Creating new session: {current_session_id}")
        
        # Create banking parameters
        banking_params_dict = {
            "customer_id": customer_id,
            "phone": phone,
            "transaction_type": transaction_type,
            "payment_method": payment_method
        }
        
        # Create params for orchestrator
        merged_params = {**banking_params_dict, **formatted_intent_data}
        
        # Call orchestration logic
        orchestrated_data = await orchestrate_banking_request(merged_params)
        
        # Create and store session data
        session_data = self.session_service.create_new_session_data(
            current_session_id,
            customer_id,
            phone,
            transaction_type,
            payment_method,
            language,
            translation_text,
            formatted_intent_data,
            orchestrated_data
        )
        
        # Store session in Redis
        logger.info(f"Stored data: {session_data}")
        session_manager.store_session(current_session_id, session_data)
        
        # Translate response message
        message = orchestrated_data.get('data', {}).get('message')
        if not message:
            message = orchestrated_data['message']
        orchestrated_data['message'] = translate(message, language)
        orchestrated_data['data']['message'] = orchestrated_data['message']
        
        # Format response
        return self.session_service.format_api_response(
            current_session_id,
            translation_text,
            formatted_intent_data,
            orchestrated_data
        )

    async def clean_session_data(self, session_id: str):
        session = session_manager.get_session(session_id)
        if session:
            session.delete
