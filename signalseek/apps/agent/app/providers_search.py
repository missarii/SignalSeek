from __future__ import annotations
from .schemas import SearchResult

class SearchProvider:
    name = "base"
    def is_configured(self) -> bool: return False
    def status_message(self) -> str: return "unconfigured"
    async def search(self, query: str, max_results: int = 8) -> list[SearchResult]:
        raise NotImplementedError

class MockSearchProvider(SearchProvider):
    """Deterministic demo/test provider. Clearly labeled demo content."""
    name = "mock"
    def is_configured(self) -> bool: return True
    def status_message(self) -> str: return "ready (deterministic demo provider)"
    async def search(self, query: str, max_results: int = 8) -> list[SearchResult]:
        q = query.strip()
        base = [
            SearchResult(provider="mock", title=f"Demo briefing: {q} — overview",
                         url=f"https://demo.signalseek.local/briefing/{abs(hash(q)) % 10000}/overview",
                         snippet=f"Demonstration summary passage about {q}. This is labeled demo content for local development without paid keys.",
                         result_type="web"),
            SearchResult(provider="mock", title=f"Demo dataset: {q} — key figures",
                         url=f"https://demo.signalseek.local/dataset/{abs(hash(q+'x')) % 10000}/figures",
                         snippet=f"Demonstration data points about {q}, including two citable figures with different scopes to exercise contradiction detection.",
                         result_type="dataset"),
            SearchResult(provider="mock", title=f"Demo analysis: {q} — timeline",
                         url=f"https://demo.signalseek.local/analysis/{abs(hash(q+'y')) % 10000}/timeline",
                         snippet=f"Demonstration timeline of events related to {q}.",
