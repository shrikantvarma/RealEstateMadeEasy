# ── Stage 1: Build frontend ──────────────────────────────────────────
FROM node:22-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python backend + serve frontend ────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Copy built frontend into static/
COPY --from=frontend-build /app/frontend/dist ./static

# Railway sets PORT dynamically
ENV PORT=8000

# Run migrations then start server
CMD sh -c "cd /app && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"
