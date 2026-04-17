"""
app/routers/ai_advisor.py
──────────────────────────
The AI Financial Advisor — powered by your local qwen3:30b on DGX Spark.

Endpoints:
  POST /api/advisor         →  Blocking response (waits for full reply)
  POST /api/advisor/stream  →  Server-Sent Events (tokens stream in real-time)

How it works:
1. Fetch the user's current month summary from the DB
2. Build a rich system prompt with their actual financial data
3. Send to Ollama (qwen3:30b running locally on DGX Spark)
4. Stream or return intelligent, personalised financial advice
"""
import json
import httpx
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
    income_lines  = "\n".join(
        f"  • {i.category}: {currency} {i.total:,.2f} ({i.pct:.1f}%)"
        for i in summary.income_by_category
    ) or "  • No income recorded this month"

    expense_lines = "\n".join(
        f"  • {e.category}: {currency} {e.total:,.2f} ({e.pct:.1f}%)"
        for e in summary.expense_by_category
    ) or "  • No expenses recorded this month"

    return f"""You are a world-class personal financial advisor helping {user_name} achieve financial independence and build lasting wealth.

CURRENT FINANCIAL SNAPSHOT ({summary.month}/{summary.year}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 Total Income:    {currency} {summary.total_income:,.2f}
💸 Total Expenses:  {currency} {summary.total_expenses:,.2f}
💰 Net Savings:     {currency} {summary.net_savings:,.2f}
📊 Savings Rate:    {summary.savings_rate:.1f}%

INCOME SOURCES:
{income_lines}

EXPENSE BREAKDOWN:
{expense_lines}

TOP EXPENSE: {summary.top_expense or "N/A"}

GUIDELINES FOR YOUR ADVICE:
- Be specific and actionable — give concrete numbers and steps
- Be encouraging but honest — point out both strengths and areas to improve
- Reference the actual data above in your response
- Focus on wealth-building: investments, compound interest, emergency funds
- Keep responses clear and structured (use bullet points where helpful)
- Ideal savings rate target: 20-30% of income
- The user's goal is to build long-term wealth and financial independence
- Do NOT include internal reasoning, chain-of-thought, or <think> blocks
"""


def _build_ollama_body(system_prompt: str, user_question: str, stream: bool) -> dict:
    return {
        "model":   settings.OLLAMA_MODEL,
        "stream":  stream,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_question},
        ],
        "options": {
            "temperature": 0.7,
            "num_predict": 1024,
        },
    }


# ── Blocking endpoint (original) ──────────────────────────────────────────────

@router.post("", response_model=AIAdviceResponse)
async def get_advice(
    payload: AIAdviceRequest,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user),
):
    """
    Get personalised AI financial advice (waits for the full response).
    Use POST /api/advisor/stream for a better UX with real-time token streaming.
    """
    today   = date.today()
    summary = get_monthly_summary(db, user.id, today.month, today.year)

    system_prompt = build_system_prompt(summary, user.name, user.currency)
    user_question = (
        payload.question
        or "Give me a comprehensive analysis of my finances and top 5 actions to build wealth faster."
    )

    ollama_url   = f"{settings.OLLAMA_BASE_URL}/api/chat"
    request_body = _build_ollama_body(system_prompt, user_question, stream=False)

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(ollama_url, json=request_body)
            response.raise_for_status()
            data = response.json()

        advice = data["message"]["content"]
        tokens = data.get("eval_count")

        return AIAdviceResponse(
            advice=advice,
            model_used=settings.OLLAMA_MODEL,
            tokens=tokens,
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


# ── Streaming endpoint (SSE) ───────────────────────────────────────────────────

@router.post("/stream")
async def get_advice_stream(
    payload: AIAdviceRequest,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user),
):
    """
    Stream AI financial advice token-by-token via Server-Sent Events.

    The client receives a stream of newline-delimited events:
      data: {"token": "Hello"}
      data: {"token": " there"}
      data: {"done": true, "tokens": 312, "model": "qwen3:30b"}

    On error:
      data: {"error": "message"}

    Use fetch() + ReadableStream on the frontend — tokens appear as they
    are generated instead of waiting 30–60 s for the full response.
    """
    today   = date.today()
    summary = get_monthly_summary(db, user.id, today.month, today.year)

    system_prompt = build_system_prompt(summary, user.name, user.currency)
    user_question = (
        payload.question
        or "Give me a comprehensive analysis of my finances and top 5 actions to build wealth faster."
    )

    ollama_url   = f"{settings.OLLAMA_BASE_URL}/api/chat"
    request_body = _build_ollama_body(system_prompt, user_question, stream=True)

    async def token_generator():
        # Strip <think>…</think> blocks emitted by qwen3's chain-of-thought.
        # Tokens arrive one or a few chars at a time, so we buffer and scan.
        in_think  = False
        think_buf = ""

        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                async with client.stream("POST", ollama_url, json=request_body) as resp:
                    resp.raise_for_status()

                    async for line in resp.aiter_lines():
                        if not line.strip():
                            continue

                        try:
                            chunk = json.loads(line)
                        except json.JSONDecodeError:
                            continue

                        raw_token = chunk.get("message", {}).get("content", "")

                        if raw_token:
                            think_buf += raw_token
                            output = ""

                            # Walk through the buffer, skipping think regions
                            while think_buf:
                                if in_think:
                                    end = think_buf.find("</think>")
                                    if end != -1:
                                        in_think  = False
                                        think_buf = think_buf[end + len("</think>"):]
                                    else:
                                        think_buf = ""   # discard, still in think
                                else:
                                    start = think_buf.find("<think>")
                                    if start == -1:
                                        output   += think_buf
                                        think_buf = ""
                                    else:
                                        output   += think_buf[:start]
                                        in_think  = True
                                        think_buf = think_buf[start + len("<think>"):]

                            if output:
                                yield f"data: {json.dumps({'token': output})}\n\n"

                        if chunk.get("done"):
                            yield f"data: {json.dumps({'done': True, 'tokens': chunk.get('eval_count'), 'model': settings.OLLAMA_MODEL})}\n\n"

        except httpx.ConnectError:
            yield f"data: {json.dumps({'error': f'Cannot connect to Ollama at {settings.OLLAMA_BASE_URL}. Run: ollama serve'})}\n\n"
        except httpx.TimeoutException:
            yield f"data: {json.dumps({'error': 'Ollama timed out. The model may still be loading — try again in a moment.'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'AI advisor error: {str(e)}'})}\n\n"

    return StreamingResponse(
        token_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",    # tell nginx NOT to buffer SSE
            "Connection":        "keep-alive",
        },
    )
