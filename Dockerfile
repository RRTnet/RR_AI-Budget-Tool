# ─────────────────────────────────────────────────────────────────
# WealthTracker — Backend Dockerfile
# Multi-stage build:
#   Stage 1 (builder) → install dependencies into a clean venv
#   Stage 2 (runtime) → copy only what's needed, minimal image
#
# Why multi-stage?
#   The builder stage has compilers & dev tools (big).
#   The runtime stage strips all that out → smaller, safer image.
# ─────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ─────────────────────────────────────────────
FROM python:3.12-slim AS builder

# System deps needed to compile some Python packages (psycopg2, bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy requirements first — Docker caches this layer.
# If requirements.txt doesn't change, pip install is skipped on rebuild.
COPY requirements.txt .

# Install into an isolated venv inside the builder
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt


# ── Stage 2: Runtime ─────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Only the runtime lib we need (not the compiler)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user — running as root inside Docker is a security risk
RUN groupadd -r wealthapp && useradd -r -g wealthapp wealthapp

WORKDIR /app

# Copy the venv from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Copy application source code
COPY app/ ./app/

# Make the venv's python the default
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Switch to non-root user
USER wealthapp

# Expose the API port
EXPOSE 8000

# Health check — Docker will restart the container if this fails
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the server
# --workers 4 → 4 parallel workers (tune to your DGX Spark CPU count)
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--log-level", "info"]
