import os
import sys
import datetime
import random
import uuid
import string

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# For direct script execution
if __name__ == "__main__":
    from database import SessionLocal
    from models import Customer, Account, Transaction, Beneficiary
else:
    # For module import
    from banking.database import SessionLocal
    from banking.models import Customer, Account, Transaction, Beneficiary

db = SessionLocal()

# Get current date for data generation
current_date = datetime.datetime(2025, 10, 1)  # Current date from context

# =========================
# 1. Create Customers
# =========================
customers = [
    Customer(
        name="Amit Sharma",
        email="amit.sharma@example.com",
        phone="9876543210",
        address="B-404, Prateek Apartment, Andheri West, Mumbai, Maharashtra 400053, India",
        date_of_birth=datetime.datetime(1990, 5, 21),
        is_active=True
    ),
    Customer(
        name="Priya Singh",
        email="priya.singh@example.com",
        phone="9123456780",
        address="C-12, Green Park Extension, New Delhi, Delhi 110016, India",
        date_of_birth=datetime.datetime(1988, 8, 15),
        is_active=True
    ),
    Customer(
        name="Rahul Verma",
        email="rahul.verma@example.com",
        phone="9988776655",
        address="506, Prestige Meridian, M.G. Road, Bangalore, Karnataka 560001, India",
        date_of_birth=datetime.datetime(1992, 2, 10),
        is_active=True
    ),
]

db.add_all(customers)
db.commit()

# =========================
# 2. Create Accounts
# =========================
# Generate realistic account numbers and IFSC codes
accounts = [
    Account(
        account_number="31245678901234",  # SBI format (14 digits)
        account_type="savings",
        balance=145327.00,
        currency="INR",
        branch="Mumbai Andheri",
        ifsc_code="SBIN0001234",  # SBI IFSC format (SBIN0XXXXX)
        customer_id=customers[0].id,
        is_active=True
    ),
    Account(
        account_number="5240780123456789",  # HDFC format (16 digits)
        account_type="savings",
        balance=87425.50,
        currency="INR",
        branch="Delhi Green Park",
        ifsc_code="HDFC0000456",  # HDFC IFSC format
        customer_id=customers[1].id,
        is_active=True
    ),
    Account(
        account_number="09876543211234",  # ICICI format (14 digits)
        account_type="current",
        balance=302753.25,
        currency="INR",
        branch="Bangalore MG Road",
        ifsc_code="ICIC0000789",  # ICICI IFSC format
        customer_id=customers[2].id,
        is_active=True
    ),
]

db.add_all(accounts)
db.commit()

# =========================
# 3. Create Beneficiaries
# =========================
beneficiaries = [
    # 3 duplicates - Shailesh
    Beneficiary(
        name="Shailesh Kumar",
        account_number="33456789012345",  # SBI format
        bank_name="SBI",
        customer_id=customers[0].id,
        nickname="sam",
        tag="friend",
        ifsc_code="SBIN0004567",
        is_active=True
    ),
    Beneficiary(
        name="Shailesh Gupta",
        account_number="5240780198765432",  # HDFC format
        bank_name="HDFC Bank",
        customer_id=customers[0].id,
        nickname="kumar",
        tag="colleague",
        ifsc_code="HDFC0002345",
        is_active=True
    ),
    Beneficiary(
        name="Shailesh Kumar",
        account_number="09876543219876",  # ICICI format
        bank_name="ICICI Bank",
        customer_id=customers[1].id,
        nickname="rajat",
        tag="family",
        ifsc_code="ICIC0003456",
        is_active=True
    ),

    # 3 unique names
    Beneficiary(
        name="Ramesh Kumar",
        account_number="9123456789012",  # Axis format
        bank_name="Axis Bank",
        customer_id=customers[1].id,
        nickname="ramesh",
        tag="friend",
        ifsc_code="UTIB0000123",
        is_active=True
    ),
    Beneficiary(
        name="Suresh Patil",
        account_number="1234567891234",  # Kotak format
        bank_name="Kotak Mahindra Bank",
        customer_id=customers[2].id,
        nickname="suresh",
        tag="business",
        ifsc_code="KKBK0000456",
        is_active=True
    ),
    Beneficiary(
        name="Anita Desai",
        account_number="1098765432123",  # Yes Bank format
        bank_name="Yes Bank",
        customer_id=customers[0].id,
        nickname="anita",
        tag="family",
        ifsc_code="YESB0000789",
        is_active=True
    ),
]

