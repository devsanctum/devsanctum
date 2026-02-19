# Technology Stack

This document defines the core tooling used in this project.

## Language
- **TypeScript** is the primary language for backend and frontend development.

## Backend
- **Node.js + TypeScript** power the backend services.
- **Fastify** is the HTTP server and API router.
  - `@fastify/swagger` + `@fastify/swagger-ui` — auto-generated OpenAPI 3 documentation served at `/docs`.
  - `@fastify/jwt` — JWT-based authentication (access + refresh tokens).
  - `@fastify/oauth2` — OAuth2 integration for third-party providers (Google, GitHub).
- **Prisma** is used as the ORM and migration tool.
- **PostgreSQL** is the primary relational database for production.
- **SQLite** is used as the database for development and testing environments for simplicity and ease of setup.

## Frontend
- **React** is used to build the web application UI.
- **Primer React** (GitHub's official design system) is the UI component library used to build and style the interface, providing a native GitHub look and feel.
- **styled-components** is used as the CSS-in-JS styling engine required by Primer React.
- **@primer/octicons-react** provides GitHub's Octicons icon set.

## Email
- **Nodemailer** is used to send transactional emails (invitations, notifications).
- Supports any SMTP server. Credentials are configured via platform administration settings.
- A `MailService` abstraction wraps Nodemailer so the transport can be swapped (e.g. for testing with a mock or a local SMTP such as Mailhog).

## Docker Management
- **dockerode** is used to interact with Docker from the application code (container lifecycle, inspection, and runtime operations).

## Workspace Container Base
- All workspace containers use **Alpine Linux** as the base image to minimise size and attack surface.
- **s6-overlay** is the default process supervisor bundled into every workspace image.
  - Enables multi-service containers (e.g. app process + database sidecar) within a single container.
  - Services are declared in `/etc/s6-overlay/s6-rc.d/` as part of the image build.
  - Provides automatic process restart on failure.
  - `s6-svc` CLI is available inside the container for manual service control.
- Custom templates may extend the Alpine + s6-overlay base to add language runtimes, tools, or additional services.

## Reverse Proxy
- **Traefik** is the reverse proxy data plane.
- The backend TypeScript application acts as the control plane and drives Traefik at runtime via its REST API.
- Key capabilities used:
  - Dynamic router and service registration (no restart required).
  - TLS termination with ACME/Let's Encrypt.
  - Native WebSocket support.
  - Routing to remote Docker hosts via upstream URL configuration.
  - Health checks on upstream container endpoints.

## Testing
- **Jest** or **Vitest** is used for unit and integration testing.
- **React Testing Library** is used for frontend component testing.
- **Supertest** is used for backend API testing.
- SQLite is used as the test database for fast, isolated test execution.

## Build Tools
- **TypeScript** compiler (tsc) for type checking and compilation.
- **Vite** is used as the frontend build tool for fast development and optimized production builds.
- **tsx** or **ts-node** for running TypeScript files directly during development.

## Summary
- Language: TypeScript
- HTTP Server: Fastify
- ORM: Prisma
- Database: PostgreSQL (production), SQLite (development/testing)
- Frontend: React + Primer React + Vite
- Testing: Jest/Vitest + React Testing Library + Supertest
- Docker SDK: dockerode
- Workspace base: Alpine + s6-overlay
- Email: Nodemailer
- Reverse Proxy: Traefik