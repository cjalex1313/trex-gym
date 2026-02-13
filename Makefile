COMPOSE_FILE=docker-compose.yml
ENV_FILE=.env

.PHONY: up down logs seed

up:
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up --build -d

down:
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) down

logs:
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) logs -f

seed:
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) run --rm trexgym-api npm run seed
