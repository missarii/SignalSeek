# Security

- **SSRF**: scheme allowlist, credential rejection, host blocklist (loopback/private/link-local/metadata/`*.internal`, except labeled demo host), DNS→IP revalidation, redirect limits, 2MB/size caps. (`apps/agent/app/security.py`)
- **Prompt injection**: retrieved content is delimited untrusted input; strict tool allowlist (search/fetch only); no shell/SQL/code exec from model or sources; outputs validated against Pydantic schemas.
