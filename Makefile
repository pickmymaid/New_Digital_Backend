# ========================
# PROJECT MAKEFILE
# ========================

# Docker Compose files
DEV_COMPOSE=docker-compose.dev.yml
STAGING_COMPOSE=docker-compose.staging.yml
PROD_COMPOSE=docker-compose.prod.yml

# ========================
# Development
# ========================
dev:
	docker compose -f $(DEV_COMPOSE) up --build

dev-down:
	docker compose -f $(DEV_COMPOSE) down

dev-logs:
	docker compose -f $(DEV_COMPOSE) logs -f

# ========================
# Staging
# ========================
staging:
	docker compose -f $(STAGING_COMPOSE) up --build

staging-down:
	docker compose -f $(STAGING_COMPOSE) down

staging-logs:
	docker compose -f $(STAGING_COMPOSE) logs -f

# ========================
# Production
# ========================
prod:
	docker compose -f $(PROD_COMPOSE) up --build

prod-down:
	docker compose -f $(PROD_COMPOSE) down

prod-logs:
	docker compose -f $(PROD_COMPOSE) logs -f

# ========================
# Helpers
# ========================
# Stop all environments
down-all:
	docker compose -f $(DEV_COMPOSE) down || true
	docker compose -f $(STAGING_COMPOSE) down || true
	docker compose -f $(PROD_COMPOSE) down || true

# Show all running containers
ps:
	docker ps
