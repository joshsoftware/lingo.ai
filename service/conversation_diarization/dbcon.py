import os
from dotenv import load_dotenv
from psycopg2 import pool


def initDbConnection():
    # Load .env file
    load_dotenv()

    db_connection_string = os.getenv('DATABASE_URL')

    connection_pool = pool.SimpleConnectionPool(
        1,  # Minimum number of connections in the pool
        10,  # Maximum number of connections in the pool
        db_connection_string
    )
    conn = connection_pool.getconn()
    dbcur = conn.cursor()
    return dbcur
