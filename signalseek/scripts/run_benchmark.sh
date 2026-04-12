#!/usr/bin/env bash
set -euo pipefail
# Regression benchmark driver (demo providers; no keys needed).
AGENT="${AGENT_INTERNAL_URL:-http://localhost:8001}"
SECRET="${AGENT_INTERNAL_AUTH_SECRET:-dev-agent-secret-change-me-32chars-min}"
Q="${1:-What is the adoption of open RAN among European telecom operators?}"
curl -s -X POST "$AGENT/run" -H "Authorization: Bearer $SECRET" -H 'Content-Type: application/json' \
  -d "{\"investigation_id\":\"bench-1\",\"workspace_id\":\"bench\",\"question\":\"$Q\",\"max_rounds\":2,\"max_queries\":6,\"max_sources\":10,\"demo\":true}" \
  | python3 -c "import json,sys; r=json.load(sys.stdin); print('rounds',r['rounds_executed'],'queries',r['queries_issued'],'sources',len(r['sources']),'claims',len(r['claims']),'contradictions',len(r['contradictions']),'cites',len(r['citations']))"
