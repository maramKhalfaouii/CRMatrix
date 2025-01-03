# Sales Tracking Service

A microservice for tracking sales in a CRM system.

## Setup

1. Clone the repository
2. Run \`chmod +x setup.sh\`
3. Run \`./setup.sh\`
4. Run \`make up\`

## API Endpoints

- GET /sales - List all sales
- GET /sales/{id} - Get sale by ID
- POST /sales - Create new sale

## Development

- \`make up\` - Start services
- \`make down\` - Stop services
- \`make build\` - Rebuild containers
- \`make logs\` - View logs
- \`make test\` - Run tests