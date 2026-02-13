# TRexGYM Monorepo

Local development is fully containerized. Use one command to boot API, web dashboard, MongoDB, MailHog, and Mongo Express.

## Quick Start

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
2. Start the full stack:
   ```bash
   docker compose up --build
   ```

### Optional Makefile commands

- `make up` — start the full stack in detached mode
- `make down` — stop and remove containers
- `make logs` — stream container logs
- `make seed` — create default admin and sample clients

## Services

- API: http://localhost:3000
- Web: http://localhost:5173
- MongoDB: mongodb://localhost:27017
- Mongo Express: http://localhost:8081
- MailHog UI: http://localhost:8025

## Seed Data

The seed script is in `trexgym-api/src/seeds/seed.ts` and is idempotent.

By default it creates:
- Admin user: `admin@trexgym.local` / `Admin123!`
- Three sample client records

You can override admin credentials via environment variables:
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
