from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from .database import get_db
from .models import Customer, Account, Transaction, Beneficiary
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/bank/me", tags=["banking"])

class PaymentRequest(BaseModel):
    to: str
    amount: float
    transaction_type: Optional[str] = None
    payment_method: Optional[str] = None
    category: Optional[str] = None

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
                detail=f"Customer with phone number '{phone}' not found "
            )
        customer_id = customer.id

    if not customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Missing required parameter: Please provide either 'customer_id' or 'phone'"
        )

    account = db.query(Account).filter(
        Account.customer_id == customer_id,
        Account.is_active == True
    ).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No active account found for customer ID {customer_id}"
        )

    return {"balance": account.balance}


@router.post("/pay")
async def pay_money(
    request: PaymentRequest,
    customer_id: int = None,
    phone: str = None,
    db: Session = Depends(get_db)
):
    """Send money to a merchant or contact"""

    if phone:
        customer = db.query(Customer).filter(Customer.phone == phone).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"Customer with phone number '{phone}' not found "
            )
        customer_id = customer.id

    if not customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Missing required parameter: Please provide either 'customer_id' or 'phone'"
        )

    to = request.to
    amount = request.amount
    transaction_type = request.transaction_type
    payment_method = request.payment_method
    category = request.category

    beneficiaries = db.query(Beneficiary).filter(
        Beneficiary.customer_id == customer_id,
        (
            (Beneficiary.name.ilike(f"%{to}%")) |
            (Beneficiary.nickname.ilike(f"%{to}%")) |
            (Beneficiary.tag.ilike(f"%{to}%"))
        )
    ).all()

    if len(beneficiaries) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No beneficiary matching '{to}' found for this customer. Please check the name or add as a new beneficiary."
        )
    if len(beneficiaries) > 1:
        beneficiary_names = [b.name for b in beneficiaries]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail=f"Multiple matching beneficiaries found for '{to}': {', '.join(beneficiary_names)}. Please use a more specific name."
        )

    beneficiary = beneficiaries[0]  

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

    account = db.query(Account).filter(
        Account.customer_id == customer_id,
        Account.is_active == True
    ).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No active account found for customer ID {customer_id}"
        )

    if amount > account.balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Insufficient balance: Required ₹{amount:.2f}, available balance ₹{account.balance:.2f}"
        )

    account.balance -= amount

    reference_id = f"TXN-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    transaction = Transaction(
        transaction_type=transaction_type,
        amount=amount,
        recipient=to,  
        reference_id=reference_id,
        payment_method=payment_method,
        category=category,
        from_account_id=account.id,  
    )

    db.add(transaction)
    db.commit()

    return {
        "status": "success",
        "to": to,
        "amount": amount,
        "balance": account.balance
    }


@router.get("/transactions")
async def search_txn(
    customer_id: int = None,
    phone: str = None,
    recipient: str = None,
    category: str = None,
    limit: int = None,
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
                detail=f"Customer with phone number '{phone}' not found or is inactive"
            )
        customer_id = customer.id

    query = db.query(Transaction).order_by(desc(Transaction.transaction_date))

    # Filter by customer_id if provided
    if customer_id is not None:
        accounts = db.query(Account.id).filter(
            Account.customer_id == customer_id,
            Account.is_active == True
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
                detail=f"Invalid start_date format '{start_date}'. Please use YYYY-MM-DD format (e.g., 2025-09-25)."
            )
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(Transaction.transaction_date < end_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Invalid end_date format '{end_date}'. Please use YYYY-MM-DD format (e.g., 2025-09-25)."
            )

    # If dates provided, ignore limit
    db_transactions = query.limit(limit if not (start_date or end_date) else None).all()

    return {"transactions": db_transactions}
