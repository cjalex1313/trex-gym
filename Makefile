COMPOSE_FILE=docker-compose.yml
ENV_FILE=.env

.PHONY: up down logs seed

up:
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up --build -d

down:
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) down --remove-orphans

logs:
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) logs -f

seed:
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) run --rm trexgym-api npm run seed

.PHONY: clean-docker

clean-docker:
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) down --remove-orphans --volumes
	sh -c 'docker images -q --filter "dangling=true" --filter "label=com.docker.compose.project=trexgym" | xargs -r docker rmi'
	sh -c 'docker volume ls -q --filter "label=com.docker.compose.project=trexgym" | xargs -r docker volume rm'
