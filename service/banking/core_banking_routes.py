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

    return {"balance": account.balance,"customer_id":customer_id}


def resolve_conflict(to: str, matches, primary_field: str):
    """
    Smart conflict resolution:
    - If primary_field matches multiple entries:
      - Check if nicknames differ -> show nickname differences
      - Else check if tags differ -> show tag differences
      - Else show generic message
    """
    # Check nickname differences
    nicknames = [b.nickname for b in matches if b.nickname]
    unique_nicknames = set(nicknames)
    if len(unique_nicknames) > 1:
        details = [f"'{b.nickname}'" for b in matches if b.nickname]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Multiple beneficiaries found with {primary_field} '{to}' with different nicknames: {', '.join(details)}. Please specify which nickname."
        )

    # Nicknames same or missing, check tags
    tags = [b.tag for b in matches if b.tag]
    unique_tags = set(tags)
    if len(unique_tags) > 1:
        details = [f"'{b.tag}'" for b in matches if b.tag]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Multiple beneficiaries found with {primary_field} '{to}' with same nickname but different tags: {', '.join(details)}. Please specify which tag."
        )

    # No distinguishing nicknames or tags
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"Multiple beneficiaries found with {primary_field} '{to}' with no distinguishing nickname or tag. Please use a more specific identifier."
    )


def find_beneficiary(db: Session, customer_id: int, to: str):
    """Find a beneficiary by name, nickname, or tag with conflict handling."""
    for field in ["name", "nickname", "tag"]:
        matches = db.query(Beneficiary).filter(
            Beneficiary.customer_id == customer_id,
            getattr(Beneficiary, field).ilike(to)
        ).all()

        if matches:
            if len(matches) == 1:
                return matches[0]

            # Smart conflict resolution only for name
            if field == "name":
                resolve_conflict(to, matches, primary_field="name")
            else:
                # Fallback for nickname or tag
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
                    detail=f"Multiple beneficiaries found with {field} '{to}': {', '.join(details)}. Please specify further."
                )

    # Partial match fallback
    matches = db.query(Beneficiary).filter(
        Beneficiary.customer_id == customer_id,
        (
            Beneficiary.name.ilike(f"%{to}%") |
            Beneficiary.nickname.ilike(f"%{to}%") |
            Beneficiary.tag.ilike(f"%{to}%")
        )
    ).all()

    if not matches:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No beneficiary matching '{to}' found for this customer. "
                   f"Please check the name, nickname, or tag, or add as a new beneficiary."
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
            detail=f"Multiple beneficiaries partially match '{to}': {', '.join(details)}. Please use a more specific name, nickname, or tag."
        )

    return matches[0]


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
                detail=f"Customer with phone number '{phone}' not found"
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
            detail=f"No active account found for customer ID {customer_id}"
        )

    # Balance check
    if amount > account.balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance: Required ₹{amount:.2f}, "
                   f"available balance ₹{account.balance:.2f}"
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
    )

    db.add(transaction)
    db.commit()

    return {
        "status": "success",
        "to": beneficiary.name,
        "amount": amount,
        "balance": account.balance,
        "reference_id": reference_id,
        "payment_method": payment_method,
        "category": category
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
