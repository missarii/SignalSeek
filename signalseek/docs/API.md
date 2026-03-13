# API (`/api/v1`, Swagger at `/api/docs`)

Auth: register/login/refresh/logout/me — short JWT access + rotating httpOnly refresh cookie; Argon2id; generic error messages; throttled.
Workspaces: list/create/get/members (OWNER/ADMIN/ANALYST/VIEWER enforced in guards, not just UI).
Investigations: create (auto-plan) / list / get / start / cancel / resume / events / events/stream (SSE) / sources / evidence / graph.
Reports: list/get/versions/export?format=markdown|html|pdf (escaped HTML, minimal valid PDF).
Sources/evidence: source detail w/ snapshots+passages; claim detail w/ full evidence chain.
Monitoring: monitors CRUD + pause/resume/history; alerts.
Integrations: provider status (configured vs actionable unconfigured message; secrets masked).
System: health/live, health/ready (DB check), metrics (protected equivalent: counts + caller).

Conventions: pagination (`take` caps), consistent `{error}` shapes, class-validator DTOs, idempotent resume (no duplicate reports), SSE with replay + polling fallback in UI.
