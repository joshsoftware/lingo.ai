# Build stage
FROM python:3.9-slim AS builder

WORKDIR /lingo/service

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    gcc \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.9-slim

WORKDIR /lingo/service

# Install runtime dependencies only
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Ensure New Relic CLI is available (newrelic-admin); builder cache may omit it
RUN pip install --no-cache-dir newrelic

# Copy application code (includes newrelic.ini when present)
COPY . .

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /lingo/service
USER appuser

EXPOSE 8000

# Run uvicorn under New Relic agent (config: /lingo/service/newrelic.ini)
ENV NEW_RELIC_CONFIG_FILE=/lingo/service/newrelic.ini
CMD ["newrelic-admin", "run-program", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]