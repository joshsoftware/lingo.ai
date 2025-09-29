# Initialize the banking package
from .database import Base, engine

# Create tables when the package is imported
Base.metadata.create_all(bind=engine)