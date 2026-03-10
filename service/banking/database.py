from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
    Text,
    Boolean,
    Index,
    event,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import os
import sys
import time
from prometheus_client import Counter, Histogram

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config  # Direct import from parent directory

# PostgreSQL connection string
DB_USER = config.db_user
DB_PASSWORD = config.db_password
DB_HOST = config.db_host
DB_PORT = config.db_port
DB_NAME = config.db_name

SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Prometheus metrics for database queries
db_query_count = Counter(
    "lingo_db_queries_total",
    "Total database queries",
    ["operation", "success"],
)

db_query_duration = Histogram(
    "lingo_db_query_duration_seconds",
    "Database query duration in seconds",
    ["operation", "success"],
)


def _get_sql_operation(statement: str) -> str:
    """
    Best-effort extraction of the SQL verb (SELECT/INSERT/UPDATE/DELETE/...).
    Keeps label cardinality low by grouping by operation only.
    """
    if not statement:
        return "UNKNOWN"
    first_token = statement.strip().split()[0].upper()
    if first_token in {"SELECT", "INSERT", "UPDATE", "DELETE"}:
        return first_token
    return first_token or "UNKNOWN"


# Create PostgreSQL engine
# For production (AWS RDS): use sslmode=require
# For development: use sslmode=prefer (tries SSL but falls back if unavailable)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "sslmode": os.getenv("DB_SSL_MODE", "prefer"),
    },
)


@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(
    conn, cursor, statement, parameters, context, executemany
):  # pragma: no cover - instrumentation
    context._query_start_time = time.time()
    context._query_operation = _get_sql_operation(statement)


@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(
    conn, cursor, statement, parameters, context, executemany
):  # pragma: no cover - instrumentation
    start_time = getattr(context, "_query_start_time", None)
    operation = getattr(context, "_query_operation", _get_sql_operation(statement))

    if start_time is None:
        return

    duration = time.time() - start_time
    db_query_count.labels(operation=operation, success="true").inc()
    db_query_duration.labels(operation=operation, success="true").observe(duration)


@event.listens_for(engine, "handle_error")
def handle_error(exception_context):  # pragma: no cover - instrumentation
    statement = getattr(exception_context, "statement", "") or ""
    operation = _get_sql_operation(statement)
    db_query_count.labels(operation=operation, success="false").inc()


# Create a SessionLocal class for database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for declarative models
Base = declarative_base()


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()