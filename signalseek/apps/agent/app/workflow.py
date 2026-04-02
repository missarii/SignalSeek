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
    for _, s, p in scored[:12]:
        claims.append(ClaimOut(text=s, status="SUPPORTED", evidence=[p]))
    return claims

def detect_contradictions(claims: list[ClaimOut]) -> list[dict]:
    out = []
    nums = []
    for i, c in enumerate(claims):
        for m in re.finditer(r"(\d{1,3})\s*%", c.text):
            nums.append((i, int(m.group(1)), c.text))
    for a in range(len(nums)):
        for b in range(a + 1, len(nums)):
            if nums[a][1] != nums[b][1]:
                kind = classify_contradiction(nums[a][2], nums[b][2])
                out.append({"claim_a": nums[a][2], "claim_b": nums[b][2], "kind": kind,
                            "explanation": f"Different figures ({nums[a][1]}% vs {nums[b][1]}%): {kind}. Scope/date must be checked; neither auto-preferred."})
    return out[:5]

def extract_entities(question: str, passages: list[PassageOut]) -> tuple[list[dict], list[dict]]:
    ents: dict[str, dict] = {}
    def add(name: str, etype: str):
        key = name.strip().lower()
        if len(key) < 3 or key in ents:
            return
        ents[key] = {"name": name.strip(), "normalized": key, "type": etype}
    for w in re.findall(r"\b[A-Z][A-Za-z0-9&\-]{2,}(?:\s+[A-Z][A-Za-z0-9&\-]{2,}){0,2}\b", question):
        add(w, "Concept")
    for p in passages:
        for w in re.findall(r"\b[A-Z][A-Za-z0-9&\-]{2,}(?:\s+[A-Z][A-Za-z0-9&\-]{2,}){0,1}\b", p.text):
            add(w, "Concept")
    elist = list(ents.values())[:15]
    rels = []
    for i in range(min(len(elist) - 1, 6)):
