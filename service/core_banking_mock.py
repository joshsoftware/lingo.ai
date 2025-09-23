from fastapi import APIRouter
from datetime import datetime, timedelta

router = APIRouter(prefix="/bank/me", tags=["banking"])

# Mock DB
BALANCE = 12500.50
CONTACTS = {"Ananya": "ananya@upi", "Rajiv": "rajiv@upi"}
TRANSACTIONS = [
    {"id": 1, "merchant": "Amazon", "amount": -1200, "date": "2025-08-01"},
    {"id": 2, "merchant": "Swiggy", "amount": -500, "date": "2025-08-05"},
    {"id": 3, "merchant": "Salary", "amount": 50000, "date": "2025-09-01"},
    {"id": 4, "merchant": "Swiggy", "amount": -700, "date": "2025-08-15"},
    {"id": 5, "merchant": "food", "amount": -500, "date": "2025-09-20"},
    {"id": 6, "merchant": "food", "amount": -500, "date": "2025-08-15"},
    {"id": 7, "merchant": "grocery", "amount": -700, "date": "2025-08-15"},
    {"id": 8, "merchant": "grocery", "amount": -700, "date": "2025-07-15"},
    {"id": 9, "merchant": "grocery", "amount": -700, "date": "2025-06-15"},
    {"id": 10, "merchant": "shopping", "amount": -1000, "date": "2025-08-15"},
    {"id": 11, "merchant": "shopping", "amount": -1000, "date": "2025-07-15"},
    {"id": 12, "merchant": "shopping", "amount": -1000, "date": "2025-06-15"},
    {"id": 13, "merchant": "shopping", "amount": -1000, "date": "2025-05-15"},
    {"id": 14, "merchant": "shopping", "amount": -1000, "date": "2025-04-15"}
]

@router.get("/balance")
async def get_balance():
    return {"balance": BALANCE}

@router.post("/pay")
async def pay_money(to: str, amount: float):
    global BALANCE
    if amount > BALANCE:
        return {"status": "failed", "reason": "Insufficient balance"}
    BALANCE -= amount
    TRANSACTIONS.append({
        "id": len(TRANSACTIONS) + 1,
        "merchant": to,
        "amount": -amount,
        "date": datetime.now().strftime("%Y-%m-%d")
    })
    return {"status": "success", "to": to, "amount": amount, "balance": BALANCE}


@router.get("/transactions")
async def search_txn(
        merchant: str = None,
        limit: int = None,
        start_date: str = None,
        end_date: str = None
):
    results = TRANSACTIONS

    # Filter by merchant if provided
    if merchant:
        results = [t for t in results if merchant.lower() in t["merchant"].lower()]

    # Filter by date range if provided
    if start_date or end_date:
        # Apply date filtering
        if start_date:
            results = [t for t in results if t["date"] >= start_date]
        if end_date:
            results = [t for t in results if t["date"] <= end_date]

        # Don't use limit when date range is provided
        return {"transactions": results}

    # Use limit only when no date filtering is applied and limit is provided
    if limit:
        return {"transactions": results[-limit:]}
    return {"transactions": results}
