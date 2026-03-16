import os
import time
from contextlib import contextmanager
from typing import Optional

from prometheus_client import (
    Counter,
    Histogram,
    CollectorRegistry,
    CONTENT_TYPE_LATEST,
    generate_latest,
)
from prometheus_client import multiprocess


def _get_or_create_multiproc_registry() -> CollectorRegistry:
    """
    Return a CollectorRegistry configured for multi-process Gunicorn usage
    when PROMETHEUS_MULTIPROC_DIR is set, otherwise the default registry.
    """
    if os.environ.get("PROMETHEUS_MULTIPROC_DIR"):
        registry = CollectorRegistry()
        multiprocess.MultiProcessCollector(registry)
        return registry
    # Fall back to the default global registry
    return CollectorRegistry()


# HTTP metrics
http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status_code"],
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "path"],
)


# DB metrics
db_query_duration_seconds = Histogram(
    "db_query_duration_seconds",
    "Database query latency in seconds",
    ["operation", "model"],
)

db_errors_total = Counter(
    "db_errors_total",
    "Total database errors",
    ["operation", "model"],
)


@contextmanager
def track_db(operation: str, model: str):
    """
    Context manager to measure DB call latency and errors.
    """
    start = time.perf_counter()
    try:
        yield
    except Exception:
        db_errors_total.labels(operation=operation, model=model).inc()
        raise
    else:
        duration = time.perf_counter() - start
        db_query_duration_seconds.labels(operation=operation, model=model).observe(
            duration
        )


def generate_metrics() -> tuple[bytes, str]:
    """
    Generate latest Prometheus metrics and return (body, content_type).
    Uses a multiprocess-aware registry when applicable.
    """
    registry = _get_or_create_multiproc_registry()
    output = generate_latest(registry)
    return output, CONTENT_TYPE_LATEST

