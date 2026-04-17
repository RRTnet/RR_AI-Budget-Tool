-- ─────────────────────────────────────────────────────────────────
-- postgres/init.sql
-- Runs once when the PostgreSQL container starts for the first time.
--
-- Note: Docker already creates the database and user from environment
-- variables (POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD).
-- This file handles any additional setup needed at init time.
-- ─────────────────────────────────────────────────────────────────

-- Enable UUID extension (useful for future migrations)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The application tables are created by SQLAlchemy on startup
-- (app/database.py: create_tables → Base.metadata.create_all)
-- so no CREATE TABLE statements are needed here.
