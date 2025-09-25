from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from banking.database import Base
import datetime

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True,autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True)
    phone = Column(String(20), unique=True, index=True)
    address = Column(Text, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    accounts = relationship("Account", back_populates="customer")
    beneficiaries = relationship("Beneficiary", back_populates="customer")
    
    def __repr__(self):
        return f"<Customer {self.name}>"

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True,autoincrement=True)
    account_number = Column(String(20), unique=True, index=True)
    account_type = Column(String(50))  # savings, current, etc.
    balance = Column(Float, default=0.0)
    currency = Column(String(3), default="INR")
    customer_id = Column(Integer, ForeignKey("customers.id"))
    branch = Column(String(100), nullable=True)        # Added field
    ifsc_code = Column(String(20), nullable=True)      # Added field
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    customer = relationship("Customer", back_populates="accounts")
    transactions_from = relationship("Transaction", back_populates="from_account", foreign_keys="Transaction.from_account_id")
    transactions_to = relationship("Transaction", back_populates="to_account", foreign_keys="Transaction.to_account_id")
    
    def __repr__(self):
        return f"<Account {self.account_number}>"

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True,autoincrement=True)
    transaction_type = Column(String(50))  # credit,debit
    amount = Column(Float, nullable=False)
    recipient = Column(String(100), nullable=True)  # Added merchant field to match mock API
    transaction_date = Column(DateTime, default=datetime.datetime.utcnow)
    reference_id = Column(String(100), unique=True, index=True)
    category = Column(String(100), nullable=True)
    payment_method = Column(String(50), nullable=True) #upi,rtgs,neft,cash,card,imps
    # Account relationships
    from_account_id = Column(Integer, ForeignKey("accounts.id"))
    to_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    
    # Back populates
    from_account = relationship("Account", back_populates="transactions_from", foreign_keys=[from_account_id])
    to_account = relationship("Account", back_populates="transactions_to", foreign_keys=[to_account_id])
    
    def __repr__(self):
        return f"<Transaction {self.id}: {self.amount}>"

class Beneficiary(Base):
    __tablename__ = "beneficiaries"
    
    id = Column(Integer, primary_key=True, index=True,autoincrement=True)
    name = Column(String(100), nullable=False)
    account_number = Column(String(20), nullable=False)
    bank_name = Column(String(100), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    nickname = Column(String(100), nullable=True)      # Added field
    tag = Column(String(50), nullable=True)            # Added field
    ifsc_code = Column(String(20), nullable=True)      # Added field
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    customer = relationship("Customer", back_populates="beneficiaries")
    
    def __repr__(self):
        return f"<Beneficiary {self.name}>"