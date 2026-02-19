# GitHub Copilot Instructions for DevSanctum

## Project Overview
DevSanctum is a simplified self-hosted developer platform for provisioning and accessing containerized development environments. It connects to Docker hosts, manages environment templates, and provides domain-based routing to workspaces.

## Code Style & Best Practices

### General
- **Language**: All code, comments, documentation, and commit messages MUST be in English
- **Code Quality**: Follow SOLID principles and clean code practices
- **Formatting**: Use consistent indentation (2 spaces for TypeScript/JavaScript/React)
- **Naming**: Use descriptive, intention-revealing names for variables, functions, and classes

### TypeScript
- Always use TypeScript with strict mode enabled
- Prefer `interface` over `type` for object shapes
- Use explicit return types for functions
- Avoid `any` type - use `unknown` or proper types
- Use optional chaining (`?.`) and nullish coalescing (`??`) operators
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for inline callbacks and methods

### Backend (Node.js + Fastify)
- **Architecture**: Follow MVC pattern with clear separation of concerns
  - `controllers/` - HTTP request handlers
  - `services/` - Business logic and orchestration
  - `repositories/` - Data access layer
  - `models/` - Domain models and DTOs
  - `middlewares/` - Authentication, validation, error handling
  - `infrastructure/` - External service adapters (Docker, Proxy)
- **Error Handling**: Use proper error types and handle errors gracefully
- **Validation**: Validate all inputs using schema validation (Fastify schema or Zod)
- **Security**:
  - Never log sensitive data (passwords, tokens)
  - Always hash passwords with bcrypt
  - Use JWT for authentication with proper expiration
  - Sanitize all user inputs
  - Use parameterized queries (Prisma handles this)
- **API Design**:
  - Use RESTful conventions
  - Return appropriate HTTP status codes
  - Use consistent response formats
  - Include OpenAPI/Swagger documentation
- **Database**:
  - Use Prisma ORM for all database operations
  - Always use transactions for multi-step operations
  - Handle database errors appropriately

### Frontend (React + TypeScript)
- **Components**: Use functional components with hooks
- **State Management**: Use React hooks (useState, useReducer, useContext)
- **Styling**: Use MUI (Material-UI) components and styling system
- **Error Boundaries**: Implement error boundaries for robust error handling
- **Forms**: Use controlled components with proper validation
- **API Calls**: Use async/await with proper error handling
- **Accessibility**: Follow WCAG guidelines, use semantic HTML and ARIA labels

### Testing
- **Framework**: Use Jest or Vitest for unit and integration tests
- **Coverage**: Aim for high test coverage on business logic
- **Test Structure**: Arrange-Act-Assert pattern
- **Naming**: Test names should describe the behavior being tested
- **Mocking**: Use mocks for external dependencies
- **E2E**: Consider Playwright or Cypress for end-to-end tests

### Git & Commits
- **Commit Messages**: Use conventional commits format
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `refactor:` for code refactoring
  - `test:` for adding tests
  - `chore:` for maintenance tasks
- **Branches**: Use descriptive branch names (e.g., `feature/user-authentication`)
- **PRs**: Write clear PR descriptions with context and testing notes

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify
- **ORM**: Prisma
- **Database**: 
  - PostgreSQL (production)
  - SQLite (development)
- **Authentication**: @fastify/jwt + @fastify/oauth2 (Google, GitHub)
- **Documentation**: @fastify/swagger + @fastify/swagger-ui
- **Docker SDK**: dockerode
- **Email**: Nodemailer

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **UI Library**: MUI (Material-UI)
- **Routing**: React Router
- **HTTP Client**: fetch or axios

### Infrastructure
- **Container Base**: Alpine Linux + s6-overlay
- **Reverse Proxy**: Traefik (controlled via REST API)
- **Testing**: Jest/Vitest + React Testing Library

## Architecture Patterns

### SOLID Principles
1. **Single Responsibility**: Each class/module has one reason to change
2. **Open/Closed**: Open for extension, closed for modification
3. **Liskov Substitution**: Subtypes must be substitutable for their base types
4. **Interface Segregation**: Many specific interfaces over one general interface
5. **Dependency Inversion**: Depend on abstractions, not concretions

### Layered Architecture
```
┌─────────────────┐
│   Controllers   │ ← HTTP layer (routing, validation)
├─────────────────┤
│    Services     │ ← Business logic and orchestration
├─────────────────┤
│  Repositories   │ ← Data access layer
├─────────────────┤
│   Models/DTOs   │ ← Domain entities
└─────────────────┘
```

### Dependency Injection
- Use constructor injection for dependencies
- Keep classes testable by injecting dependencies
- Use interfaces/abstractions for external services

## Key Domain Concepts

### Core Entities
- **User**: Platform users with roles (USER, ADMIN)
- **Group**: Organizational units for access control
- **Template**: Blueprint for workspace environments (Alpine + packages + features)
- **Feature**: Reusable components that extend templates
- **Project**: Container for workspace configurations
- **Workspace**: Running containerized development environment
- **DockerServer**: Remote Docker host for container execution

### Workspace Lifecycle
1. User selects template and creates project
2. User deploys workspace from project
3. Backend provisions container on Docker host
4. Backend registers routing in Traefik
5. Workspace accessible via subdomain
6. Auto-stop after inactivity
7. Auto-destroy after expiry (unless pinned)

### Routing Model
- Each workspace gets unique subdomain: `<workspace-id>.devsanctum.io`
- Traefik dynamically routes based on subdomain
- TLS termination handled by Traefik (Let's Encrypt)
- WebSocket support built-in

## Security Guidelines
- **Authentication**: JWT access + refresh token pattern
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Validate and sanitize all inputs
- **SQL Injection**: Use Prisma ORM (parameterized queries)
- **XSS Prevention**: Sanitize user-generated content
- **CSRF**: Use CSRF tokens for state-changing operations
- **Rate Limiting**: Implement rate limiting on API endpoints
- **Secrets Management**: Never commit secrets, use environment variables
- **Docker Security**: Run containers as non-root users
- **Network Security**: Isolate container networks

## Common Tasks

### Adding a New API Endpoint
1. Define schema in route file
2. Create controller method
3. Implement service layer logic
4. Add repository method if needed
5. Write unit tests for service
6. Write integration test for endpoint
7. Update OpenAPI documentation

### Adding a New React Component
1. Create component file in appropriate directory
2. Define props interface
3. Implement component with TypeScript
4. Use MUI components for styling
5. Add prop validation
6. Write component tests
7. Export from index file

### Database Schema Changes
1. Update Prisma schema
2. Generate migration: `npx prisma migrate dev --name description`
3. Update repository layer
4. Update service layer if needed
5. Write tests for new functionality

## Development Workflow
1. Create feature branch from main
2. Implement changes with tests
3. Run linter and formatter
4. Run all tests locally
5. Commit with conventional commit message
6. Push and create PR
7. Address review comments
8. Merge after approval

## Resources
- Architecture: `specs/architecture.md`
- Database Schema: `specs/database.md`
- Feature Specs: `specs/features/`
- Technology Stack: `specs/stack.md`
