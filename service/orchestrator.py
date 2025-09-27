"""
Banking Orchestration Service

This service handles the orchestration flow for banking operations based on intent and action data.
It processes different banking intents and calls appropriate APIs.
"""
import json
import logging
import httpx
import os
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
import re

load_dotenv()

logger = logging.getLogger(__name__)

# API Endpoint Constants
BALANCE_ENDPOINT = "/bank/me/balance"
TRANSACTIONS_ENDPOINT = "/bank/me/transactions"
PAY_ENDPOINT = "/bank/me/pay"
ORCHESTRATOR_INTERNAL_ERROR = "Sorry, I couldn't process the request at the moment. Please try again."
BANK_API_ERROR = "We’re unable to process your request with the bank at the moment. Please try again later."
BANK_SERVICE_UNAVAILABLE = "The banking service is currently unavailable"

IS_DEBIT = lambda t: t.get("transaction_type") == "debit"


def _handle_unknown_intent() -> Dict[str, Any]:
    """Handle unknown intent - generic clarification message."""
    return {
        "success": "false",
        "data": {},
        "message": "I'm sorry, I didn't understand your request. I can help you with checking your balance, viewing recent transactions, transferring money, or analyzing your spending. Could you please rephrase your question?"
    }


def _convert_timeframe_to_dates(timeframe: str) -> tuple:
    """Convert a timeframe string to start_date and end_date."""
    today = datetime.now()
    timeframe_lower = timeframe.lower()

    def format_date(dt: datetime) -> str:
        return dt.strftime("%Y-%m-%d")

    if timeframe_lower == "last_week":
        start_of_this_week = today - timedelta(days=today.weekday())
        return format_date(start_of_this_week - timedelta(weeks=1)), format_date(start_of_this_week - timedelta(days=1))

    if timeframe_lower == "last_month":
        first_of_this_month = today.replace(day=1)
        last_month_end = first_of_this_month - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        return format_date(last_month_start), format_date(last_month_end)

    if timeframe_lower == "last_year":
        return format_date(datetime(today.year - 1, 1, 1)), format_date(datetime(today.year - 1, 12, 31))

    if timeframe_lower in {"week", "this_week"}:
        start_of_week = today - timedelta(days=today.weekday())
        return format_date(start_of_week), format_date(today)

    if timeframe_lower in {"month", "this_month"}:
        return format_date(today.replace(day=1)), format_date(today)

    if timeframe_lower in {"year", "this_year"}:
        return format_date(datetime(today.year, 1, 1)), format_date(today)

    match = re.fullmatch(r"(\d+)\s*(day|week|month|year)s?", timeframe_lower)
    if match:
        num, unit = int(match[1]), match[2]
        days_map = {"day": 1, "week": 7, "month": 30, "year": 365}
        delta = timedelta(days=num * days_map[unit])
        return format_date(today - delta), format_date(today)

    # --- Default fallback → last 7 days ---
    return format_date(today - timedelta(days=7)), format_date(today)


def _get_period_description(timeframe: str, start_date: str, end_date: str) -> str:
    """Generate a human-readable description of the time period."""
    if timeframe:
        timeframe_lower = timeframe.lower()
        if timeframe_lower == "last_week":
            return "last week"
        elif timeframe_lower == "last_month":
            return "last month"
        elif timeframe_lower == "last_year":
            return "last year"
        elif timeframe_lower in ["week", "this_week"]:
            return "this week"
        elif timeframe_lower in ["month", "this_month"]:
            return "this month"
        elif timeframe_lower in ["year", "this_year"]:
            return "this year"
        else:
            # Handle numeric timeframes like "10 days", "2 weeks", etc.
            match = re.search(r'(\d+)\s*(day|week|month|year)s?', timeframe_lower)
            if match:
                num = match.group(1)
                unit = match.group(2)
                if unit == "day":
                    return f"last {num} days"
                elif unit == "week":
                    return f"last {num} weeks"
                elif unit == "month":
                    return f"last {num} months"
                elif unit == "year":
                    return f"last {num} years"
            return f"the {timeframe} period"
    elif start_date and end_date:
        return f"from {start_date} to {end_date}"
    elif start_date:
        return f"since {start_date}"
    elif end_date:
        return f"until {end_date}"
    else:
        return "your recent transactions"


