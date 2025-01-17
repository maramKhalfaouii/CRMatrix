#!/bin/bash
set -e

echo "Setting up Customer Management Service..."

# Clean up any existing containers and volumes
docker compose down -v

# Build and start the services
docker compose up --build -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

echo "Setup completed successfully!"