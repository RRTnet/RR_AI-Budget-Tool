"""
app/main.py
────────────
The FastAPI application entry point.

This file:
1. Creates the FastAPI app with metadata
2. Configures CORS (so the React frontend can call the API)
3. Registers all routers (auth, income, expenses, goals, AI advisor)
4. Creates DB tables on startup
5. Adds health check and root endpoints
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import create_tables
from app.routers.auth       import router as auth_router
from app.routers.income     import router as income_router
from app.routers.expenses   import router as expenses_router
from app.routers.goals      import goals_router, summary_router
from app.routers.ai_advisor import router as advisor_router


# ── Startup / Shutdown ────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs once on startup, then again (after yield) on shutdown."""
    print(f"\n🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    print(f"📦 Database: {settings.DATABASE_URL.split('@')[-1]}")  # hide credentials
    print(f"🤖 AI Model: {settings.OLLAMA_MODEL} @ {settings.OLLAMA_BASE_URL}")

    # Create tables (use Alembic migrations in production)
    create_tables()
    print("✅ Database tables ready\n")

    yield  # ← app runs here

    print("\n🛑 Shutting down WealthTracker...")


# ── App instance ──────────────────────────────────────────────────
app = FastAPI(
    title       = settings.APP_NAME,
    version     = settings.APP_VERSION,
    description = """
## 💎 WealthTracker API

Personal finance management system with AI-powered advice.

### Features
- 💵 **Income tracking** — multiple streams, categories, recurring entries
- 💸 **Expense tracking** — categorized, filterable
- 📊 **Monthly summaries** — savings rate, category breakdown, trends
- 🎯 **Wealth goals** — track progress toward financial targets
- 🤖 **AI Financial Advisor** — powered by qwen3:30b on DGX Spark

### Authentication
All endpoints (except `/api/auth/register` and `/api/auth/login`) require
a Bearer token in the `Authorization` header:
```
Authorization: Bearer <your_token>
```
    """,
    lifespan    = lifespan,
    docs_url    = "/docs",    # Swagger UI
    redoc_url   = "/redoc",   # ReDoc UI
)


# ── CORS ──────────────────────────────────────────────────────────
# Allows the React frontend (running on a different port) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins     = settings.CORS_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ── Routers ───────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(income_router)
app.include_router(expenses_router)
app.include_router(goals_router)
app.include_router(summary_router)
app.include_router(advisor_router)


# ── Root & Health endpoints ───────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {
        "app":     settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs":    "/docs",
        "status":  "running",
    }


@app.get("/health", tags=["Root"])
def health():
    """
    Health check endpoint — used by Docker and monitoring tools
    to verify the API is alive.
    """
    return {"status": "healthy", "version": settings.APP_VERSION}
