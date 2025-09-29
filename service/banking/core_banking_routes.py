from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from .database import get_db
from .models import Customer, Account, Transaction, Beneficiary
from pydantic import BaseModel
from typing import Optional, List
import re

router = APIRouter(prefix="/bank/me", tags=["banking"])

def normalize_text(text: str) -> str:
    """Normalize text for beneficiary matching by converting to lowercase, removing spaces, 
    and replacing textual numbers with digits."""
    if not text:
        return ""
    
    # Convert to lowercase
    normalized = text.lower()
    
    # Remove spaces
    normalized = normalized.replace(" ", "")
    
    # Replace textual numbers with digits
    number_replacements = {
        "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
        "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
        "ten": "10"
    }
    
    for word, digit in number_replacements.items():
        normalized = normalized.replace(word, digit)
    
    return normalized

class PaymentRequest(BaseModel):
    to: str
    amount: float
    transaction_type: Optional[str] = None
    payment_method: Optional[str] = None
    category: Optional[str] = None

def format_contact_details(contacts, limit=None):
    """Helper function to format contact details for error messages"""
    details = []
    for b in contacts:
        identifier = f"'{b.name}'"
        if b.nickname:
            identifier += f" (nickname: {b.nickname})"
        if b.tag:
            identifier += f" (tag: {b.tag})"
        details.append(identifier)
    
    if limit and len(details) > limit:
        displayed = details[:limit]
        more_count = len(details) - limit
        return f"{', '.join(displayed)} and {more_count} more"
    return ', '.join(details)

def find_beneficiary(db: Session, customer_id: int, to: str):
    """Find a beneficiary by name, nickname, or tag with smart conflict handling."""
    # Normalize the search query
    normalized_to = normalize_text(to)
    print(f"Finding to {to}")
    print(f"Finding beneficiary for {normalized_to}")


    # Get all beneficiaries for this customer
    all_beneficiaries = db.query(Beneficiary).filter(
        Beneficiary.customer_id == customer_id
    ).all()

    print(f"Found beneficiaries: {all_beneficiaries} ")

    # First, try exact matches on each field using normalized comparison
    for field in ["name", "nickname", "tag"]:
        matches = []
        for beneficiary in all_beneficiaries:
            field_value = getattr(beneficiary, field)
            if field_value and normalize_text(field_value) == normalized_to:
                matches.append(beneficiary)
        
        if matches:
            if len(matches) == 1:
                return matches[0]
            
            # Multiple matches found - check if we can distinguish by nickname or tag
            nicknames = [b.nickname for b in matches if b.nickname]
            unique_nicknames = set(nicknames)
            if len(unique_nicknames) > 1:
                nickname_options = ", ".join([f"'{nick}'" for nick in unique_nicknames if nick])
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"There are multiple '{to}' exist in the beneficiaries. Please choose from: {', '.join(nicknames)}."
                )
            
            # Try to distinguish by tags
            tags = [b.tag for b in matches if b.tag]
            unique_tags = set(tags)
            if len(unique_tags) > 1:
                tag_options = ", ".join([f"'{tag}'" for tag in unique_tags if tag])
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"There are multiple '{to}' exist in the beneficiaries with the same nickname but different tags. Please choose from: {', '.join(tags)}."
                )
            
            # Can't distinguish by either nickname or tag
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"There are multiple '{to}' exist in the beneficiaries that can't be distinguished. Please use a nickname or tag to be more specific."
            )

    # No exact matches found, try partial matches using normalized comparison
    matches = []
    for beneficiary in all_beneficiaries:
        # Check if a normalized search term is contained in any normalized field
        if (beneficiary.name and normalized_to in normalize_text(beneficiary.name)) or \
           (beneficiary.nickname and normalized_to in normalize_text(beneficiary.nickname)) or \
           (beneficiary.tag and normalized_to in normalize_text(beneficiary.tag)):
            matches.append(beneficiary)

    if not matches:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Beneficiary '{to}' does exist in your account. Please check the beneficiary name or add them as a new contact before sending money."
        )

    if len(matches) > 1:
        details = []
        for b in matches:
            identifier = f"'{b.name}'"
            if b.nickname:
                identifier += f" (nickname: {b.nickname})"
            if b.tag:
                identifier += f" (tag: {b.tag})"
            details.append(identifier)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"There are multiple beneficiaries that partially match '{to}': {', '.join(details)}. Please use a more specific name, nickname, or tag."
        )

    return matches[0]

@router.get("/balance")
async def get_balance(
    customer_id: int = None,
    phone: str = None,
    db: Session = Depends(get_db)
):
    """Get balance for a customer account (by customer_id or phone)"""
    if phone:
        customer = db.query(Customer).filter(Customer.phone == phone).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"Invalid phone number '{phone}'. Please check the number and try again."
            )
        customer_id = customer.id
    else:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Invalid customer ID {customer_id}."
            )

    if not customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="To know your balance, please provide either a customer ID or a registered phone number."
        )

    account = db.query(Account).filter(
        Account.customer_id == customer_id,
        Account.is_active == True
    ).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No active account was found for customer ID {customer_id}. If you believe this is an error, please contact customer support."
        )

    return {"balance": account.balance,"customer_id":customer_id,"customer_name": customer.name}

