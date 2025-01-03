# Project Tree
```

# README.md
# CRM Reporting Service

A microservice for handling CRM reporting functionalities, built with TypeScript, Express, and MongoDB.

## Features

- RESTful API endpoints for report management
- MongoDB integration for data persistence
- Docker containerization
- TypeScript for type safety
- Express.js for API routing
- Automated setup and build processes

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- MongoDB (handled via Docker)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd crm-reporting-service
```

2. Make the setup script executable:
```bash
chmod +x setup.sh
```

3. Run the setup script:
```bash
./setup.sh
```

Alternatively, use the provided Makefile commands:
```bash
make build  # Build the Docker containers
make run    # Start the services
make stop   # Stop the services
```

## Project Structure

- `src/`: Source code directory
  - `models/`: Database models and schemas
  - `services/`: Business logic layer
  - `controllers/`: Request handlers
  - `routes/`: API route definitions
  - `app.ts`: Express application setup
  - `server.ts`: Server entry point
- `docker/`: Docker-related files
- `config/`: Configuration files
- `tests/`: Test files
- `Makefile`: Build and deployment commands
- `setup.sh`: Automated setup script

## API Endpoints

- `POST /api/reports`: Create a new report
- `GET /api/reports`: Get all reports (with optional filters)
- `GET /api/reports/:id`: Get a specific report
- `PUT /api/reports/:id`: Update a report
- `DELETE /api/reports/:id`: Delete a report

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://mongodb:27017/crm-reporting
NODE_ENV=development
```

## Development

1. Start the development server:
```bash
npm run dev
```

2. Run tests:
```bash
npm test
```

3. Lint code:
```bash
npm run lint
```

## Docker Commands

- Build containers:
```bash
docker-compose build
```

- Start services:
```bash
docker-compose up
```

- Stop services:
```bash
docker-compose down
```

## Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.