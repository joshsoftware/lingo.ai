from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from .database import get_db
from .models import Customer, Account, Transaction, Beneficiary
from pydantic import BaseModel
from typing import Optional, List

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
    otp: Optional[str] = None

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

    # Get all beneficiaries for this customer
    all_beneficiaries = db.query(Beneficiary).filter(
        Beneficiary.customer_id == customer_id
    ).all()
    
    # Helper function to format beneficiary list based on differences
    def format_beneficiaries(matches):
        same_name = len(set(b.name for b in matches)) == 1
        nicknames = [b.nickname for b in matches if b.nickname]
        same_nickname = len(set(nicknames)) == 1 if nicknames else False
        
        result = []
        if same_name and nicknames and not same_nickname:
            # Names are same, nicknames different - show nicknames
            key_field = "nickname"
        elif same_name and (not nicknames or same_nickname):
            # Names same, no nicknames or same nicknames - show tags
            key_field = "tag"
        else:
            # Different names - show actual names
            key_field = "name"
            
        for b in matches:
            result.append({
                "id": b.id,
                "name": getattr(b, key_field) or "",
                "account_number": b.account_number,
            })
        return result

    # First, try exact matches on each field using normalized comparison
    for field in ["name", "nickname", "tag"]:
        matches = []
        for beneficiary in all_beneficiaries:
            field_value = getattr(beneficiary, field)
            if field_value and normalized_to in normalize_text(field_value):
                matches.append(beneficiary)
        
        if matches:
            if len(matches) == 1:
                return matches[0]
            
            # Multiple matches - return formatted list
            beneficiary_list = format_beneficiaries(matches)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "status": "duplicate",
                    "message": f"Multiple beneficiaries found matching '{to}'. Please confirm the correct beneficiary",
                    "beneficiaries": beneficiary_list
                }
            )

    # No exact matches found, try partial matches using normalized comparison
    matches = []
    for beneficiary in all_beneficiaries:
        # Check if normalized search term is contained in any normalized field
        if any(
            getattr(beneficiary, field) and 
            normalized_to in normalize_text(getattr(beneficiary, field))
            for field in ["name", "nickname", "tag"]
        ):
            matches.append(beneficiary)

    if not matches:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Beneficiary '{to}' does not exist in your account. Please check the beneficiary name or add them as a new contact before sending money."
        )

    if len(matches) > 1:
        # Multiple partial matches - return formatted list
        beneficiary_list = format_beneficiaries(matches)
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "status": "duplicate",
                "message": f"Multiple beneficiaries found matching '{to}'. Please confirm the correct beneficiary",
                "beneficiaries": beneficiary_list
            }
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
            detail="To transfer money, please provide either a customer ID or a registered phone number."
        )

    to = request.to
    amount = request.amount
    transaction_type = request.transaction_type or "debit"
    payment_method = request.payment_method or "upi"
    category = request.category
    otp = request.otp

    # Resolve beneficiary
    beneficiary = find_beneficiary(db, customer_id, to)


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
        
    # If OTP is not provided, return a confirmation message asking for OTP
    if not otp:
        
        return {
            "status": "otp",
            "message": f"Please confirm the transaction  ₹{amount:.2f} to {beneficiary.name} by entering  the OTP you have recieved on your registered mobile number"
        }
    
    
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

    # Initialize the base query
    base_query = db.query(Transaction).order_by(desc(Transaction.transaction_date))

    # Filter by customer_id if provided
    if customer_id is not None:
        accounts = db.query(Account.id).filter(
            Account.customer_id == customer_id
        ).all()
        account_ids = [a.id for a in accounts]
        if account_ids:
            base_query = base_query.filter(Transaction.from_account_id.in_(account_ids))
        else:
            return {"transactions": []}
    
    # Get transaction IDs that match recipient filter
    transaction_ids = set()
    transactions_by_recipient = []
    transactions_by_category = []
    
    # Apply recipient filter and get IDs
    if recipient:
        recipient_query = base_query.filter(Transaction.recipient.ilike(f"%{recipient}%"))
        transactions_by_recipient = recipient_query.all()
        if transactions_by_recipient:
            transaction_ids = set(t.id for t in transactions_by_recipient)
    
    # Apply category filter and get IDs
    if category:
        category_query = base_query.filter(Transaction.category.ilike(f"%{category}%"))
        transactions_by_category = category_query.all()
        if transactions_by_category:
            category_ids = set(t.id for t in transactions_by_category)
            
            # If we already have recipient IDs, find the intersection
            if transaction_ids:
                transaction_ids = transaction_ids.intersection(category_ids)
            else:
                # If no recipient filter was applied, use category IDs
                transaction_ids = category_ids
    
    # If neither recipient nor category was provided, use all transactions from base query
    if not recipient and not category:
        transaction_ids = set(t.id for t in base_query.all())
    
    # Empty result if no transactions match the filters
    if not transaction_ids:
        return {"transactions": []}
    
    # Create a query for the filtered transaction IDs
    filtered_query = db.query(Transaction).filter(Transaction.id.in_(transaction_ids))
    
    # Apply date filters
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            filtered_query = filtered_query.filter(Transaction.transaction_date >= start_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"The start date ('{start_date}') is not in the correct format. Please use YYYY-MM-DD (e.g., 2025-09-25) and try again."
            )
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            filtered_query = filtered_query.filter(Transaction.transaction_date < end_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"The end date ('{end_date}') is not in the correct format. Please use YYYY-MM-DD (e.g., 2025-09-25) and try again."
            )
    
    # Apply sort order and limit
    filtered_query = filtered_query.order_by(desc(Transaction.transaction_date))
    
    if limit:
        db_transactions = filtered_query.limit(limit).all()
    else:
        db_transactions = filtered_query.all()

    return {"transactions": db_transactions}

@router.get("/beneficiaries")
def get_beneficiaries(
    customer_id: int = None,
    phone: str = None,
    db: Session = Depends(get_db)
):
    """Retrieve all beneficiaries for a given customer (by ID or phone) with all fields."""
    
    if not customer_id and not phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide either customer_id or phone."
        )

    # If phone is provided, find customer_id first
    if phone:
        customer = db.query(Customer).filter(Customer.phone == phone).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No customer found with phone '{phone}'."
            )
        customer_id = customer.id

    # Query beneficiaries
    beneficiaries = db.query(Beneficiary).filter(
        Beneficiary.customer_id == customer_id
    ).all()

    if not beneficiaries:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No beneficiaries found for this customer."
        )

    # Return all fields dynamically
    beneficiaries = [
        {k: v for k, v in b.__dict__.items() if k != "_sa_instance_state"}
        for b in beneficiaries
    ]

    return{"beneficiaries": beneficiaries}
