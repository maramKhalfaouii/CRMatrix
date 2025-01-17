# Install dependencies
npm install

# Create necessary directories
mkdir -p dist

# Build the application
npm run build

# Start the services
docker compose up -d

echo "Setup completed successfully!"