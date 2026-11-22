# Multi-stage Slim Dockerfile for Cloud-Based IDS Analytics Backend
FROM python:3.11-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final Runtime Stage
FROM python:3.11-slim

WORKDIR /app

# Copy python dependencies
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV DATABASE_MODE=sqlite
ENV PORT=8000

# Copy application and baked-in trained models
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY model_pack/ ./model_pack/

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]

