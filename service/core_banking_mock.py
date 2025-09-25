from fastapi import APIRouter
from datetime import datetime, timedelta

router = APIRouter(prefix="/bank/me", tags=["banking"])

# Mock DB
BALANCE = 12500.50
CONTACTS = {"Ananya": "ananya@upi", "Rajiv": "rajiv@upi"}
TRANSACTIONS = [
    {"id": 1, "merchant": "Amazon", "amount": -1200, "date": "2025-08-01"},
    {"id": 2, "merchant": "Swiggy", "amount": -500, "date": "2025-08-05"},
    {"id": 3, "merchant": "Salary", "amount": 50000, "date": "2025-08-01"},
    {"id": 4, "merchant": "Swiggy", "amount": -700, "date": "2025-08-15"},
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
async def search_txn(merchant: str = None, limit: int = 5):
    results = TRANSACTIONS
    if merchant:
        results = [t for t in TRANSACTIONS if merchant.lower() in t["merchant"].lower()]
    return {"transactions": results[-limit:]}
