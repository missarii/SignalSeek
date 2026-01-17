.PHONY: up down build logs migrate seed test
up:
	docker-compose -f docker-compose.yml up --build
down:
	docker-compose -f docker-compose.yml down
migrate:
	docker-compose exec api npx prisma migrate deploy
seed:
	docker-compose exec api npm run seed
logs:
	docker-compose logs -f
test-agent:
	cd apps/agent && python -m pytest -q