db.add_all(beneficiaries)
db.commit()

# =========================
# 4. Create Transactions with realistic data
# =========================
merchant_list = [
    ("Swiggy", "food"), 
    ("Zomato", "food"), 
    ("Amazon", "e-commerce"),
    ("Flipkart", "e-commerce"), 
    ("MSEB Mumbai", "utility"), 
    ("Delhi Jal Board", "utility"),
    ("Mahanagar Gas", "utility"), 
    ("Taj Hotel", "dining"), 
    ("Myntra", "e-commerce"), 
    ("Jio Mobile", "utility"),
    ("IRCTC", "travel"),
    ("MakeMyTrip", "travel"),
    ("Uber", "transportation"),
    ("Ola", "transportation"),
    ("Netflix", "entertainment"),
    ("Hotstar", "entertainment"),
    ("BigBasket", "groceries"),
    ("Grofers", "groceries"),
    ("Apollo Pharmacy", "healthcare"),
    ("Medlife", "healthcare")
]

# Additional food vendors for more variety
food_merchants = [
    ("Swiggy", "food"),
    ("Zomato", "food"),
    ("Domino's Pizza", "food"),
    ("McDonald's", "food"),
    ("KFC", "food"),
    ("Pizza Hut", "food"),
    ("Burger King", "food"),
    ("Subway", "food"),
    ("Wow! Momo", "food"),
    ("Behrouz Biryani", "food"),
    ("Faasos", "food"),
    ("Sweet Truth", "food"),
    ("Chaayos", "food"),
    ("Starbucks", "food"),
    ("Theobroma", "food")
]

# E-commerce merchants
ecommerce_merchants = [
    ("Amazon", "e-commerce"),
    ("Flipkart", "e-commerce"),
    ("Myntra", "e-commerce"),
    ("Ajio", "e-commerce"),
    ("Tata CLiQ", "e-commerce"),
    ("Nykaa", "e-commerce"),
    ("Firstcry", "e-commerce"),
    ("Snapdeal", "e-commerce"),
    ("Meesho", "e-commerce"),
    ("Reliance Digital", "e-commerce"),
    ("Croma", "e-commerce"),
    ("Pepperfry", "e-commerce")
]

payment_methods = ["upi", "neft", "rtgs", "imps", "card", "cash"]

# Calculate date ranges
start_date = datetime.datetime(current_date.year, 1, 1)  # Jan 1st of current year
months_to_generate = current_date.month  # All months up to current month
days_in_current_month = current_date.day  # Days in current month

# Calculate last week's date range
one_week_ago = current_date - datetime.timedelta(days=7)
last_week_start = one_week_ago
last_week_end = current_date

# Calculate last month's date range 
one_month_ago = current_date.replace(day=1) - datetime.timedelta(days=1)
last_month_start = one_month_ago.replace(day=1)
last_month_end = current_date

transactions = []

