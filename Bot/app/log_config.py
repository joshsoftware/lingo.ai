import logging
from logging.handlers import RotatingFileHandler

class LoggerManager:
    @staticmethod
    def get_logger(name):
        """
        Creates and returns a logger instance with log rotation.
        
        :param name: Name of the logger.
        :return: Configured logger instance.
        """
        logger = logging.getLogger(name)
        if not logger.hasHandlers():
            logger.setLevel(logging.DEBUG)
            formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

            # Rotating File Handler
            # file_handler = RotatingFileHandler(
            #     settings.LOG_DIRECTORY,
            #     maxBytes=10 * 1024 * 1024,  # 5 MB
            #     backupCount=5              # Keep last 5 log files
            # )
            # file_handler.setFormatter(formatter)
            # logger.addHandler(file_handler)

            # Stream Handler (for console output)
            stream_handler = logging.StreamHandler()
            stream_handler.setFormatter(formatter)
            logger.addHandler(stream_handler)

        return logger

# Usage in the current file
logger = LoggerManager.get_logger(__name__)