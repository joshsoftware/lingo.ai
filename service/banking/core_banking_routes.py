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
        customer = db.query(Customer).filter(Customer.phone == phone, Customer.is_active == True).first()
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer with this phone not found")
        customer_id = customer.id

    if not customer_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="customer_id or phone required")

    account = db.query(Account).filter(
        Account.customer_id == customer_id,
        Account.is_active == True
    ).first()

    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    return {"balance": account.balance}


@router.post("/pay")
async def pay_money(
    request: PaymentRequest,
    customer_id: int = None,
    phone: str = None,
    db: Session = Depends(get_db)
):
    """Send money to a merchant or contact"""

    # ✅ Step 1: Resolve customer_id
    if phone:
        customer = db.query(Customer).filter(Customer.phone == phone, Customer.is_active == True).first()
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer with this phone not found")
        customer_id = customer.id

    if not customer_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="customer_id or phone required")

    # ✅ Step 2: Extract request body values
    to = request.to
    amount = request.amount
    transaction_type = request.transaction_type
    payment_method = request.payment_method
    category = request.category

    # ✅ Step 3: Check beneficiary existence
    beneficiaries = db.query(Beneficiary).filter(
        Beneficiary.customer_id == customer_id,
        (
            (Beneficiary.name.ilike(f"%{to}%")) |
            (Beneficiary.nickname.ilike(f"%{to}%")) |
            (Beneficiary.tag.ilike(f"%{to}%"))
        )
    ).all()

    if len(beneficiaries) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No matching beneficiary found")
    if len(beneficiaries) > 1:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="More than one matching beneficiary found")

    beneficiary = beneficiaries[0]  # ✅ single match

    # ✅ Step 4: Category classification
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

    # ✅ Step 5: Get customer account
    account = db.query(Account).filter(
        Account.customer_id == customer_id,
        Account.is_active == True
    ).first()

    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    if amount > account.balance:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance")

    # ✅ Step 6: Deduct balance
    account.balance -= amount

    # ✅ Step 7: Create transaction record
    reference_id = f"TXN-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    transaction = Transaction(
        transaction_type=transaction_type,
        amount=amount,
        recipient=to,  # ✅ store beneficiary name
        reference_id=reference_id,
        payment_method=payment_method ,
        category=category,
        from_account_id=account.id,   # ✅ link with sender account
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
    merchant: str = None,
    limit: int = None,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    if phone:
        customer = db.query(Customer).filter(Customer.phone == phone, Customer.is_active == True).first()
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer with this phone not found")
        customer_id = customer.id

    query = db.query(Transaction).order_by(desc(Transaction.transaction_date))

    # Filter by customer_id if provided
    if customer_id is not None:
        accounts = db.query(Account.id).filter(Account.customer_id == customer_id, Account.is_active == True).all()
        account_ids = [a.id for a in accounts]
        if account_ids:
            query = query.filter(Transaction.from_account_id.in_(account_ids))
        else:
            return {"transactions": []}

    # Filter by merchant if provided
    if merchant:
        query = query.filter(Transaction.recipient.ilike(f"%{merchant}%"))

    # Filter by date range if provided
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Transaction.transaction_date >= start_dt)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid start_date format. Use YYYY-MM-DD.")
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(Transaction.transaction_date < end_dt)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid end_date format. Use YYYY-MM-DD.")

    # If dates provided, ignore limit
    db_transactions = query.limit(limit if not (start_date or end_date) else None).all()

    return {"transactions": db_transactions}