# Generate regular transactions for all accounts
for account in db.query(Account).all():
    # Generate transactions for each month
    for month in range(1, months_to_generate + 1):
        # Determine how many transactions to create this month
        if month == current_date.month:
            # For current month, only generate up to current day
            txn_count = min(days_in_current_month, 15)  # Max 15 txns per month but limit to current day
        else:
            # For past months, generate random number of transactions
            txn_count = random.randint(5, 10)
        
        # Create transactions for this month
        for i in range(txn_count):
            merchant, category = random.choice(merchant_list)
            
            # For current month, limit day to current day
            if month == current_date.month:
                day = random.randint(1, days_in_current_month)
            else:
                # For other months, use any day in the month
                day = random.randint(1, 28)
                
            txn_date = datetime.datetime(current_date.year, month, day)
            
            # Generate realistic transaction reference
            payment_method = random.choice(payment_methods)
            
            # Generate reference ID based on payment method
            if payment_method == "upi":
                reference_id = f"UPI{uuid.uuid4().hex[:16].upper()}"
            elif payment_method == "neft":
                reference_id = f"NEFT{txn_date.strftime('%Y%m%d')}{random.randint(100000, 999999)}"
            elif payment_method == "rtgs":
                reference_id = f"RTGS{txn_date.strftime('%Y%m%d')}R{random.randint(10000, 99999)}"
            elif payment_method == "imps":
                reference_id = f"IMPS{random.randint(100000000, 999999999)}"
            elif payment_method == "card":
                reference_id = f"CARD{txn_date.strftime('%Y%m%d')}{random.randint(1000, 9999)}"
            else:  # cash
                reference_id = f"CASH{txn_date.strftime('%Y%m%d')}{random.randint(1000, 9999)}"
            
            # Determine realistic amount based on category
            if category == "utility":
                amount = random.randint(500, 3000)
            elif category == "food":
                amount = random.randint(200, 1500)
            elif category == "e-commerce":
                amount = random.randint(1000, 10000)
            elif category == "travel":
                amount = random.randint(2000, 15000)
            elif category == "transportation":
                amount = random.randint(100, 500)
            elif category == "entertainment":
                amount = random.randint(200, 1000)
            elif category == "groceries":
                amount = random.randint(500, 5000)
            elif category == "healthcare":
                amount = random.randint(500, 3000)
            elif category == "dining":
                amount = random.randint(1000, 8000)
            else:
                amount = random.randint(500, 5000)
            
            # Most transactions are debits, but some are credits
            transaction_type = "debit" if random.random() < 0.8 else "credit"
            
            # Create transaction object
            txn = Transaction(
                transaction_type=transaction_type,
                amount=amount,
                recipient=merchant,
                transaction_date=txn_date,
                reference_id=reference_id,
                category=category,
                payment_method=payment_method,
                from_account_id=account.id
            )
            transactions.append(txn)

# =========================
# 5. Add special transactions for Customer 1 and 2
# =========================

