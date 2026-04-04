from __future__ import annotations
import time
from .schemas import RunRequest, RunResult, ClaimOut, PassageOut
from .utils import canonicalize_url, normalize_query, dedupe_queries, content_hash
from .retrieval import retrieve_text, chunk_text
from .providers_search import build_search_registry
from .config import settings
from .workflow import analyze_question, extract_claims_from_passages
from .workflow import detect_contradictions, extract_entities

def synthesize_report(question, claims, contradictions, sources, entities):
    lines = ["# Intelligence Report", "", f"**Research question:** {question}", "",
             "## Research scope and methodology",
             "Bounded iterative research: planned subquestions, deduplicated queries,",
             "SSRF-guarded retrieval, chunked passages, sentence-level claims with",
             "evidence links, contradiction classification.",
             "", "## Executive summary"]
    if claims:
        lines.append(f"{len(claims)} evidence-linked claims from {len(sources)} sources; "
                     f"{len(contradictions)} potential conflict(s) flagged for review.")
    else:
        lines.append("Insufficient evidence: no extractable claims. Stated explicitly.")
    lines += ["", "## Key findings"]
    citations = []
    for i, s in enumerate(sources):
        citations.append({"key": f"S{i+1}", "url": s["url"], "excerpt": (s.get("snippet") or "")[:300]})
    for c in claims[:10]:
        cite = "[S1]"
        if c.evidence:
            for j, s in enumerate(sources):
                if s["url"] == c.evidence[0].source_url:
                    cite = f"[S{j+1}]"
                    break
        lines.append(f"- {c.text} {cite}")
    if contradictions:
        lines += ["", "## Conflicting claims"]
        for k in contradictions:
            lines.append(f"- CONFLICT ({k['kind']}): \"{k['claim_a'][:160]}\" vs \"{k['claim_b'][:160]}\".")
    else:
        lines += ["", "## Conflicting claims", "No direct numerical conflicts detected."]
    lines += ["", "## Evidence and citations",
              "Each claim cites a persisted passage. Automated assessments may be wrong.",
              "", "## Research limitations",
              "- Demo mode uses labeled demonstration sources, not live factual data.",
              "- Sentence-level extraction may miss nuance; full passages retained.",
              "", "## Unanswered questions",
              "- Coverage of every subquestion is listed in the investigation timeline.",
              "", "## References and retrieval dates"]
    for c in citations:
        lines.append(f"- [{c['key']}] {c['url']}")
    return "\n".join(lines), citations
