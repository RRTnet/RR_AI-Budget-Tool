# 💎 WealthTracker — Backend API

Personal Finance OS | FastAPI + PostgreSQL + Ollama (DGX Spark)

---

## 🗂️ Project Structure

```
wealthtracker/
├── app/
│   ├── main.py              ← FastAPI app entry point
│   ├── config.py            ← All settings (reads .env)
│   ├── database.py          ← DB engine & session setup
│   ├── models/
│   │   └── database.py      ← SQLAlchemy ORM models (tables)
│   ├── schemas/
│   │   └── schemas.py       ← Pydantic schemas (validation)
│   ├── services/
│   │   ├── auth.py          ← Password hashing, JWT tokens
│   │   └── summary.py       ← Monthly financial calculations
│   └── routers/
│       ├── auth.py          ← POST /api/auth/register, /login
│       ├── income.py        ← CRUD /api/income
│       ├── expenses.py      ← CRUD /api/expenses
│       ├── goals.py         ← CRUD /api/goals + /api/summary
│       └── ai_advisor.py    ← POST /api/advisor (Ollama)
├── tests/
│   └── test_api.py          ← pytest test suite
├── requirements.txt
├── .env.example             ← Copy to .env and fill in values
└── run.sh                   ← Quick start script
```

---

## 🚀 Quick Start on DGX Spark

### Step 1 — Clone and configure
```bash
cd ~/projects
# Copy this folder here, then:
cp .env.example .env
nano .env   # Fill in your database URL and secret key
```

### Step 2 — Install dependencies
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Step 3 — Start PostgreSQL (via Docker — Step 3 of the guide)
```bash
docker run -d \
  --name wealthtracker-db \
  -e POSTGRES_USER=wealthuser \
  -e POSTGRES_PASSWORD=wealthpass \
  -e POSTGRES_DB=wealthtracker \
  -p 5432:5432 \
  postgres:16
```

### Step 4 — Run the API
```bash
bash run.sh
# OR directly:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 5 — Open the docs
```
http://localhost:8000/docs    ← Swagger UI (test all endpoints)
http://localhost:8000/redoc   ← ReDoc (clean documentation)
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/me` | Your profile |
| GET | `/api/income` | List income (filter: month, year, category) |
| POST | `/api/income` | Add income entry |
| PATCH | `/api/income/{id}` | Update income |
| DELETE | `/api/income/{id}` | Delete income |
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Add expense |
| PATCH | `/api/expenses/{id}` | Update expense |
| DELETE | `/api/expenses/{id}` | Delete expense |
| GET | `/api/goals` | List wealth goals |
| POST | `/api/goals` | Create goal |
| PATCH | `/api/goals/{id}` | Update goal (add savings) |
| GET | `/api/summary?month=3&year=2025` | Monthly summary |
| POST | `/api/advisor` | Ask AI financial advisor |

---

## 🧪 Run Tests
```bash
pip install pytest httpx
pytest tests/ -v
```

---

## 🤖 AI Advisor Setup (DGX Spark)
```bash
# Make sure Ollama is running
ollama serve

# Pull the model (first time)
ollama pull qwen3:30b

# Test it
curl http://localhost:11434/api/tags
```

---

## ✅ Next Steps
- **Step 3:** Docker Compose (PostgreSQL + API + Frontend together)
- **Step 4:** Connect React frontend to this API
- **Step 5:** AI advisor with streaming responses
- **Step 6:** Nginx reverse proxy + production hardening
