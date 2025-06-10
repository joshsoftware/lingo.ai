#!/usr/bin/env python3

import asyncio
import asyncpg
import aiohttp
import logging
from logging.handlers import RotatingFileHandler
import os

# --- Configuration ---
PG_USER = "postgres"
PG_PASS = "postgres"
PG_HOST = "localhost"
PG_PORT = "5432"
DB_NAME = "lingo_ai"
API_URL = "http://localhost:8001/meetings/"
SQL_QUERY = 'SELECT "accessToken", "refreshToken", "botName" FROM bot;'
PG_CONN_STRING = f"postgresql://{PG_USER}:{PG_PASS}@{PG_HOST}:{PG_PORT}/{DB_NAME}"

os.makedirs('logs', exist_ok=True)
logger = logging.getLogger('my_app_logger')
logger.setLevel(logging.INFO)  # Or DEBUG, WARNING, ERROR
log_file = 'logs/app.log'
handler = RotatingFileHandler(
    log_file,
    maxBytes=5 * 1024 * 1024,  # 5 MB
    backupCount=3              # Keep last 3 log files
)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Fetch access tokens asynchronously
async def fetch_data():
    try:
        conn = await asyncpg.connect(PG_CONN_STRING)
        rows = await conn.fetch(SQL_QUERY)
        await conn.close()
        return [
            {
                "access_token": row["accessToken"],
                "refresh_token": row["refreshToken"],
                "bot_name": row["botName"],
            }
            for row in rows
        ]
    except Exception as e:
        logger.error(f"Database error: {e}")
        return []


# Make one request
async def make_request(session, data):
    headers = {
        "Authorization": f"Bearer {data['access_token']}",
        "Content-Type": "application/json",
    }
    body = {"refresh_token": data["refresh_token"], "bot_name": data["bot_name"]}
    try:
        async with session.get(
            API_URL, headers=headers, json=body, timeout=10
        ) as response:
            status = response.status
            #  text = await response.text()
            logger.info(f"Bot Name: {data['bot_name']} -> Status: {status}")
    except Exception as e:
        logger.error(f"Bot Name: {data['bot_name']}: failed: {e}")


# Main async workflow
async def main():
    tokens = await fetch_data()
    async with aiohttp.ClientSession() as session:
        tasks = [make_request(session, token) for token in tokens]
        await asyncio.gather(*tasks)


# Entry point
if __name__ == "__main__":
    asyncio.run(main())
