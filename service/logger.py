import logging
import sys
from datetime import datetime

# Create a custom logger with detailed formatting
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Console handler with detailed format
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.DEBUG)

# Detailed format: timestamp, level, logger name, and message
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
console_handler.setFormatter(formatter)

# Add handler to logger
if not logger.handlers:
    logger.addHandler(console_handler)

# Also configure root logger for other modules
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
if not root_logger.handlers:
    root_logger.addHandler(console_handler)