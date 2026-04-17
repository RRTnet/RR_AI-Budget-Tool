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
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_tables, run_migrations
from app.routers.auth       import router as auth_router
from app.routers.income     import router as income_router
from app.routers.expenses   import router as expenses_router
from app.routers.goals      import goals_router, summary_router
from app.routers.ai_advisor import router as advisor_router
from app.routers.budgets    import router as budgets_router
from app.services.scheduler import start_scheduler, stop_scheduler


# ── Startup / Shutdown ────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs once on startup, then again (after yield) on shutdown."""
    print(f"\n🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    print(f"📦 Database: {settings.DATABASE_URL.split('@')[-1]}")
    print(f"🤖 AI Model: {settings.OLLAMA_MODEL} @ {settings.OLLAMA_BASE_URL}")

    create_tables()
    print("✅ Database tables ready")

    run_migrations()
    print("✅ Migrations applied\n")

    start_scheduler()
    print("⏰ Daily reminder scheduler running\n")

    yield

    stop_scheduler()
    print("\n🛑 Shutting down Rolling Revenue...")


# ── App instance ──────────────────────────────────────────────────
app = FastAPI(
    title       = settings.APP_NAME,
    version     = settings.APP_VERSION,
    description = """
## 💰 Rolling Revenue API

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
    lifespan  = lifespan,
    docs_url  = "/docs",
    redoc_url = "/redoc",
)


# ── CORS ──────────────────────────────────────────────────────────
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
app.include_router(budgets_router)


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
    """Health check endpoint — used by Docker and monitoring tools."""
    return {"status": "healthy", "version": settings.APP_VERSION}
