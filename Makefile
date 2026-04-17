# ─────────────────────────────────────────────────────────────────
# Makefile — WealthTracker Control Panel
#
# Run any of these from the project root:
#   make up          → Start the full dev stack
#   make down        → Stop everything
#   make logs        → Stream all logs
#   make restart     → Restart a single service: make restart s=backend
#   make test        → Run test suite
#   make prod-up     → Start production stack
# ─────────────────────────────────────────────────────────────────

.PHONY: up down build logs ps restart \
        shell-api shell-db test migrate \
        prod-up prod-down prod-build \
        backup restore \
        clean nuke help

# Default service for restart/shell commands
s ?= backend

# ── Development ───────────────────────────────────────────────────

## Start the full development stack (detached)
up:
	@echo "🚀 Starting WealthTracker stack..."
	docker compose up -d --build
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  🌐 App:      http://localhost:9000"
	@echo "  📖 API Docs: http://localhost:9000/docs"
	@echo "  ❤️  Health:  http://localhost:9000/health"
	@echo "  🗄️  DB GUI:  http://localhost:5050  (make tools)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

## Stop all containers (keeps volumes/data)
down:
	@echo "🛑 Stopping WealthTracker..."
	docker compose down

## Build/rebuild images
build:
	docker compose build --no-cache

## Stream logs (all services). Filter: make logs s=backend
logs:
	docker compose logs -f $(s)

## Show running containers and their status
ps:
	docker compose ps

## Restart a specific service (default: backend)
## Usage: make restart s=backend
restart:
	@echo "🔄 Restarting $(s)..."
	docker compose restart $(s)

## Start optional tools (pgAdmin)
tools:
	docker compose --profile tools up -d pgadmin
	@echo "🗄️  pgAdmin running at http://localhost:5050"
	@echo "   Login: admin@wealth.local / admin123"

# ── Database ──────────────────────────────────────────────────────

## Open a shell in the backend container
shell-api:
	docker compose exec backend bash

## Open a PostgreSQL shell
shell-db:
	docker compose exec postgres psql -U wealthuser -d wealthtracker

## Show database tables
db-tables:
	docker compose exec postgres psql -U wealthuser -d wealthtracker \
		-c "\dt" -c "SELECT COUNT(*) as users FROM users;" 2>/dev/null || \
		echo "Database not ready yet"

# ── Testing ───────────────────────────────────────────────────────

## Run the test suite inside the backend container
test:
	@echo "🧪 Running tests..."
	docker compose exec backend python -m pytest tests/ -v --tb=short

## Run tests locally (needs pip install -r requirements.txt)
test-local:
	pytest tests/ -v --tb=short

# ── Production ────────────────────────────────────────────────────

## Start the production stack
prod-up:
	@echo "🏭 Starting PRODUCTION stack..."
	docker compose \
		-f docker-compose.yml \
		-f docker-compose.prod.yml \
		up -d --build
	@echo "✅ Production stack running at http://localhost:9000"

## Stop the production stack
prod-down:
	docker compose \
		-f docker-compose.yml \
		-f docker-compose.prod.yml \
		down

## Build only the production frontend image (no other services)
prod-build:
	@echo "🏗️  Building production frontend image..."
	docker build -f Dockerfile.frontend -t wealthtracker-frontend:latest .
	@echo "✅ Image ready: wealthtracker-frontend:latest"

# ── Backup / Restore ──────────────────────────────────────────────

## Backup the database to ./backups/ (keeps 7 days by default)
backup:
	@bash scripts/backup.sh

## Restore a database backup. Usage: make restore FILE=backups/wealthtracker_....sql.gz
restore:
	@bash scripts/restore.sh $(FILE)

# ── Cleanup ───────────────────────────────────────────────────────

## Remove containers and images (keeps data volumes)
clean:
	@echo "🧹 Cleaning containers and images..."
	docker compose down --rmi local
	@echo "✅ Clean. Your data is safe (volumes kept)."

## ⚠️  DANGER: Remove EVERYTHING including database data
nuke:
	@echo "⚠️  WARNING: This will DELETE ALL DATA including the database!"
	@read -p "Type 'yes' to confirm: " confirm && [ "$$confirm" = "yes" ]
	docker compose down -v --rmi all
	@echo "💥 Everything removed."

# ── Help ─────────────────────────────────────────────────────────

## Show this help message
help:
	@echo ""
	@echo "💎 WealthTracker — Available Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@grep -E '^##' $(MAKEFILE_LIST) | sed 's/## /  /'
	@echo ""
