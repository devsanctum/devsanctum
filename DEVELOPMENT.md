# DevSanctum - Development Setup

This document provides instructions for setting up and running the DevSanctum platform in a development environment.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

## Project Structure

```
devsanctum/
├── backend/          # Backend API (Fastify + Prisma + SQLite)
├── frontend/         # Frontend Web App (React + MUI + Vite)
├── library/          # Official templates and features library
├── specs/            # Technical specifications
└── .github/          # GitHub configuration and Copilot instructions
```

## Getting Started

### 1. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Copy the environment file and configure it:

```bash
cp .env.example .env
```

The default configuration uses SQLite for development, which requires no additional setup.

Generate Prisma client and initialize the database:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Start the development server:

```bash
npm run dev
```

The backend API will be available at `http://localhost:3000`.

API documentation is available at `http://localhost:3000/docs`.

#### Backend Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

The frontend is configured to proxy API requests to the backend at `http://localhost:3000`.

#### Frontend Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Technology Stack

### Backend
- **Node.js + TypeScript** - Runtime and language
- **Fastify** - HTTP server and API framework
- **Prisma** - ORM and database migrations
- **SQLite** - Database (development)
- **PostgreSQL** - Database (production)
- **Vitest** - Testing framework
- **dockerode** - Docker API client
- **Nodemailer** - Email delivery
- **bcrypt** - Password hashing
- **JWT** - Authentication tokens

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **MUI (Material-UI)** - Component library
- **React Router** - Client-side routing
- **Vitest** - Testing framework
- **React Testing Library** - Component testing

## Development Workflow

1. **Backend First**: Start the backend server to ensure the API is running
2. **Frontend Second**: Start the frontend development server
3. **Test Changes**: Both backend and frontend have test suites that should pass
4. **Database Changes**: Use Prisma migrations for any schema changes

## Database Management

The backend uses Prisma with SQLite for development:

- Database file: `backend/prisma/dev.db`
- Migrations: `backend/prisma/migrations/`
- Schema: `backend/prisma/schema.prisma`

To create a new migration after schema changes:

```bash
cd backend
npx prisma migrate dev --name description_of_change
```

To reset the database (⚠️ destroys all data):

```bash
cd backend
npx prisma migrate reset
```

To explore the database with Prisma Studio:

```bash
cd backend
npm run prisma:studio
```

## Testing

Run all tests:

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

Run tests with coverage:

```bash
# Backend
cd backend && npm run test:coverage

# Frontend
cd frontend && npm run test:coverage
```

## API Documentation

When the backend is running, OpenAPI documentation is automatically generated and available at:

- **Swagger UI**: http://localhost:3000/docs

The documentation includes all API endpoints, request/response schemas, and authentication requirements.

## Environment Variables

### Backend (.env)

Key configuration options:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - Secret for JWT token signing
- `PLATFORM_DOMAIN` - Platform domain name
- `INVITATION_ONLY_MODE` - Require invitations for signup

See `backend/.env.example` for all available options.

## Troubleshooting

### Backend won't start
- Check that port 3000 is available
- Verify database file exists: `backend/prisma/dev.db`
- Run `npm install` to ensure all dependencies are installed
- Run `npx prisma generate` to regenerate Prisma client

### Frontend won't start
- Check that port 5173 is available
- Ensure backend is running (frontend proxies API requests)
- Run `npm install` to ensure all dependencies are installed
- Clear Vite cache: `rm -rf frontend/node_modules/.vite`

### Database issues
- Reset migrations: `cd backend && npx prisma migrate reset`
- Regenerate client: `cd backend && npx prisma generate`
- Check for migration errors in the console output

## Contributing

Please refer to the technical specifications in the `specs/` directory for detailed information about:

- Architecture and design patterns (`specs/architecture.md`)
- Database schema (`specs/database.md`)
- Technology choices (`specs/stack.md`)
- Feature specifications (`specs/features/`)

For code style and best practices, see `.github/copilot-instructions.md`.

## License

See [LICENSE](LICENSE) file for details.
