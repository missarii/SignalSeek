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
