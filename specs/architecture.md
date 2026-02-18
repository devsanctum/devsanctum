# Architecture

## Overview
This project is a simplified developer platform inspired by Coder. It provisions containerized development environments on Docker infrastructure and exposes them through domain-based routing.

The architecture is organized around:
- A backend control plane (API + orchestration logic)
- A frontend management UI
- A reverse-proxy routing layer
- Docker-connected execution hosts

## High-Level Components
1. **Frontend (React)**
   - Provides workspace and template management UI.
   - Calls backend APIs for environment lifecycle operations.

2. **Backend (TypeScript, Node.js — Fastify)**
   - **Fastify** serves as the HTTP server and API router.
   - Exposes a RESTful JSON API consumed by the frontend and external clients.
   - **API documentation** is auto-generated from route schemas and served via `@fastify/swagger-ui` at `/docs` (OpenAPI 3).
   - **Authentication** is handled by:
     - `@fastify/jwt` for JWT-based sessions (access token + refresh token pattern).
     - `@fastify/oauth2` for federated login via Google and GitHub OAuth2 providers.
   - Implements business workflows for templates, workspaces, and deployment.
   - Persists platform state in PostgreSQL through Prisma.
   - Interacts with Docker through dockerode.

3. **Database (PostgreSQL + Prisma)**
   - Stores templates, environments, routing mappings, and deployment metadata.

4. **Reverse Proxy Layer (Traefik)**
   - **Traefik** acts as the data plane reverse proxy.
   - Resolves incoming domains/subdomains to running workspace containers.
   - Supports TLS termination (ACME/Let's Encrypt) and WebSocket connections natively.
   - Routes to local and remote Docker hosts.
   - Routing rules are pushed dynamically by the backend via the Traefik REST API — no restart required.

5. **Docker Runtime Layer**
   - Runs one or more containerized development environments.
   - Exposes container network targets consumed by the reverse proxy.

## MVC Structure
The backend follows an MVC-inspired layered structure to keep responsibilities clear.

### Model
- Prisma schema and data-access services.
- Domain entities such as `Template`, `Workspace`, `Deployment`, and `RouteMapping`.

### View
- JSON API responses for external clients.
- React frontend renders UI views based on API data.

### Controller
- HTTP controllers receive requests, validate input, and invoke application services.
- Controllers do not contain infrastructure orchestration details.

### Service Layer (between Controller and Model)
- Encapsulates core business rules and orchestration workflows.
- Coordinates Docker operations, route assignment, and persistence updates.

## SOLID Principles
The codebase should enforce SOLID to remain maintainable and extensible.

1. **Single Responsibility Principle (SRP)**
   - Controllers handle transport concerns.
   - Services handle business use cases.
   - Repositories/data modules handle persistence.
   - Docker adapters handle Docker API interactions.

2. **Open/Closed Principle (OCP)**
   - New deployment strategies or routing policies are added via new implementations, not by modifying stable core contracts.

3. **Liskov Substitution Principle (LSP)**
   - Interface implementations (for routing providers, Docker clients, repositories) are substitutable without breaking calling code.

4. **Interface Segregation Principle (ISP)**
   - Keep interfaces small and use-case specific (for example, separate `WorkspaceProvisioner` from `WorkspaceQueryService`).

5. **Dependency Inversion Principle (DIP)**
   - Business services depend on abstractions (ports/interfaces), not concrete infrastructure adapters.
   - Infrastructure details (Prisma, dockerode, proxy integration) are injected behind interfaces.

## Reverse Proxy to Docker Instances
Traefik is used as the reverse proxy (data plane). The backend TypeScript application acts as the control plane and drives Traefik configuration at runtime.

### Architecture Split
```
Backend TypeScript (control plane)
        ↓ Traefik REST API
     Traefik (data plane)
        ↓ dynamic routing
   Docker containers (local + remote hosts)
```

### Why Traefik
- **Dynamic routing** via REST API — rules are added, updated, or removed at runtime without restarting the proxy.
- **TLS termination** — ACME/Let's Encrypt support built-in.
- **WebSocket** — supported natively with no additional configuration.
- **Remote hosts** — services can point to any reachable upstream URL, not limited to local Docker sockets.
- **Health checks** — Traefik monitors upstream availability and stops routing to unhealthy targets automatically.

### Routing Model
- Each workspace receives a unique subdomain (e.g., `<workspace-id>.devsanctum.io`).
- On deployment, the backend registers a Traefik `Router` (matching rule on the subdomain) and a `Service` (pointing to the container host + port) via the Traefik API.
- TLS is activated per router via a `tls` block and ACME resolver.

### Request Flow
1. A client requests `workspace-abc.devsanctum.io`.
2. Traefik matches the host rule for that subdomain.
3. Traefik forwards the request (HTTP or WebSocket) to the registered container endpoint.
4. TLS is terminated at Traefik — the upstream connection can be plain HTTP inside the private network.
5. Response is returned to the client.

### Lifecycle Integration
- On workspace creation:
  - Backend starts the container via dockerode.
  - Backend POSTs a new router + service configuration to the Traefik API.
  - Traefik begins routing traffic immediately.

- On workspace stop/destroy:
  - Backend tears down the container via dockerode.
  - Backend DELETEs the router and service from the Traefik API.
  - Traefik stops routing traffic to that target immediately.

### Backend Integration
- A dedicated `src/infrastructure/proxy/traefik.adapter.ts` encapsulates all Traefik API calls.
- The service layer calls this adapter through a `ProxyProvider` interface, keeping Traefik as a replaceable implementation detail.

## Suggested Folder Structure (Backend)
- `src/controllers` – HTTP controllers
- `src/services` – application/business services
- `src/models` – domain models and DTOs
- `src/repositories` – persistence access abstractions/implementations
- `src/infrastructure/docker` – dockerode adapters
- `src/infrastructure/proxy` – reverse-proxy integration adapters
- `src/routes` – API route definitions
- `src/middlewares` – auth, validation, error handling
- `src/config` – environment and runtime configuration

## Non-Functional Priorities
- **Simplicity first**: minimal operational complexity.
- **Reliability**: deterministic routing and idempotent deployment operations.
- **Observability**: logs and metrics around container lifecycle and proxy routing.
- **Security baseline**: strong tenant isolation at routing and container levels.
