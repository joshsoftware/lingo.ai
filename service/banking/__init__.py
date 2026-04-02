# Initialize the banking package
from .database import Base, engine

# Import models to ensure they're registered
from . import models
from . import error_logs

# Create tables when the package is imported
Base.metadata.create_all(bind=engine)

# Run migration to add new columns to existing table
# This runs after table creation to add new columns
def run_migration():
    """Run migration in a separate function to avoid circular imports"""
    try:
        import sys
        import os
        # Add parent directory to path to import migrate_error_logs
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if parent_dir not in sys.path:
            sys.path.insert(0, parent_dir)
        from migrate_error_logs import migrate_error_logs_table
        migrate_error_logs_table()
    except Exception as e:
        # Migration errors are logged but don't stop the app
        import logging
        logging.getLogger(__name__).warning(f"Error running migration (non-critical): {e}")

# Run migration after a short delay to ensure all imports are complete
import threading
def delayed_migration():
    import time
    time.sleep(1)  # Wait 1 second for all imports to complete
    run_migration()

threading.Thread(target=delayed_migration, daemon=True).start()