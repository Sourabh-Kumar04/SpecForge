# ==============================================================================
# SpecForge Multi-Stage Dockerfile
# Stage 1: Build React 19 Frontend
# Stage 2: Python 3.12 Backend serving API + static frontend dist
# ==============================================================================

# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime Backend
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source code and config
COPY backend/ ./backend/
COPY pytest.ini ./
COPY LICENSE ./

# Copy built frontend assets from stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Default environment configuration
ENV PYTHONUNBUFFERED=1 \
    BACKEND_HOST=0.0.0.0 \
    BACKEND_PORT=8000 \
    STORAGE_DIR=/app/data

EXPOSE 8000

# Healthcheck to verify service availability during judging period
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
