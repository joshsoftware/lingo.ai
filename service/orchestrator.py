"""
Banking Orchestration Service

This service handles the orchestration flow for banking operations based on intent and action data.
It processes different banking intents and calls appropriate APIs.
"""

import logging
import httpx
import os
from typing import Dict, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv
import re

load_dotenv()

logger = logging.getLogger(__name__)

# API Endpoint Constants
BALANCE_ENDPOINT = "/bank/me/balance"
TRANSACTIONS_ENDPOINT = "/bank/me/transactions"
PAY_ENDPOINT = "/bank/me/pay"


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
            import re
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


def _calculate_merchant_insights(transactions: list, merchant: str, period_desc: str) -> Dict[str, Any]:
    """Calculate insights for a specific merchant."""
    merchant_txns = [t for t in transactions if merchant.lower() in t.get("merchant", "").lower()]
    total_spent = sum(abs(t.get("amount", 0)) for t in merchant_txns if t.get("amount", 0) < 0)

    return {
        "total_spent": total_spent,
        "message": f"You've spent {total_spent:,.2f} INR on {merchant} {period_desc}."
    }


def _calculate_category_insights(transactions: list, category: str, period_desc: str) -> Dict[str, Any]:
    """Calculate insights for a specific category."""
    # For category-based insights (simplified - using merchant as category proxy)
    category_txns = [t for t in transactions if category.lower() in t.get("merchant", "").lower()]
    total_spent = sum(abs(t.get("amount", 0)) for t in category_txns if t.get("amount", 0) < 0)

    return {
        "total_spent": total_spent,
        "message": f"You've spent {total_spent:,.2f} INR on {category} category {period_desc}."
    }


def _calculate_general_insights(transactions: list, period_desc: str) -> Dict[str, Any]:
    """Calculate general spending insights."""
    total_spent = sum(abs(t.get("amount", 0)) for t in transactions if t.get("amount", 0) < 0)

    if not transactions:
        return {
            "total_spent": 0,
            "message": f"No spending data found for {period_desc}."
        }

    # Find a top-spending merchant
    merchant_totals = {}
    for t in transactions:
        if t.get("amount", 0) < 0:  # Only negative amounts (expenses)
            merchant_name = t.get("merchant", "Unknown")
            merchant_totals[merchant_name] = merchant_totals.get(merchant_name, 0) + abs(t.get("amount", 0))

    if merchant_totals:
        top_merchant = max(merchant_totals.items(), key=lambda x: x[1])
        message = f"Your top spending category {period_desc} was {top_merchant[0]} at {top_merchant[1]:,.2f} INR. Total spent: {total_spent:,.2f} INR."
    else:
        message = f"You've spent {total_spent:,.2f} INR {period_desc}."

    return {
        "total_spent": total_spent,
        "message": message
    }


