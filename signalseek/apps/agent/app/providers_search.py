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
                         result_type="web"),
        ]
        return base[:max_results]

class TavilyProvider(SearchProvider):
    name = "tavily"
    def __init__(self, api_key: str):
        self.api_key = api_key
    def is_configured(self) -> bool: return bool(self.api_key)
    def status_message(self) -> str:
        return "ready" if self.api_key else "unconfigured: set TAVILY_API_KEY to enable real web search"
    async def search(self, query: str, max_results: int = 8) -> list[SearchResult]:
        if not self.api_key:
            raise RuntimeError("Tavily provider unconfigured: set TAVILY_API_KEY")
        import httpx
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post("https://api.tavily.com/search",
                             json={"api_key": self.api_key, "query": query, "max_results": max_results,
                                   "include_answer": False, "search_depth": "advanced"},
                             headers={"Content-Type": "application/json"})
            r.raise_for_status()
            data = r.json()
        out = []
        for item in (data.get("results") or [])[:max_results]:
            out.append(SearchResult(provider="tavily", title=item.get("title","") or query,
                                    url=item.get("url",""), snippet=item.get("content","")[:800],
                                    published_at=item.get("published_date"), author=None, result_type="web"))
        return out

class BraveProvider(SearchProvider):
    name = "brave"
    def __init__(self, api_key: str):
        self.api_key = api_key
    def is_configured(self) -> bool: return bool(self.api_key)
    def status_message(self) -> str:
        return "ready" if self.api_key else "unconfigured: set BRAVE_SEARCH_API_KEY to enable Brave search"
    async def search(self, query: str, max_results: int = 8) -> list[SearchResult]:
        if not self.api_key:
            raise RuntimeError("Brave provider unconfigured: set BRAVE_SEARCH_API_KEY")
        import httpx
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get("https://api.search.brave.com/res/v1/web/search",
                            params={"q": query, "count": max_results},
                            headers={"X-Subscription-Token": self.api_key, "Accept": "application/json"})
            r.raise_for_status()
            data = r.json()
        out = []
        for item in ((data.get("web") or {}).get("results") or [])[:max_results]:
            out.append(SearchResult(provider="brave", title=item.get("title","") or query,