# For first two customer accounts
for account_idx in range(2):  # Only for customer 1 and 2
    account = accounts[account_idx]
    
    # Add multiple Swiggy transactions in the last month
    for i in range(8):
        # Spread across the last month
        days_back = random.randint(0, 30)
        txn_date = current_date - datetime.timedelta(days=days_back)
        
        # Random food merchant, but higher probability of Swiggy
        merchant, category = random.choice(food_merchants) if random.random() < 0.7 else ("Swiggy", "food")
        
        # Realistic food amount
        amount = random.randint(200, 800)
        
        # Mostly UPI payments for food
        payment_method = "upi" if random.random() < 0.8 else random.choice(["card", "cash"])
        
        reference_id = f"UPI{uuid.uuid4().hex[:16].upper()}" if payment_method == "upi" else f"CARD{txn_date.strftime('%Y%m%d')}{random.randint(1000, 9999)}"
        
        txn = Transaction(
            transaction_type="debit",
            amount=amount,
            recipient=merchant,
            transaction_date=txn_date,
            reference_id=reference_id,
            category="food",
            payment_method=payment_method,
            from_account_id=account.id
        )
        transactions.append(txn)
    
    # Add more frequent Swiggy transactions in the last week
    for i in range(5):
        # Spread across the last week
        days_back = random.randint(0, 6)
        txn_date = current_date - datetime.timedelta(days=days_back)
        
        # Higher probability of Swiggy in the last week
        merchant = "Swiggy" if random.random() < 0.6 else random.choice(["Zomato", "Domino's Pizza", "McDonald's"])
        
        amount = random.randint(200, 600)  # Typical food order amounts
        
        payment_method = "upi"
        reference_id = f"UPI{uuid.uuid4().hex[:16].upper()}"
        
        txn = Transaction(
            transaction_type="debit",
            amount=amount,
            recipient=merchant,
            transaction_date=txn_date,
            reference_id=reference_id,
            category="food",
            payment_method=payment_method,
            from_account_id=account.id
        )
        transactions.append(txn)
    
    # Add multiple Amazon transactions spread over the last month
    for i in range(6):
        days_back = random.randint(0, 30)
        txn_date = current_date - datetime.timedelta(days=days_back)
        
        # Random e-commerce merchant, but higher probability of Amazon
        merchant = "Amazon" if random.random() < 0.7 else random.choice([m[0] for m in ecommerce_merchants])
        
        # Realistic Amazon purchase amounts
        amount = random.randint(500, 5000)
        
        # Card is more common for e-commerce
        payment_method = "card" if random.random() < 0.7 else "upi"
        
        if payment_method == "card":
            reference_id = f"CARD{txn_date.strftime('%Y%m%d')}{random.randint(1000, 9999)}"
        else:
            reference_id = f"UPI{uuid.uuid4().hex[:16].upper()}"
        
        txn = Transaction(
            transaction_type="debit",
            amount=amount,
            recipient=merchant,
            transaction_date=txn_date,
            reference_id=reference_id,
            category="e-commerce",
            payment_method=payment_method,
            from_account_id=account.id
        )
        transactions.append(txn)
    
    # Add concentrated Amazon purchases in the last week
    for i in range(3):
        days_back = random.randint(0, 6)
        txn_date = current_date - datetime.timedelta(days=days_back)
        
        # Last week mostly Amazon
        merchant = "Amazon"
        
        # Varying purchase amounts
        amount = random.randint(1000, 8000)
        
        payment_method = "card"
        reference_id = f"CARD{txn_date.strftime('%Y%m%d')}{random.randint(1000, 9999)}"
        
        txn = Transaction(
            transaction_type="debit",
            amount=amount,
            recipient=merchant,
            transaction_date=txn_date,
            reference_id=reference_id,
            category="e-commerce",
            payment_method=payment_method,
            from_account_id=account.id
        )
        transactions.append(txn)
    
    # Add specific queries for "last week transactions of food, Swiggy"
    # Make sure we have transactions for every day of the last week
    for day in range(7):
        txn_date = current_date - datetime.timedelta(days=day)
        
        # Higher probability of Swiggy
        if random.random() < 0.7:
            merchant = "Swiggy"
        else:
            merchant = random.choice(["Zomato", "Domino's Pizza", "KFC"])
        
        amount = random.randint(250, 750)  # Realistic food delivery amounts
        
        payment_method = "upi"
        reference_id = f"UPI{uuid.uuid4().hex[:16].upper()}"
        
        txn = Transaction(
            transaction_type="debit",
            amount=amount,
            recipient=merchant,
            transaction_date=txn_date,
            reference_id=reference_id,
            category="food",
            payment_method=payment_method,
            from_account_id=account.id
        )
        transactions.append(txn)

db.add_all(transactions)
db.commit()

# Calculate some stats for the print message
total_transactions = len(transactions)
food_transactions = sum(1 for t in transactions if t.category == 'food')
ecommerce_transactions = sum(1 for t in transactions if t.category == 'e-commerce')
swiggy_transactions = sum(1 for t in transactions if t.recipient == 'Swiggy')
amazon_transactions = sum(1 for t in transactions if t.recipient == 'Amazon')

print(f"Seed data inserted successfully (Jan {current_date.year} - {current_date.day} {current_date.strftime('%b')} {current_date.year})!")
print(f"Total transactions: {total_transactions}")
print(f"Food transactions: {food_transactions} (Swiggy: {swiggy_transactions})")
print(f"E-commerce transactions: {ecommerce_transactions} (Amazon: {amazon_transactions})")
db.close()