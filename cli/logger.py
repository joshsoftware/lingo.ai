from os import path
import logging
import logging.config

#log_file_path = path.join(path.dirname(path.abspath(__file__)), 'log.config')
#logging.config.fileConfig(log_file_path)

# create logger
logger = logging.getLogger('simpleExample')

# 'application' code
logger.debug('debug message')
logger.info('info message')
logger.warning('warn message')
logger.error('error message')
logger.critical('critical message')
