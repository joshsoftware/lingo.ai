FROM python:3.9-slim

WORKDIR /lingo/service

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg gcc build-essential && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]