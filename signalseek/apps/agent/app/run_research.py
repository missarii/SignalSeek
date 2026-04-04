from __future__ import annotations
import time
from .schemas import RunRequest, RunResult
from .utils import canonicalize_url, normalize_query, dedupe_queries, content_hash
from .retrieval import retrieve_text, chunk_text
from .providers_search import build_search_registry
from .config import settings
from .workflow import analyze_question, extract_claims_from_passages
from .workflow import detect_contradictions, extract_entities
from .runner import synthesize_report

async def run_research(req: RunRequest) -> RunResult:
    from .schemas import PassageOut
    t0 = time.time()
    events: list[dict] = []
    def emit(type: str, payload: dict):
        import uuid, datetime
        events.append({"id": str(uuid.uuid4()), "investigation_id": req.investigation_id,
                       "type": type, "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                       "payload": payload})
    plan = req.plan or await analyze_question(req.question, req.description, req.max_rounds, req.max_queries)
    emit("plan.created", {"objective": plan.objective, "queries": plan.search_queries})
    registry = build_search_registry(settings.search_provider, settings.tavily_api_key, settings.brave_search_api_key)
    provider = registry.get("mock" if req.demo else settings.search_provider, registry["mock"])
    if not provider.is_configured():
        raise RuntimeError(provider.status_message())
    seen: set[str] = set()
    sources: list[dict] = []
    passages: list[PassageOut] = []
    issued: list[str] = []
    rounds = 0
    pending = list(plan.search_queries or [req.question])[:req.max_queries]
    while rounds < req.max_rounds and pending and len(sources) < req.max_sources:
        if time.time() - t0 > settings.max_investigation_duration_seconds:
            emit("budget.warning", {"reason": "wall-clock budget exhausted"})
            break
        rounds += 1
        batch = pending[:5]
        pending = pending[5:]
        for q in batch:
            nq = normalize_query(q)
            if nq in issued:
                continue
            issued.append(nq)
            if len(issued) > req.max_queries:
                emit("budget.warning", {"reason": "query budget exhausted"})
                break
            emit("search.started", {"query": q, "round": rounds, "provider": provider.name})
            try:
                results = await provider.search(q, max_results=5)
            except Exception as e:
                emit("search.completed", {"query": q, "error": str(e)[:300]})
                continue
            emit("search.completed", {"query": q, "count": len(results)})
            for r in results:
                cu = canonicalize_url(r.url)
                if cu in seen or len(sources) >= req.max_sources:
                    continue
                seen.add(cu)
                emit("source.discovered", {"url": cu, "title": r.title})
                try:
                    title, text, method = await retrieve_text(r.url, q)
                except Exception as e:
                    emit("source.extraction_failed", {"url": cu, "error": str(e)[:300]})
                    continue
                sources.append({"url": cu, "title": title or r.title,
                                "snippet": (r.snippet or text[:500]),
                                "provider": r.provider, "content": text,
                                "content_hash": content_hash(text),
                                "published_at": r.published_at, "method": method})
                emit("source.retrieved", {"url": cu, "chars": len(text), "method": method})
