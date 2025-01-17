.PHONY: build run stop clean test lint

setup:
	chmod +x setup.sh
	./setup.sh

build:
	docker compose build

run:
	docker compose up -d

stop:
	docker compose down

logs:
	docker compose logs -f

clean:
	docker compose down -v
	rm -rf node_modules
	rm -rf dist

test:
	npm run test

lint:
	npm run lint