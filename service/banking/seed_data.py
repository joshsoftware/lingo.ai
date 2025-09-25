from database import SessionLocal
from models import Customer, Account, Transaction, Beneficiary
import datetime
import random

db = SessionLocal()

# 1. Create Customers
customers = [
    Customer(
        name="Amit Sharma",
        email="amit.sharma@example.com",
        phone="9876543210",
        address="Mumbai, India",
        date_of_birth=datetime.datetime(1990, 5, 21),
        is_active=True
    ),
    Customer(
        name="Priya Singh",
        email="priya.singh@example.com",
        phone="9123456780",
        address="Delhi, India",
        date_of_birth=datetime.datetime(1988, 8, 15),
        is_active=True
    ),
    Customer(
        name="Rahul Verma",
        email="rahul.verma@example.com",
        phone="9988776655",
        address="Bangalore, India",
        date_of_birth=datetime.datetime(1992, 2, 10),
        is_active=True
    ),
]
db.add_all(customers)
db.commit()

# 2. Create Accounts
accounts = [
    Account(
        account_number="AMIT12345",
        account_type="savings",
        balance=15000.0,
        currency="INR",
        branch="Mumbai Main",
        ifsc_code="SBIN0000123",
        customer_id=customers[0].id,
        is_active=True
    ),
    Account(
        account_number="PRIYA54321",
        account_type="savings",
        balance=22000.0,
        currency="INR",
        branch="Delhi Central",
        ifsc_code="SBIN0000456",
        customer_id=customers[1].id,
        is_active=True
    ),
    Account(
        account_number="RAHUL67890",
        account_type="current",
        balance=30500.0,
        currency="INR",
        branch="Bangalore City",
        ifsc_code="SBIN0000789",
        customer_id=customers[2].id,
        is_active=True
    ),
]
db.add_all(accounts)
db.commit()

# 3. Create Transactions (10 per customer, random dates in last 3 months)
merchant_list = [
    ("swiggy", "food"), ("zomato", "food"), ("amazon", "e-commerce"),
    ("flipkart", "e-commerce"), ("electricity", "utility"), ("water", "utility"),
    ("gas", "utility"), ("restaurant", "food"), ("myntra", "e-commerce"), ("mobile", "utility")
]

transactions = []
for i, account in enumerate(accounts):
    for j in range(10):
        merchant, category = random.choice(merchant_list)
        txn_date = datetime.datetime(2024, 7, 6) + datetime.timedelta(days=random.randint(0, 92))
        txn = Transaction(
            transaction_type="debit",
            amount=random.randint(500, 3000),
            recipient=merchant,
            transaction_date=txn_date,
            reference_id=f"TXN-{i+1}-{j+1}-{txn_date.strftime('%Y%m%d')}",
            category=category,
            payment_method="upi",
            from_account_id=account.id
        )
        transactions.append(txn)
db.add_all(transactions)
db.commit()

# 4. Create Beneficiaries (5 with duplicate name "Shailesh")
# 4. Create Beneficiaries (3 named "Shailesh" + 3 different names)
beneficiaries = [
    # 3 duplicates - Shailesh
    Beneficiary(
        name="Shailesh",
        account_number="SHL1001",
        bank_name="SBI",
        customer_id=customers[0].id,
        nickname="shailesh1",
        tag="friend",
        ifsc_code="SBIN0000123",
        is_active=True
    ),
    Beneficiary(
        name="Shailesh",
        account_number="SHL1002",
        bank_name="HDFC",
        customer_id=customers[0].id,
        nickname="shailesh2",
        tag="colleague",
        ifsc_code="HDFC0000456",
        is_active=True
    ),
    Beneficiary(
        name="Shailesh",
        account_number="SHL1003",
        bank_name="ICICI",
        customer_id=customers[1].id,
        nickname="shailesh3",
        tag="family",
        ifsc_code="ICIC0000789",
        is_active=True
    ),

    # 3 unique names
    Beneficiary(
        name="Ramesh Kumar",
        account_number="RMK2001",
        bank_name="Axis Bank",
        customer_id=customers[1].id,
        nickname="ramesh",
        tag="friend",
        ifsc_code="UTIB0000123",
        is_active=True
    ),
    Beneficiary(
        name="Suresh Patil",
        account_number="SRP2002",
        bank_name="Kotak Mahindra",
        customer_id=customers[2].id,
        nickname="suresh",
        tag="business",
        ifsc_code="KKBK0000456",
        is_active=True
    ),
    Beneficiary(
        name="Anita Desai",
        account_number="ANT2003",
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
print("Seed data inserted successfully!")
db.close()