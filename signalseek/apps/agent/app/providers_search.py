from __future__ import annotations
from .schemas import SearchResult

class SearchProvider:
    name = "base"
    def is_configured(self) -> bool: return False
    def status_message(self) -> str: return "unconfigured"
    async def search(self, query: str, max_results: int = 8) -> list[SearchResult]:
        raise NotImplementedError

