.PHONY: setup build run stop logs clean test lint format migrate shell db-shell help

# Variables
DC := docker compose
PYTHON := python3
APP_CONTAINER := app

# Colors for help output
YELLOW := \033[33m
NC := \033[0m

help:
	@echo "$(YELLOW)Available commands:$(NC)"
	@echo "  setup      - Initial setup and dependencies installation"
	@echo "  build      - Build Docker containers"
	@echo "  run        - Start the application in detached mode"
	@echo "  stop       - Stop all containers"
	@echo "  logs       - Show and follow container logs"
	@echo "  clean      - Remove containers, volumes, and cache"
	@echo "  test       - Run tests"
	@echo "  lint       - Run code linting"
	@echo "  format     - Format code using black"
	@echo "  migrate    - Run database migrations"
	@echo "  shell      - Open Python shell in app container"
	@echo "  db-shell   - Open database shell"

setup:
	chmod +x setup.sh
	./setup.sh

build:
	$(DC) build

run:
	$(DC) up -d

stop:
	$(DC) down

logs:
	$(DC) logs -f

clean:
	$(DC) down -v
	rm -rf .venv
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type f -name ".pytest_cache" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -r {} +
	find . -type f -name ".DS_Store" -delete

test:
	$(DC) exec $(APP_CONTAINER) pytest

lint:
	$(DC) exec $(APP_CONTAINER) flake8 .
	$(DC) exec $(APP_CONTAINER) mypy .

format:
	$(DC) exec $(APP_CONTAINER) black .
	$(DC) exec $(APP_CONTAINER) isort .

migrate:
	$(DC) exec $(APP_CONTAINER) alembic upgrade head

shell:
	$(DC) exec $(APP_CONTAINER) python

db-shell:
	$(DC) exec db psql -U postgres