@router.post("/pay")
async def pay_money(
    request: PaymentRequest,
    customer_id: int = None,
    phone: str = None,
    db: Session = Depends(get_db)
):
    """Send money to a merchant or contact"""

    # Identify customer
    if phone:
        customer = db.query(Customer).filter(Customer.phone == phone).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incorrect Phone number '{phone}'. Please check the number and try again."
            )
        customer_id = customer.id

    if not customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="To make a payment, please provide either a customer ID or a registered phone number."
        )

    to = request.to
    amount = request.amount
    transaction_type = request.transaction_type or "debit"
    payment_method = request.payment_method or "upi"
    category = request.category

    # Resolve beneficiary
    beneficiary = find_beneficiary(db, customer_id, to)

    # Categorize merchant
    food_merchants = ["swiggy", "zomato", "restaurant"]
    ecommerce_merchants = ["amazon", "myntra", "flipkart"]
    utility_merchants = ["electricity", "water", "gas", "mobile"]

    if category:
        category_lower = category.lower()
        if any(m in category_lower for m in food_merchants):
            category = "food"
        elif any(m in category_lower for m in ecommerce_merchants):
            category = "e-commerce"
        elif any(m in category_lower for m in utility_merchants):
            category = "utility"
        else:
            category = "individual"
    else:
        category = "individual"

    # Find active account
    account = db.query(Account).filter(
        Account.customer_id == customer_id,
        Account.is_active == True
    ).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer ID {customer_id} is not valid. If you believe this is an error, please contact customer support."
        )

    # Balance check
    if amount > account.balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance, your account balance of ₹{account.balance:.2f} is not enough to complete this transaction of ₹{amount:.2f}."
        )

    # Deduct balance
    account.balance -= amount

    # Create transaction
    reference_id = f"TXN-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    transaction = Transaction(
        transaction_type=transaction_type,
        amount=amount,
        recipient=beneficiary.name,
        reference_id=reference_id,
        payment_method=payment_method,
        category=category,
        from_account_id=account.id,
        transaction_date=datetime.now()  # Explicitly set current time
    )

    db.add(transaction)
    db.commit()
    
    # Refresh the transaction to get its ID and other database-generated values
    db.refresh(transaction)
    # Get 5 most recent transactions from the current date for this specific account
    current_datetime = datetime.now()
    
    recent_transactions = db.query(Transaction).filter(
        Transaction.from_account_id == account.id,  # Filter by the current account ID
        Transaction.transaction_date <= current_datetime  # Filter by current datetime or before
    ).order_by(
        desc(Transaction.transaction_date)  # Sort by transaction date descending
    ).limit(5).all()
    
    # Format recent transactions for response
    recent_txn_list = []
    for txn in recent_transactions:
        recent_txn_list.append({
            "id": txn.id,
            "amount": txn.amount,
            "recipient": txn.recipient,
            "transaction_date": txn.transaction_date.strftime("%Y-%m-%d %H:%M:%S"),
            "reference_id": txn.reference_id,
            "category": txn.category,
            "payment_method": txn.payment_method,
            "transaction_type": txn.transaction_type or ""
        })

    return {
        "status": "success",
        "to": beneficiary.name,
        "amount": amount,
        "balance": account.balance,
        "reference_id": reference_id,
        "payment_method": payment_method,
        "category": category,
        "recent_transactions": recent_txn_list
    }
@router.get("/transactions")
async def search_txn(
    customer_id: int = None,
    phone: str = None,
    recipient: str = None,
    category: str = None,
    limit: int = 50,  # Set a higher default limit
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    if phone:
        customer = db.query(Customer).filter(
            Customer.phone == phone,
            Customer.is_active == True
        ).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"Invalid phone number '{phone}'."
            )
        customer_id = customer.id

    query = db.query(Transaction).order_by(desc(Transaction.transaction_date))

    # Filter by customer_id if provided
    if customer_id is not None:
        accounts = db.query(Account.id).filter(
            Account.customer_id == customer_id
        ).all()
        account_ids = [a.id for a in accounts]
        if account_ids:
            query = query.filter(Transaction.from_account_id.in_(account_ids))
        else:
            return {"transactions": []}

    # Filter by recipient if provided
    if recipient:
        query = query.filter(Transaction.recipient.ilike(f"%{recipient}%"))

    # Filter by category if provided
    if category:
        query = query.filter(Transaction.category.ilike(f"%{category}%"))

    # Filter by date range if provided
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Transaction.transaction_date >= start_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"The start date ('{start_date}') is not in the correct format. Please use YYYY-MM-DD (e.g., 2025-09-25) and try again."
            )
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(Transaction.transaction_date < end_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"The end date ('{end_date}') is not in the correct format. Please use YYYY-MM-DD (e.g., 2025-09-25) and try again."
            )

    # Apply all filters first, then apply limit if provided
    if limit:
        db_transactions = query.limit(limit).all()
    else:
        db_transactions = query.all()

    return {"transactions": db_transactions}