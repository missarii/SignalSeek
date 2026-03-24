from app.utils import canonicalize_url, normalize_query, dedupe_queries, classify_contradiction
from app.security import validate_outbound_url
from app.retrieval import chunk_text
from app.workflow import analyze_question, extract_claims_from_passages, detect_contradictions
from app.schemas import PassageOut
import pytest

def test_canonicalize_strips_tracking():
    assert canonicalize_url("https://WWW.Example.com/path/?utm_source=x&b=2&a=1") == "https://example.com/path?a=1&b=2"

def test_dedupe_queries():
    assert dedupe_queries(["Hello  World", "hello world", "Other"]) == ["Hello  World", "Other"]

def test_ssrf_blocks_loopback():
    with pytest.raises(ValueError):
        validate_outbound_url("http://127.0.0.1/admin")
    with pytest.raises(ValueError):
        validate_outbound_url("http://169.254.169.254/latest/meta-data")
    assert validate_outbound_url("https://demo.signalseek.local/x/y")
