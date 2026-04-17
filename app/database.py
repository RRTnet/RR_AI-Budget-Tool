"""
app/database.py
───────────────
SQLAlchemy engine, session factory, Base class, and helpers.

Every router gets a DB session via the `get_db` dependency:

    db: Session = Depends(get_db)

`create_tables()` is called once on startup (main.py lifespan).
For production, replace with Alembic migrations.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# ── Engine & session factory ───────────────────────────────────────
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,   # auto-reconnect on stale connections
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Declarative base ──────────────────────────────────────────────
# All ORM models inherit from this.
Base = declarative_base()


# ── FastAPI dependency ─────────────────────────────────────────────
def get_db():
    """Yield a DB session, always close it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Table creation ─────────────────────────────────────────────────
def create_tables():
    """
    Create all tables defined in ORM models.
    Import models here to ensure they're registered with Base.
    """
    import app.models.database  # noqa: F401 — registers models with Base
    Base.metadata.create_all(bind=engine)


# ── Migrations ─────────────────────────────────────────────────────
def run_migrations():
    """
    Lightweight migration: adds new columns to existing tables without
    dropping data.  Safe to run on every startup — skips columns that
    already exist.
    """
    new_columns = [
        # (table,     column,             sql_definition)
        ("users",    "phone_number",      "VARCHAR"),
        ("users",    "reminder_enabled",  "BOOLEAN DEFAULT FALSE"),
        ("users",    "reminder_time",     "VARCHAR DEFAULT '20:00'"),
        ("users",    "timezone",          "VARCHAR DEFAULT 'UTC'"),
        ("users",    "reminder_channel",  "VARCHAR DEFAULT 'whatsapp'"),
        ("income",   "currency",           "VARCHAR"),
        ("expenses", "currency",           "VARCHAR"),
        ("goals",    "currency",           "VARCHAR"),
        ("income",   "is_recurring",       "BOOLEAN DEFAULT FALSE"),
        ("expenses", "is_recurring",       "BOOLEAN DEFAULT FALSE"),
        ("expenses", "recurrence_period",  "VARCHAR"),
    ]
    with engine.connect() as conn:
        for table, column, definition in new_columns:
            # PostgreSQL: check information_schema before adding
            result = conn.execute(
                __import__("sqlalchemy").text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name = :t AND column_name = :c"
                ),
                {"t": table, "c": column},
            )
            if result.fetchone() is None:
                conn.execute(
                    __import__("sqlalchemy").text(
                        f"ALTER TABLE {table} ADD COLUMN {column} {definition}"
                    )
                )
                print(f"  ✅ Migration: added {table}.{column}")
        conn.commit()
