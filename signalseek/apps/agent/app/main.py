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

@app.get("/providers/health")
async def providers_health(authorization: str | None = Header(default=None)):
    check_auth(authorization)
    reg = build_search_registry(settings.search_provider, settings.tavily_api_key, settings.brave_search_api_key)
    llm = build_llm(settings.llm_provider, settings.llm_api_key, settings.llm_base_url, settings.llm_model)
    return {"search": {k: {"configured": v.is_configured(), "message": v.status_message()} for k, v in reg.items() if k != "default"},
            "default_search": settings.search_provider,
            "llm": {"provider": llm.name, "configured": llm.is_configured(), "model": settings.llm_model}}

@app.post("/plan")
async def plan(req: PlanRequest, authorization: str | None = Header(default=None)):
    check_auth(authorization)
    try:
        return (await analyze_question(req.question, req.description, req.max_rounds, req.max_queries)).model_dump()
    except ValueError as e:
        raise HTTPException(400, str(e))
