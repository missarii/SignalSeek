# Development

Prereqs: Docker + Docker Compose, Node 20, Python 3.12.

```bash
cp signalseek/.env.example signalseek/.env
docker-compose -f signalseek/docker-compose.yml up --build
```

Services: web :3000 · api :4000 · agent :8001 · postgres :5432 · redis :6379.
Migrations: `... exec api npx prisma migrate deploy` (from empty DB supported).
Seed: `... exec api npm run seed`.
Tests: agent `python -m pytest -q`; api/web `npx tsc --noEmit`.
Logs: `docker-compose -f signalseek/docker-compose.yml logs -f [api|agent|web]`.
Env validation happens at startup with actionable messages (see `.env.example`).
