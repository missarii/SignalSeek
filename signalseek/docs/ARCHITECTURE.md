# Architecture

```
apps/web (Next.js 14, App Router, TS strict, Tailwind, TanStack Query, Zustand, Cytoscape)
  │ REST /api/v1 + SSE /events/stream
  ▼
apps/api (NestJS 10, Prisma, JWT rotation w/ Argon2id, RBAC, Swagger, Helmet, Throttler)
  │ authenticated internal HTTP (bearer secret) to agent
  ▼
apps/agent (FastAPI, Pydantic, httpx, tenacity, trafilatura/bs4, feedparser)
  │ providers: Tavily / Brave / RSS / mock search; OpenAI-compat / Ollama / mock LLM
  ▼
PostgreSQL 16 + pgvector (primary store, knowledge graph, hybrid retrieval-ready)
Redis 7 (cache + job coordination; BullMQ-compatible repeat scheduling for monitors)
```

Decisions: Postgres holds the graph (no extra graph/vector DB); agent owns research logic, API owns tenancy/auth/persistence (no duplicated business rules); mock providers are deterministic and demo-labeled, never silent in production; SSE events are typed, persisted, replayable.
