from __future__ import annotations

class LLMProvider:
    name = "base"
    supports_tools = False
    supports_json = False
    def is_configured(self) -> bool: return False
    async def complete(self, system: str, user: str, max_tokens: int = 2000) -> str:
        raise NotImplementedError

class MockLLM(LLMProvider):
    """Deterministic test LLM: rule-based structured outputs, no network."""
    name = "mock"
    supports_tools = False
    supports_json = True