def _calculate_recipient_insights(transactions: list, recipient: str, period_desc: str) -> Dict[str, Any]:
    """Calculate insights for a specific recipient."""
    recipient_txns = [t for t in transactions if recipient.lower() in t.get("recipient", "").lower()]
    total_spent = sum(abs(t.get("amount", 0)) for t in recipient_txns if IS_DEBIT(t))

    return {
        "total_spent": total_spent,
        "message": f"You've spent {total_spent:,.2f} INR on {recipient} {period_desc}."
    }


def _calculate_category_insights(transactions: list, category: str, period_desc: str) -> Dict[str, Any]:
    """Calculate insights for a specific category."""
    category_txns = [t for t in transactions if category.lower() in t.get("category", "").lower()]
    total_spent = sum(abs(t.get("amount", 0)) for t in category_txns if IS_DEBIT(t))

    return {
        "total_spent": total_spent,
        "message": f"You've spent {total_spent:,.2f} INR on {category} category {period_desc}."
    }


def _calculate_general_insights(transactions: list, period_desc: str) -> Dict[str, Any]:
    """Calculate general spending insights."""
    total_spent = sum(abs(t.get("amount", 0)) for t in transactions if IS_DEBIT(t))

    if not transactions:
        return {
            "total_spent": 0,
            "message": f"No spending data found for {period_desc}."
        }

    # Find a top-spending recipient
    recipient_totals = {}
    for t in transactions:
        if IS_DEBIT(t):  # Only debits
            recipient_name = t.get("recipient", "Unknown")
            recipient_totals[recipient_name] = recipient_totals.get(recipient_name, 0) + abs(t.get("amount", 0))

    # Find the top-spending category
    category_totals = {}
    for t in transactions:
        if IS_DEBIT(t):  # Only debits
            category_name = t.get("category", "Unknown")
            category_totals[category_name] = category_totals.get(category_name, 0) + abs(t.get("amount", 0))

    # Build a message with both recipient and category insights
    message_parts = []
    if recipient_totals:
        top_recipient = max(recipient_totals.items(), key=lambda x: x[1])
        message_parts.append(f"Your top spending recipient {period_desc} was {top_recipient[0]} at {top_recipient[1]:,.2f} INR")
    
    if category_totals:
        top_category = max(category_totals.items(), key=lambda x: x[1])
        message_parts.append(f"Your top spending category {period_desc} was {top_category[0]} at {top_category[1]:,.2f} INR")
    
    if message_parts:
        message = ". ".join(message_parts) + f". Total spent: {total_spent:,.2f} INR."
    else:
        message = f"You've spent {total_spent:,.2f} INR {period_desc}."

    return {
        "total_spent": total_spent,
        "message": message
    }


