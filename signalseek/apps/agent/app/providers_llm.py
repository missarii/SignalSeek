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
    def is_configured(self) -> bool: return True
    async def complete(self, system: str, user: str, max_tokens: int = 2000) -> str:
        # Deterministic extractive behavior driven by caller templates; echo a marker.
        return f"[mock-llm] {user[:1500]}"

class OpenAICompatibleLLM(LLMProvider):
    name = "openai-compatible"
    supports_tools = True
    supports_json = True
    def __init__(self, api_key: str, base_url: str, model: str):
        self.api_key = api_key; self.base_url = base_url.rstrip("/") if base_url else "https://api.openai.com/v1"
        self.model = model
    def is_configured(self) -> bool: return bool(self.api_key)
    async def complete(self, system: str, user: str, max_tokens: int = 2000) -> str:
        if not self.api_key:
            raise RuntimeError("LLM provider unconfigured: set LLM_API_KEY")
        import httpx
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post(f"{self.base_url}/chat/completions",
