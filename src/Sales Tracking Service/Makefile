.PHONY: up down build logs test

setup:
	chmod +x setup.sh
	./setup.sh

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

test:
	docker compose exec app vendor/bin/phpunit