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
