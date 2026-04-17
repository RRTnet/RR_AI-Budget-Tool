"""
app/routers/ai_advisor.py
──────────────────────────
The AI Financial Advisor — powered by your local gpt-oss:120b on DGX Spark.

POST /api/advisor  →  Ask for personalized financial advice

How it works:
1. Fetch the user's current month summary from the DB
2. Build a rich system prompt with their actual financial data
3. Send to Ollama (gpt-oss:120b running locally on DGX Spark)
4. Stream back intelligent, personalized financial advice
"""
import httpx
import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.database import User
from app.schemas.schemas import AIAdviceRequest, AIAdviceResponse
from app.services.auth import get_current_user
from app.services.summary import get_monthly_summary
from app.config import settings

router = APIRouter(prefix="/api/advisor", tags=["AI Advisor"])


def build_system_prompt(summary, user_name: str, currency: str) -> str:
    """
    Build a detailed system prompt that gives the AI model
    full context about the user's financial situation.
    """
    return f"""You are a world-class personal financial advisor helping {user_name} achieve financial independence and build lasting wealth.

CURRENT FINANCIAL SNAPSHOT ({summary.month}/{summary.year}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 Total Income:    {currency} {summary.total_income:,.2f}
💸 Total Expenses:  {currency} {summary.total_expenses:,.2f}
💰 Net Savings:     {currency} {summary.net_savings:,.2f}
📊 Savings Rate:    {summary.savings_rate:.1f}%

INCOME SOURCES:
{chr(10).join(f"  • {i.category}: {currency} {i.total:,.2f} ({i.pct:.1f}%)" for i in summary.income_by_category)}

EXPENSE BREAKDOWN:
{chr(10).join(f"  • {e.category}: {currency} {e.total:,.2f} ({e.pct:.1f}%)" for e in summary.expense_by_category)}

TOP EXPENSE: {summary.top_expense or "N/A"}

GUIDELINES FOR YOUR ADVICE:
- Be specific and actionable — give concrete numbers and steps
- Be encouraging but honest — point out both strengths and areas to improve
- Reference the actual data above in your response
- Focus on wealth-building: investments, compound interest, emergency funds
- Keep responses clear and structured (use bullet points where helpful)
- Ideal savings rate target: 20-30% of income
- The user's goal is to build long-term wealth and financial independence
"""


@router.post("", response_model=AIAdviceResponse)
async def get_advice(
    payload: AIAdviceRequest,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user),
):
    """
    Get personalized AI financial advice based on your actual data.

    The AI reads your income, expenses, and savings rate,
    then gives tailored recommendations using gpt-oss:120b
    running locally on your DGX Spark via Ollama.

    Request body:
    {
        "question": "How can I increase my savings rate?"
    }
    """
    today   = date.today()
    summary = get_monthly_summary(db, user.id, today.month, today.year)

    system_prompt = build_system_prompt(summary, user.name, user.currency)
    user_question = payload.question or "Give me a comprehensive analysis of my finances and top 5 actions to build wealth faster."

    # Call Ollama on DGX Spark
    ollama_url = f"{settings.OLLAMA_BASE_URL}/api/chat"

    request_body = {
        "model": settings.OLLAMA_MODEL,
        "stream": False,
        "messages": [
            {"role": "system",  "content": system_prompt},
            {"role": "user",    "content": user_question},
        ],
        "options": {
            "temperature": 0.7,
            "num_predict": 1024,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(ollama_url, json=request_body)
            response.raise_for_status()
            data = response.json()

        advice = data["message"]["content"]
        tokens = data.get("eval_count")

        return AIAdviceResponse(
            advice     = advice,
            model_used = settings.OLLAMA_MODEL,
            tokens     = tokens,
        )

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Cannot connect to Ollama at {settings.OLLAMA_BASE_URL}. "
                "Make sure Ollama is running on your DGX Spark: `ollama serve`"
            ),
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Ollama took too long to respond. The model may be loading — try again in a moment.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI advisor error: {str(e)}",
        )
