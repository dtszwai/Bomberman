.PHONY: up web db db-down db-logs migrate server install lint build clean help

# Bootstrap .env from example at parse time so -include below picks it up on first run.
_ := $(shell test -f .env || cp .env.example .env)

-include .env
export

help:
	@echo "Targets:"
	@echo "  make up        start db, run migrations, start server (foreground)"
	@echo "  make web       start vite client (foreground)"
	@echo "  make db        start postgres only (detached)"
	@echo "  make db-down   stop postgres"
	@echo "  make db-logs   tail postgres logs"
	@echo "  make migrate   apply drizzle migrations"
	@echo "  make server    start server only (assumes db already up)"
	@echo "  make install   pnpm install"
	@echo "  make lint      eslint workspace"
	@echo "  make build     type-check + vite build"
	@echo "  make clean     stop + remove db volume"

.env:
	@cp .env.example .env
	@echo "created .env from .env.example"

up: .env db migrate server

db: .env
	docker compose up -d db
	@echo "waiting for postgres..."
	@until docker compose exec -T db pg_isready -U user -d arcade >/dev/null 2>&1; do sleep 1; done
	@echo "postgres ready"

db-down:
	docker compose stop db

db-logs:
	docker compose logs -f db

migrate: .env
	pnpm --filter @arcade/storage db:migrate

server: .env
	pnpm --filter @arcade/server dev

web: .env
	pnpm --filter @arcade/web dev

install:
	pnpm install

lint:
	pnpm lint

build:
	pnpm build

clean:
	docker compose down -v
