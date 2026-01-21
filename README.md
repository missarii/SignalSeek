# SignalSeek — Agentic Multi-Source Intelligence Platform

> Evidence-grounded, iterative research with transparent provenance — not fluent text without receipts.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![NestJS](https://img.shields.io/badge/NestJS-10-red) ![FastAPI](https://img.shields.io/badge/FastAPI-agent-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![Python](https://img.shields.io/badge/Python-3.12-yellow) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)

## Purpose

Analysts drown in tabs: ten searches, dozens of pages, conflicting figures, and an LLM summary nobody can audit. **SignalSeek** exists to close that loop. You ask one natural-language intelligence question; autonomous agents decompose it, search multiple sources through swappable providers, retrieve and normalize evidence, extract verifiable claims, flag contradictions, run follow-up searches inside a visible budget, and synthesize a **cited report where every factual claim links back to a persisted source passage**.

The core differentiator is **provenance over fluency**: stable `[Sn]` citations, claim→evidence→source chains inspectable in the UI, contradiction records that keep both sides, honest "insufficient evidence" states, and a knowledge graph in which every edge carries its evidence. Nothing is silently fabricated — unconfigured providers say so, unreachable sources are marked inaccessible, and unresolvable citations are flagged, never invented.

## Features

**Agentic research**
- Natural-language question → structured `ResearchPlan` (objective, subquestions, search queries, source categories, budgets)
- Bounded iterative loop: max 4 search rounds / 20 queries / 50 sources / wall-clock deadline by default — all configurable, validated, and visible
- Query normalization + deduplication, canonical URL handling, content hashing, gap-driven follow-up queries
- Checkpointed runs with safe resume: re-running never duplicates reports, sources, or graph edges

**Evidence & verification**
- Full chain: Source → Snapshot → Passage (with `chunk-N` locators) → Evidence (quote, method, result) → Claim links
- Evidence statuses: Supported / Partially supported / Contradicted / Insufficient / Not evaluated
- Contradiction detection with honest classification: genuine vs different dates, scopes, definitions, opinions, or incomplete info — both sides stored, newest/popular never auto-preferred
- Citation validation: every `[Sn]` must resolve to a persisted source or the report carries an explicit caveat

**Knowledge graph**
- Entities (Organization, Person, Product, Technology, Event, Location, Dataset, Research paper, Concept) with normalized-name dedupe — never auto-merges people/orgs sharing a name
- Relationships extracted from evidence, each edge linked to its supporting quote; Cytoscape.js visualization with zoom, pan, selection, filters

**Monitoring & reports**
- Trend monitors (daily/weekly) with baseline snapshots, new/changed/removed/conflicting finding detection, in-app alerts, pause/resume/history
- Reports with executive summary, key/detailed findings, conflicts, timeline, entities, limitations, unanswered questions, references + retrieval dates; Markdown/HTML/PDF export and version history

**Platform**
- Auth (JWT + rotating refresh, Argon2id), workspaces, OWNER/ADMIN/ANALYST/VIEWER RBAC enforced server-side
- Live SSE progress with typed, persisted, replayable events; provider health dashboard with masked secrets
- Docker Compose one-command stack; deterministic keyless demo mode; CI gating types, tests, and builds

## Architecture

```
apps/web (Next.js 14) ──REST/SSE──> apps/api (NestJS 10) ──auth HTTP──> apps/agent (FastAPI)
        │                              │ Prisma ORM                       │ bounded research loop
        │                              ▼                                  ▼
        │                         PostgreSQL + pgvector              Tavily / Brave / RSS / mock
        │                         Redis (jobs/cache)                 OpenAI-compat / Ollama / mock
        └─ Cytoscape graph, SSE timeline, citations, exports (md/html/pdf)
```

See [`docs/ARCHITECTURE.md`](signalseek/docs/ARCHITECTURE.md), [`docs/AGENT_WORKFLOW.md`](signalseek/docs/AGENT_WORKFLOW.md),
[`docs/DATA_MODEL.md`](signalseek/docs/DATA_MODEL.md), [`docs/API.md`](signalseek/docs/API.md),
[`docs/SECURITY.md`](signalseek/docs/SECURITY.md), [`docs/PROVIDERS.md`](signalseek/docs/PROVIDERS.md),
[`docs/RESEARCH_EVALUATION.md`](signalseek/docs/RESEARCH_EVALUATION.md).

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend (`apps/web`) | Next.js 14 (App Router), React 18, TypeScript strict, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod, Recharts, Cytoscape.js, SSE live updates |
| Product API (`apps/api`) | NestJS 10, TypeScript strict, Prisma ORM, PostgreSQL, Redis, JWT + rotating refresh, Argon2id, Swagger/OpenAPI, class-validator, Helmet, API throttling |
| Agent engine (`apps/agent`) | Python 3.12, FastAPI, Pydantic, httpx, tenacity, trafilatura, BeautifulSoup, feedparser, pytest, Ruff |
| Data & infra | PostgreSQL 16 + pgvector, Redis 7, Docker Compose, GitHub Actions, OpenTelemetry-compatible tracing, structured JSON logs |
| Providers | Tavily / Brave / RSS-Atom / deterministic mock search; OpenAI-compatible / Ollama / mock LLM |

## Repository structure

```
signalseek/
  apps/web/        # Next.js dashboard (investigations, evidence, reports, graph, monitors)
  apps/api/        # NestJS product API (auth, workspaces, RBAC, jobs, exports) + Prisma seed
  apps/agent/      # FastAPI research engine (planning, search, retrieval, claims, synthesis)
    app/           # config, schemas, utils, security, providers_*, retrieval, workflow, run_research, main
    tests/         # 8 pytest cases (URLs, SSRF, chunking, plans, contradictions)
  packages/shared-types/  # typed SSE event contract shared by API + web
  packages/config/        # shared TS base config
  prisma/          # source-of-truth schema (28 models) + initial migration
  docs/            # architecture, workflow, data model, API, security, providers, evaluation, …
  scripts/         # benchmark spec + regression driver
  docker-compose.yml  .env.example  Makefile  .github/workflows/ci.yml
```

## How the agent works

```
START → analyze_question → create_research_plan → execute_searches
  → normalize_and_deduplicate → retrieve_relevant_content
  → extract_claims_and_entities → evaluate_evidence → identify_research_gaps
  → sufficient_evidence? ──no──→ generate_followup_queries ──→ execute_searches
                         └──yes─→ synthesize_report → persist_report
  → update_knowledge_graph → emit_completion → END
  (+ error / cancellation / timeout / exhausted-budget exits at every step)
```

1. **Analyze & plan** — the question is validated and decomposed into ≤5 subquestions plus deduplicated search queries (`apps/agent/app/workflow.py::analyze_question`). Budgets (rounds, queries, sources, wall-clock, tokens, cost) are attached to the plan and shown in the UI.
2. **Search** — batched queries (5/round) go through the provider registry (`providers_search.py`); near-duplicate normalized queries are skipped and provider/latency recorded.
3. **Normalize & retrieve** — URLs are canonicalized (lowercased host, sorted query, tracking params stripped), then fetched behind an SSRF guard (`security.py`: scheme/host allowlist, DNS→public-IP revalidation, 15s timeout, 2MB cap, trafilatura→BeautifulSoup→raw chain). Failures are stored as `extraction_failed`, never papered over.
4. **Extract** — pages are split into overlapping chunks (1200 chars / 200 overlap) with `chunk-N` locators; sentence-level claims are ranked so figure-bearing sentences surface first; entities come from capitalized-phrase extraction with normalized-name dedupe.
5. **Evaluate & contradict** — each claim links to its passage and source; numeric-figure pairs are classified as genuine / different-dates / different-scope / different-definitions / opinion / incomplete — both sides preserved, recency/popularity never auto-wins.
6. **Close the gaps** — subquestion keyword coverage decides whether ≤2 follow-up queries are issued, still inside the configured budgets.
7. **Synthesize & persist** — the report is generated *only* from persisted evidence; `[Sn]` keys are validated against stored citations (mismatches append an explicit caveat); checkpoints make resume idempotent.

Every transition emits a typed, persisted SSE event (`plan.created`, `search.started`, `source.retrieved`, `claim.extracted`, `contradiction.detected`, `research_gap.detected`, `report.completed`, …) defined once in `packages/shared-types` and consumed by both API and web — auditable, replayable, and free of private chain-of-thought.

## Application pages

| Page | What the reviewer sees working |
|---|---|
| Overview | Recent investigations, statuses, reports, monitors, alerts, usage, provider health — with honest empty states |
| New Investigation | Question, description, depth, budgets, auto-plan — validated via DTOs |
| Investigation Details | Plan, live SSE timeline, queries executed, source feed, evidence counts, contradictions, gaps, budget, cancel/resume |
| Reports | Search/filter, citation navigation, evidence inspector, md/html/pdf export, version history |
| Source Explorer | Metadata, canonical URL, hashes, retrieval/publication times, passages, related claims |
| Evidence Explorer | Claim text, supporting vs contradictory sources, assessment history, verification status |
| Knowledge Graph | Cytoscape zoom/pan/selection, type + time filters, per-edge evidence panel |
| Trend Monitor | Create/edit monitors, baseline snapshots, change timeline, alert details, pause/resume |
| Integrations | Search/LLM/RSS status, model config, connection testing, masked secrets |
| Settings & Admin | Profile, workspaces, roles, usage/budgets, audit logs, queue health (server-side authorized) |
