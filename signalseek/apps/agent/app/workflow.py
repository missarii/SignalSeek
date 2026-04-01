from __future__ import annotations
import re, time
from .schemas import ResearchPlan, RunRequest, RunResult, ClaimOut, PassageOut
from .utils import canonicalize_url, normalize_query, dedupe_queries, content_hash, classify_contradiction
from .retrieval import retrieve_text, chunk_text
from .providers_search import build_search_registry
from .providers_llm import build_llm
from .config import settings

async def analyze_question(question: str, description: str, max_rounds: int, max_queries: int) -> ResearchPlan:
    q = question.strip()
    if len(q) < 8:
        raise ValueError("Research question too short")
    kws = re.findall(r"[A-Za-z][A-Za-z0-9\-]{2,}", q)
    topic = " ".join(kws[:6]) or q[:60]
    subquestions = [
        f"What is the current state of {topic}?",
        f"Which sources report key figures about {topic}, and what are their scopes/dates?",
        f"What disagreements or uncertainties exist about {topic}?",
    ]
    queries = dedupe_queries([q, f"{topic} overview 2024", f"{topic} adoption figures scope",
                              f"{topic} timeline events", f"{topic} criticism limitations"])[:max_queries]
    return ResearchPlan(objective=f"Answer: {q}",
                        subquestions=subquestions[:5],
                        search_queries=queries,
                        source_categories=["web", "news", "dataset", "rss"])

def extract_claims_from_passages(passages: list[PassageOut]) -> list[ClaimOut]:
    claims: list[ClaimOut] = []
    scored: list[tuple[int, str, PassageOut]] = []
    for p in passages:
        for sent in re.split(r"(?<=[.!?])\s+", p.text):
            s = sent.strip()
            if len(s) < 40 or len(s) > 400:
                continue
            if re.search(r"\b(is|are|was|were|reached|began|expanded|reported|shows?|found)\b", s, re.I):
                score = 2 if re.search(r"\d+\s*%", s) else (1 if re.search(r"\b20\d\d\b", s) else 0)
                scored.append((score, s, p))
    scored.sort(key=lambda t: -t[0])
