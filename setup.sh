#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# scripts/setup.sh
# Run this ONCE on your DGX Spark to set everything up from scratch.
# ─────────────────────────────────────────────────────────────────

set -e   # stop on any error

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     💎 WealthTracker — DGX Spark Setup          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. Check prerequisites ────────────────────────────────────────
echo "🔍 Checking prerequisites..."

command -v docker >/dev/null 2>&1 || {
    echo "❌ Docker not found. Install from: https://docs.docker.com/engine/install/"
    exit 1
}
echo "  ✅ Docker: $(docker --version)"

command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || {
    echo "❌ Docker Compose not found."
    exit 1
}
echo "  ✅ Docker Compose: $(docker compose version --short)"

command -v ollama >/dev/null 2>&1 && echo "  ✅ Ollama: $(ollama --version)" || \
    echo "  ⚠️  Ollama not found (install from https://ollama.com for AI advisor)"

echo ""

# ── 2. Environment setup ──────────────────────────────────────────
echo "📝 Setting up environment..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "  ✅ Created .env from template"
    echo ""
    echo "  ⚠️  IMPORTANT: Edit .env and set your SECRET_KEY:"
    echo "     python3 -c \"import secrets; print(secrets.token_hex(64))\""
    echo ""
else
    echo "  ✅ .env already exists"
fi

# ── 3. Generate secret key if placeholder is still there ──────────
if grep -q "change-me-in-production" .env; then
    NEW_KEY=$(python3 -c "import secrets; print(secrets.token_hex(64))")
    # Replace placeholder key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|change-me-in-production|$NEW_KEY|g" .env
    else
        sed -i "s|change-me-in-production|$NEW_KEY|g" .env
    fi
    echo "  🔑 Generated new SECRET_KEY automatically"
fi

# ── 4. Pull Ollama model ──────────────────────────────────────────
if command -v ollama &>/dev/null; then
    echo ""
    echo "🤖 Checking Ollama model..."
    if ollama list 2>/dev/null | grep -q "qwen3:30b"; then
        echo "  ✅ qwen3:30b already downloaded"
    else
        echo "  📥 Pulling qwen3:30b (this may take a while on first run)..."
        ollama pull qwen3:30b
        echo "  ✅ Model ready"
    fi
fi

# ── 5. Build and start ────────────────────────────────────────────
echo ""
echo "🐳 Building Docker images..."
docker compose build

echo ""
echo "🚀 Starting WealthTracker..."
docker compose up -d

# Wait for services
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check health
BACKEND_STATUS=$(docker compose ps backend --format "{{.Health}}" 2>/dev/null || echo "unknown")

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║           ✅ WealthTracker is Ready!             ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  🌐 App:       http://localhost                  ║"
echo "║  📖 API Docs:  http://localhost/docs             ║"
echo "║  ❤️  Health:   http://localhost/health           ║"
echo "║  🗄️  DB Port:  localhost:5432                    ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Run 'make logs' to stream live logs             ║"
echo "║  Run 'make help' for all commands                ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
