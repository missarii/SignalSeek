# Providers

Registry pattern: `build_search_registry` / `build_llm` — add/remove/configure/test without touching the engine.

- **Search**: `mock` (deterministic, demo-labeled, zero keys — default), `tavily` (needs `TAVILY_API_KEY`), `brave` (needs `BRAVE_SEARCH_API_KEY`), RSS/Atom ingestion (`/rss/preview`). Unconfigured real providers return an actionable message; the engine raises instead of fabricating.
- **LLM**: `mock` (deterministic rule-based outputs for tests), `openai-compatible` (`LLM_API_KEY`+`LLM_BASE_URL`+`LLM_MODEL`), `ollama` (local, no key). Capability flags (`supports_tools`, `supports_json`) gate structured-output paths per adapter.
- **Health**: `GET /providers/health` (agent) surfaced in `GET /integrations` (API) with masked secrets.
