from __future__ import annotations
from fastapi import FastAPI, Header, HTTPException
from .config import settings
from .schemas import PlanRequest, RunRequest
from .workflow import analyze_question
from .run_research import run_research

from .providers_search import build_search_registry, RssProvider
from .providers_llm import build_llm

app = FastAPI(title="SignalSeek Agent", version="0.1.0")

def check_auth(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "missing bearer auth")
    if authorization.removeprefix("Bearer ").strip() != settings.agent_internal_auth_secret:
        raise HTTPException(403, "invalid agent secret")

@app.get("/health/live")
async def live():
    return {"status": "ok", "service": "agent"}

@app.get("/health/ready")
async def ready():
    return {"status": "ready", "search_provider": settings.search_provider, "llm_provider": settings.llm_provider}
