# Deployment

- Compose ships production-shaped images (pinned bases: `pgvector/pgvector:pg16`, `redis:7-alpine`, `node:20-slim`, `python:3.12-slim`).
- Set real secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `AGENT_INTERNAL_AUTH_SECRET` ≥32 chars), `NODE_ENV=production`, `APP_BASE_URL` (CORS allowlist).
- Run migrations before rollout; keep `pgdata`/`redisdata` volumes.
- Put a TLS-terminating reverse proxy in front; restrict `/metrics`; ship logs to your collector (JSON logs + correlation/request/run IDs; OTEL-compatible tracing hooks).
- CI (`.github/workflows/ci.yml`, least-privilege) gates format/type/tests/builds; no auto-deploy without configured credentials.

## Project status

- Milestones 1–10 implemented as a working vertical slice: auth → workspace → plan → bounded agent run → persisted evidence → cited report → graph → monitors.
