from app.utils import canonicalize_url, normalize_query, dedupe_queries, classify_contradiction
from app.security import validate_outbound_url
from app.retrieval import chunk_text
from app.workflow import analyze_question, extract_claims_from_passages, detect_contradictions
from app.schemas import PassageOut
import pytest

def test_canonicalize_strips_tracking():
    assert canonicalize_url("https://WWW.Example.com/path/?utm_source=x&b=2&a=1") == "https://example.com/path?a=1&b=2"
