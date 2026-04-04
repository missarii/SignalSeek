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
