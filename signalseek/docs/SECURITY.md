# Security

- **SSRF**: scheme allowlist, credential rejection, host blocklist (loopback/private/link-local/metadata/`*.internal`, except labeled demo host), DNS→IP revalidation, redirect limits, 2MB/size caps. (`apps/agent/app/security.py`)
- **Prompt injection**: retrieved content is delimited untrusted input; strict tool allowlist (search/fetch only); no shell/SQL/code exec from model or sources; outputs validated against Pydantic schemas.
- **Auth**: Argon2id, JWT 15m + rotating refresh (sha256-stored, revocable), httpOnly SameSite cookie, CSRF-safe for cookie flow, rate-limited auth/upload/investigation endpoints, no secrets in logs/UI/bundles.
- **Tenancy**: WorkspaceGuard on every scoped route + membership checks on direct-ID fetches.
- **Uploads**: PDF/TXT/MD/CSV allowlist, MIME+signature checks, size caps, page refs retained.
- **Sanitization**: untrusted text escaped in HTML/PDF exports; no raw innerHTML of source content.
- **Robots/ToS**: official APIs preferred, per-domain politeness, no paywall/auth bypass, minimal PII + deletion controls.
