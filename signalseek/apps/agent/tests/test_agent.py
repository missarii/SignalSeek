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

def test_chunking_preserves_provenance():
    chunks = chunk_text("para one\n\npara two\n\npara three", max_chars=20, overlap=3)
    assert len(chunks) >= 2 and all(c[0].startswith("chunk-") for c in chunks)

def test_plan_validation():
    import asyncio
    with pytest.raises(ValueError):
        asyncio.run(analyze_question("hi", "", 4, 20))
    plan = asyncio.run(analyze_question("What is the adoption of open RAN in Europe?", "", 4, 20))
    assert len(plan.subquestions) >= 2 and len(plan.search_queries) >= 2

def test_contradiction_classification():
    assert classify_contradiction("Adoption reached 41% globally", "Adoption reached 27% in EU") in (
        "different-scope", "genuine", "different-reporting-dates", "incomplete-information")

def test_claim_extraction_links_evidence():
    ps = [PassageOut(text="Adoption of Open RAN reached 41% globally in 2024. Analysts reported growth.", locator="chunk-1", source_url="https://demo.signalseek.local/a", source_title="t")]
    claims = extract_claims_from_passages(ps)
    assert claims and claims[0].evidence and claims[0].evidence[0].source_url.startswith("https://")

