# DevSanctum

A simplified self-hosted developer platform for provisioning and accessing containerized development environments.

Inspired by [Coder](https://coder.com/), DevSanctum takes a more straightforward approach: connect it to one or more Docker hosts, define environment templates, and let your team deploy ready-to-use workspaces in seconds — each accessible via its own domain.

---

## What it does

- **Provisions workspaces** as Docker containers on registered Docker hosts.
- **Routes traffic** to each workspace via a domain or subdomain using a dynamic reverse proxy (Traefik).
- **Manages lifecycle** — workspaces auto-stop after inactivity and auto-destroy after expiry, unless pinned or kept.
- **Supports templates** — Alpine Linux + s6-overlay based environment blueprints with APK packages, optional features, environment variables, and exposed services.
- **Online library** — browse and import community templates and features from the official DevSanctum repository (or a custom URL) in one click.
- **Controls access** via user groups assigned to projects and Docker servers with fine-grained roles (`READ`, `DEPLOY`, `MANAGE`).
- **Handles authentication** with local credentials and OAuth2 (GitHub, Google), with optional invitation-only mode.

## Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Backend | Node.js + Fastify |
| ORM | Prisma |
| Database | PostgreSQL |
| Frontend | React |
| Docker SDK | dockerode |
| Workspace base | Alpine Linux + s6-overlay |
| Reverse proxy | Traefik (dynamic HTTP API) |
| Email | Nodemailer (SMTP) |

## Documentation

All project specifications are located in the [`specs/`](specs/) folder.

| Document | Description |
|---|---|
| [`specs/scope.md`](specs/scope.md) | Project purpose, boundaries, and success criteria |
| [`specs/stack.md`](specs/stack.md) | Technology choices and rationale |
| [`specs/architecture.md`](specs/architecture.md) | System architecture, MVC structure, SOLID principles, routing design |
| [`specs/database.md`](specs/database.md) | Full relational data model (15 tables) |
| [`specs/features/`](specs/features/) | Feature specifications with use cases and UI/UX |
| [`specs/features/admin/`](specs/features/admin/) | Administration panel features |

## Library

The [`library/`](library/) folder contains the official collection of ready-to-use templates and features in JSON format.

```
library/
├── features/
│   └── vscode-server.json
└── templates/
    └── nodejs.json
```

The platform can fetch this library directly from GitHub (default) or from any custom URL configured in the admin panel. See [`specs/features/library.md`](specs/features/library.md) for the full spec and JSON schemas.

## License

See [LICENSE](LICENSE).