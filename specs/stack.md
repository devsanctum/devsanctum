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
- **PostgreSQL** is the primary relational database.

## Frontend
- **React** is used to build the web application UI.

## Email
- **Nodemailer** is used to send transactional emails (invitations, notifications).
- Supports any SMTP server. Credentials are configured via platform administration settings.
- A `MailService` abstraction wraps Nodemailer so the transport can be swapped (e.g. for testing with a mock or a local SMTP such as Mailhog).

## Docker Management
- **dockerode** is used to interact with Docker from the application code (container lifecycle, inspection, and runtime operations).

## Reverse Proxy
- **Traefik** is the reverse proxy data plane.
- The backend TypeScript application acts as the control plane and drives Traefik at runtime via its REST API.
- Key capabilities used:
  - Dynamic router and service registration (no restart required).
  - TLS termination with ACME/Let's Encrypt.
  - Native WebSocket support.
  - Routing to remote Docker hosts via upstream URL configuration.
  - Health checks on upstream container endpoints.

## Summary
- Language: TypeScript
- HTTP Server: Fastify
- ORM: Prisma
- Database: PostgreSQL
- Frontend: React
- Docker SDK: dockerode
- Email: Nodemailer
- Reverse Proxy: Traefik
