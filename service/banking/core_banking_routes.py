from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from .database import get_db
from .models import Customer, Account, Transaction
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/bank/me", tags=["banking"])

class PaymentRequest(BaseModel):
    to: str
    amount: float

@router.get("/balance")
async def get_balance(customer_id: int = 1, db: Session = Depends(get_db)):
    """Get balance for a customer account (default customer_id=1)"""
    account = db.query(Account).filter(
        Account.customer_id == customer_id,
        Account.is_active == True
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    return {"balance": account.balance}

@router.post("/pay")
async def pay_money(request: PaymentRequest, customer_id: int = 1, db: Session = Depends(get_db)):
    """Send money to a merchant or contact"""
    to = request.to
    amount = request.amount

    account = db.query(Account).filter(
        Account.customer_id == customer_id,
        Account.is_active == True
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if amount > account.balance:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Deduct and update balance
    account.balance -= amount
    
    # Create a transaction record
    reference_id = f"TXN-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    transaction = Transaction(
        transaction_type="payment",
        amount=amount,
        merchant=to,
        reference_id=reference_id,
        from_account_id=account.id
    )
    
    db.add(transaction)
    db.commit()

    return {
        "message": "Payment successful",
        "to": to,
        "amount": amount,
        "remaining_balance": account.balance
    }

@router.get("/transactions")
async def search_txn(
    merchant: str = None,
    limit: int = None,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction).order_by(desc(Transaction.transaction_date))

    if merchant:
        query = query.filter(Transaction.merchant.ilike(f"%{merchant}%"))

    if start_date:
        try:
            start_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Transaction.transaction_date >= start_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD.")
    if end_date:
        try:
            end_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d") + datetime.timedelta(days=1)
            query = query.filter(Transaction.transaction_date < end_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD.")

    if start_date or end_date:
        db_transactions = query.all()
    else:
        db_transactions = query.limit(limit if limit else 5).all()

    results = [
        {
            "id": t.id,
            "merchant": t.merchant,
            "amount": -t.amount if t.transaction_type != "deposit" else t.amount,
            "date": t.transaction_date.strftime("%Y-%m-%d")
        }
        for t in db_transactions
    ]
    return {"transactions": results}