def _calculate_spending_insights(transactions: list, entities: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate spending insights based on transactions and filter criteria."""
    recipient = entities.get("recipient")
    category = entities.get("category")
    timeframe = entities.get("timeframe")
    start_date = entities.get("start_date")
    end_date = entities.get("end_date")

    # Determine time period description
    period_desc = _get_period_description(timeframe, start_date, end_date)

    if recipient:
        return _calculate_recipient_insights(transactions, recipient, period_desc)
    elif category:
        return _calculate_category_insights(transactions, category, period_desc)
    else:
        return _calculate_general_insights(transactions, period_desc)


class BankingOrchestrator:
    """
    Orchestrates banking operations based on intent and entity data.
    Handles validation, API calls, and response formatting.
    """
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv("BANK_API_BASE_URL", "http://localhost:8000")
        self.client = httpx.AsyncClient()

    async def process_intent(self, intent_and_banking_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Orchestrates intent processing and returns a structured response.

        Args:
            intent_and_banking_data: Dictionary containing intent, entities, and action. It also contains Bank API parameters.

        Returns:
            Dictionary with orchestrator_data.
        """
        intent = intent_and_banking_data.get("intent")
        entities = intent_and_banking_data.get("entities", {})
        action = intent_and_banking_data.get("action")
        customer_id = intent_and_banking_data.get("customer_id")
        phone = intent_and_banking_data.get("phone")
        transaction_type = intent_and_banking_data.get("transaction_type")
        payment_method = intent_and_banking_data.get("payment_method")

        logger.info(f"Processing intent: {intent} with action: {action}")

        if not any([customer_id, phone]):
            return {
                "success": "false",
                "data": {},
                "message": "Orchestrator error: Either customer_id or phone is required to check balance."
            }
        
        # Route to the appropriate handler
        if intent == "check_balance":
            orchestrator_data = await self._handle_check_balance(customer_id, phone)
        elif intent == "recent_txn":
            orchestrator_data = await self._handle_recent_transactions(entities, customer_id, phone)
        elif intent == "transfer_money":
            orchestrator_data = await self._handle_transfer_money(entities, action, customer_id, phone, transaction_type, payment_method)
        elif intent == "txn_insights":
            orchestrator_data = await self._handle_txn_insights(entities, customer_id, phone)
        else:
            orchestrator_data = _handle_unknown_intent()
        
        return orchestrator_data

    
    async def _handle_check_balance(self, customer_id : Optional[int] , phone : Optional[str]) -> Dict[str, Any]:
        try:
            # Filter out None parameters as per new API requirements
            params = {}
            if customer_id is not None:
                params["customer_id"] = customer_id
            if phone is not None:
                params["phone"] = phone

            response = await self.client.get(f"{self.base_url}{BALANCE_ENDPOINT}", params=params)
            response.raise_for_status()
            balance_data = response.json()

            return {
                "success": "true",
                "data": balance_data,
                "message": f"Your account balance is {balance_data['balance']:,.2f}."
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching balance: {e.response.status_code} - {e.response.text}")
            if e.response.status_code == 404:
                return {
                    "success": "false",
                    "data": {},
                    "message": "Customer or account not found. Please verify your details."
                }
            else:
                return {
                    "success": "false",
                    "data": {},
                    "message": "Sorry, I couldn't fetch your balance at the moment. Please try again later."
                }
        except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
            logger.error(f"Network error fetching balance: {e}")
            return {
                "success": "false",
                "data": {},
                "message": BANK_SERVICE_UNAVAILABLE
            }
        except Exception as e:
            logger.error(f"Error fetching balance: {e}")
            return {
                "success": "false",
                "data": {},
                "message": "Sorry, I couldn't fetch your balance at the moment. Please try again later."
            }
    
    async def _handle_recent_transactions(self, entities: Dict[str, Any], customer_id: Optional[int] = None, phone: Optional[str] = None) -> Dict[str, Any]:
        """Handle recent_txn intent - optional count parameter."""
        try:
            count = entities.get("count", 5)  # Default to 5 transactions
            recipient = entities.get("recipient")
            
            # Ensure count is a valid integer
            if count is None:
                count = 5
            elif isinstance(count, str):
                try:
                    count = int(count)
                except ValueError:
                    count = 5
            
            params = {"limit": count}
            if customer_id is not None:
                params["customer_id"] = customer_id
            if phone is not None:
                params["phone"] = phone
            if recipient:
                params["recipient"] = recipient
            
            response = await self.client.get(f"{self.base_url}{TRANSACTIONS_ENDPOINT}", params=params)
            response.raise_for_status()
            txn_data = response.json()

            transactions = txn_data.get("transactions", [])
            if recipient:
                message = f"Here are your {len(transactions)} most recent {recipient} transactions."
            else:
                message = f"Here are your {len(transactions)} most recent transactions."

            return {
                "success": "true",
                "data": txn_data,
                "message": message
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching recent transactions: {e.response.status_code} - {e.response.text}")
            try:
                error_data = json.loads(e.response.text)
                error_message = error_data.get("detail", "Unknown error occurred")
            except json.JSONDecodeError:
                # Fallback if response is not valid JSON
                error_message = e.response.text

            if e.response.status_code in {400, 404}:
                return {
                    "success": "false",
                    "data": {},
                    "message": error_message
                }
            else:
                return {
                    "success": "false",
                    "data": {},
                    "message": BANK_API_ERROR
                }
        except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
            logger.error(f"Network error fetching recent transactions: {e}")
            return {
                "success": "false",
                "data": {},
                "message": BANK_SERVICE_UNAVAILABLE
            }
        except Exception as e:
            logger.error(f"Error fetching transactions: {e}")
            return {
                "success": "false",
                "data": {},
                "message": ORCHESTRATOR_INTERNAL_ERROR
            }
    
    async def _handle_transfer_money(self, entities: Dict[str, Any], action: str, customer_id: Optional[int] = None, phone: Optional[str] = None, transaction_type: Optional[str] = None, payment_method: Optional[str] = None) -> Dict[str, Any]:
        """Handle transfer_money intent - requires amount, currency, and recipient validation."""
        amount = entities.get("amount")
        currency = entities.get("currency", "INR")  # Default currency
        recipient = entities.get("recipient")
        category = entities.get("category")
        
        # Always check for amount and recipient - if any is missing, return a specific message
        if not amount or not recipient:
            return {
                "success": "false",
                "data": {"missing_field": "amount or recipient"},
                "message": "Need both recipient and amount to be transferred. Could you please repeat the statement"
            }
        
        # If all required fields are present, process the payment
        if action == "respond" and amount and recipient:
            try:
                # Prepare PaymentRequest JSON body as per the new API structure
                payment_request = {
                    "to": recipient,
                    "amount": float(amount)
                }
                
                # Add optional fields if provided
                if transaction_type:
                    payment_request["transaction_type"] = transaction_type
                if payment_method:
                    payment_request["payment_method"] = payment_method
                if category:
                    payment_request["category"] = category
                
                # Filter out None parameters for query params
                params = {}
                if customer_id is not None:
                    params["customer_id"] = customer_id
                if phone is not None:
                    params["phone"] = phone
                
                # Send payment request with JSON body
                payment_response = await self.client.post(
                    f"{self.base_url}{PAY_ENDPOINT}",
                    json=payment_request,
                    params=params
                )
                payment_response.raise_for_status()
                payment_data = payment_response.json()

                if payment_data.get("status") == "success":
                    return {
                        "success": "true",
                        "data": payment_data,
                        "message": f"Transferred {amount} {currency} to {recipient} successfully. Your current balance is {payment_data.get('balance', 0):,.2f}."
                    }
                else:
                    return {
                        "success": "false",
                        "data": payment_data,
                        "message": f"Transfer failed: {payment_data.get('reason', 'Unknown error')}"
                    }
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error processing transfer: {e.response.status_code} - {e.response.text}")
                try:
                    error_data = json.loads(e.response.text)
                    error_message = error_data.get("detail", "Unknown error occurred")
                except json.JSONDecodeError:
                    # Fallback if response is not valid JSON
                    error_message = e.response.text

                if e.response.status_code in {400, 404, 409}:
                    return {
                        "success": "false",
                        "data": {},
                        "message": error_message
                    }
                else:
                    return {
                        "success": "false",
                        "data": {},
                        "message": BANK_API_ERROR
                    }
            except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
                logger.error(f"Network error processing transfer: {e}")
                return {
                    "success": "false",
                    "data": {},
                    "message": BANK_SERVICE_UNAVAILABLE
                }
            except Exception as e:
                logger.error(f"Error processing transfer: {e}")
                return {
                    "success": "false",
                    "data": {},
                    "message": ORCHESTRATOR_INTERNAL_ERROR
                }
        
        # If the action is not "respond", don't process payment
        return {
            "success": "false",
            "data": {},
            "message": ORCHESTRATOR_INTERNAL_ERROR
        }
    
    async def _handle_txn_insights(self, entities: Dict[str, Any], customer_id: Optional[int] = None, phone: Optional[str] = None) -> Dict[str, Any]:
        """Handle txn_insights intent - analyze spending patterns."""
        try:
            # Fetch transactions with date filtering support
            transactions = await self._fetch_transactions_with_filters(entities, customer_id, phone)
            
            # Calculate spending insights
            analysis_result = _calculate_spending_insights(transactions, entities)
            
            return {
                "success": "true",
                "data": {
                    "transactions": transactions, 
                    "total_spent": analysis_result["total_spent"]
                },
                "message": analysis_result["message"]
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching transactions for insights: {e.response.status_code} - {e.response.text}")
            try:
                error_data = json.loads(e.response.text)
                error_message = error_data.get("detail", "Unknown error occurred")
            except json.JSONDecodeError:
                # Fallback if response is not valid JSON
                error_message = e.response.text
            if e.response.status_code in {400, 404}:
                return {
                    "success": "false",
                    "data": {},
                    "message": error_message
                }
            else:
                return {
                    "success": "false",
                    "data": {},
                    "message": BANK_API_ERROR
                }
        except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
            logger.error(f"Network error fetching transactions for insights: {e}")
            return {
                "success": "false",
                "data": {},
                "message": BANK_SERVICE_UNAVAILABLE
            }
        except Exception as e:
            logger.error(f"Error analyzing spending: {e}")
            return {
                "success": "false",
                "data": {},
                "message": ORCHESTRATOR_INTERNAL_ERROR
            }

    async def _fetch_transactions_with_filters(self, entities: Dict[str, Any], customer_id: Optional[int] = None, phone: Optional[str] = None) -> list:
        """Fetch transactions with date and recipient filtering."""
        # Extract filter parameters
        recipient = entities.get("recipient")
        category = entities.get("category")
        count = entities.get("count", 5)  # Default to analyzing last 5 transactions
        timeframe = entities.get("timeframe")
        start_date = entities.get("start_date")
        end_date = entities.get("end_date")
        
        # Handle priority logic: if start_date is present but end_date is missing, and timeframe is also present
        # Prioritize start_date and set end_date as the current day
        if start_date and not end_date and timeframe:
            end_date = datetime.now().strftime("%Y-%m-%d")
        # Convert timeframe to start_date and end_date if a timeframe is provided and no dates are set
        elif timeframe and not start_date and not end_date:
            start_date, end_date = _convert_timeframe_to_dates(timeframe)

        # Build API parameters
        params = {}
        
        # Add customer identification parameters (filter out None values)
        if customer_id is not None:
            params["customer_id"] = customer_id
        if phone is not None:
            params["phone"] = phone
            
        if recipient:
            params["recipient"] = recipient
        if category:
            params["category"] = category
        
        # Add date parameters if present
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
            
        # Only add a limit if no date filtering is used
        if not (start_date or end_date):
            params["limit"] = count
        
        # Make API call
        try:
            response = await self.client.get(f"{self.base_url}{TRANSACTIONS_ENDPOINT}", params=params)
            response.raise_for_status()
            txn_data = response.json()
            return txn_data.get("transactions", [])
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching filtered transactions: {e.response.status_code} - {e.response.text}")
            raise
        except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
            logger.error(f"Network error fetching filtered transactions: {e}")
            raise
        except Exception as e:
            logger.error(f"Error fetching filtered transactions: {e}")
            raise

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

# Global orchestrator instance
orchestrator = BankingOrchestrator()

async def orchestrate_banking_request(intent_and_banking_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Args:
        intent_and_banking_data: Dictionary containing intent, entities, and action, and other banking api data.
        
    Returns:
        Dictionary with orchestrator_data
    """
    return await orchestrator.process_intent(intent_and_banking_data)