def _calculate_spending_insights(transactions: list, entities: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate spending insights based on transactions and filter criteria."""
    merchant = entities.get("merchant")
    category = entities.get("category")
    timeframe = entities.get("timeframe")
    start_date = entities.get("start_date")
    end_date = entities.get("end_date")

    # Determine time period description
    period_desc = _get_period_description(timeframe, start_date, end_date)

    if merchant:
        return _calculate_merchant_insights(transactions, merchant, period_desc)
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

    async def process_intent(self, intent_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Orchestrates intent processing and returns a structured response.

        Args:
            intent_data: Dictionary containing intent, entities, and action.

        Returns:
            Dictionary with orchestrator_data.
        """
        intent = intent_data.get("intent")
        entities = intent_data.get("entities", {})
        action = intent_data.get("action")

        logger.info(f"Processing intent: {intent} with action: {action}")
        
        # Route to the appropriate handler
        if intent == "check_balance":
            orchestrator_data = await self._handle_check_balance()
        elif intent == "recent_txn":
            orchestrator_data = await self._handle_recent_transactions(entities)
        elif intent == "transfer_money":
            orchestrator_data = await self._handle_transfer_money(entities, action)
        elif intent == "txn_insights":
            orchestrator_data = await self._handle_txn_insights(entities)
        else:
            orchestrator_data = _handle_unknown_intent()
        
        return orchestrator_data

    
    async def _handle_check_balance(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}{BALANCE_ENDPOINT}")
                response.raise_for_status()
                balance_data = response.json()
                
                return {
                    "success": "true",
                    "data": balance_data,
                    "message": f"Your account balance is {balance_data['balance']:,.2f}."
                }
        except Exception as e:
            logger.error(f"Error fetching balance: {e}")
            return {
                "success": "false",
                "data": {},
                "message": "Sorry, I couldn't fetch your balance at the moment. Please try again later."
            }
    
    async def _handle_recent_transactions(self, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle recent_txn intent - optional count parameter."""
        try:
            count = entities.get("count", 5)  # Default to 5 transactions
            merchant = entities.get("merchant")
            
            # Ensure count is a valid integer
            if count is None:
                count = 5
            elif isinstance(count, str):
                try:
                    count = int(count)
                except ValueError:
                    count = 5
            
            params = {"limit": count}
            if merchant:
                params["merchant"] = merchant
            
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}{TRANSACTIONS_ENDPOINT}", params=params)
                response.raise_for_status()
                txn_data = response.json()
                
                transactions = txn_data.get("transactions", [])
                if merchant:
                    message = f"Here are your {len(transactions)} most recent {merchant} transactions."
                else:
                    message = f"Here are your {len(transactions)} most recent transactions."
                
                return {
                    "success": "true",
                    "data": txn_data,
                    "message": message
                }
        except Exception as e:
            logger.error(f"Error fetching transactions: {e}")
            return {
                "success": "false",
                "data": {},
                "message": "Sorry, I couldn't fetch your transactions at the moment. Please try again later."
            }
    
    async def _handle_transfer_money(self, entities: Dict[str, Any], action: str) -> Dict[str, Any]:
        """Handle transfer_money intent - requires amount, currency, and recipient validation."""
        amount = entities.get("amount")
        currency = entities.get("currency")
        recipient = entities.get("recipient")
        
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
                async with httpx.AsyncClient() as client:
                    # First, make the payment
                    payment_response = await client.post(
                        f"{self.base_url}{PAY_ENDPOINT}",
                        params={"to": recipient, "amount": float(amount)}
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
            except Exception as e:
                logger.error(f"Error processing transfer: {e}")
                return {
                    "success": "false",
                    "data": {},
                    "message": "Sorry, I couldn't process the transfer at the moment. Please try again later."
                }
        
        # If the action is not "respond", don't process payment
        return {
            "success": "false",
            "data": {},
            "message": "Transfer request received but action is not set to process payment."
        }
    
    async def _handle_txn_insights(self, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle txn_insights intent - analyze spending patterns."""
        try:
            # Fetch transactions with date filtering support
            transactions = await self._fetch_transactions_with_filters(entities)
            
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
        except Exception as e:
            logger.error(f"Error analyzing spending: {e}")
            return {
                "success": "false",
                "data": {},
                "message": "Sorry, I couldn't analyze your spending at the moment. Please try again later."
            }

    async def _fetch_transactions_with_filters(self, entities: Dict[str, Any]) -> list:
        """Fetch transactions with date and merchant filtering."""
        # Extract filter parameters
        merchant = entities.get("merchant")
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
        if merchant:
            params["merchant"] = merchant
        elif category:
            params["merchant"] = category
        
        # Add date parameters if present
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
            
        # Only add a limit if no date filtering is used
        if not (start_date or end_date):
            params["limit"] = count
        
        # Make API call
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}{TRANSACTIONS_ENDPOINT}", params=params)
            response.raise_for_status()
            txn_data = response.json()
            
            return txn_data.get("transactions", [])

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

# Global orchestrator instance
orchestrator = BankingOrchestrator()

async def orchestrate_banking_request(intent_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Args:
        intent_data: Dictionary containing intent, entities, and action
        
    Returns:
        Dictionary with orchestrator_data
    """
    return await orchestrator.process_intent(intent_data)
