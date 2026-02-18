# Feature: Routing

## Purpose
The platform exposes each workspace through a unique domain or subdomain. Routing is handled by Traefik as the reverse-proxy data plane, driven dynamically by the backend control plane. The routing layer supports HTTP, HTTPS (with automatic TLS), WebSocket, and connections to remote Docker hosts.

---

## Use Cases

### UC-1: Register a route for a new workspace
When a workspace is successfully started, the backend registers a Traefik router and service via the Traefik REST API. This maps the workspace subdomain to the container's host and port on the Docker server.

### UC-2: Remove a route when a workspace stops
When a workspace is stopped or destroyed, the backend removes the corresponding Traefik router and service via the API. Traffic to the subdomain returns 404 or a custom offline page.

### UC-3: Route HTTP traffic to the workspace manager
An incoming HTTP request to `<project-slug>-<workspace-slug>.devsanctum.io` is matched by Traefik and forwarded to the workspace backend manager, which exposes instance info, status, and management APIs.

### UC-3b: Route HTTP traffic to a workspace service
An incoming HTTP request to `<project-slug>-<workspace-slug>-<service>.devsanctum.io` is matched by Traefik and forwarded to the corresponding service port running inside the workspace container (e.g. a dev server, a database UI).

### UC-4: Route WebSocket traffic
WebSocket connections (e.g. to an embedded terminal or live-reload dev server) are transparently proxied by Traefik to the container target, both on the manager subdomain and on service subdomains.

### UC-5: Automatic TLS provisioning
Traefik provisions and renews TLS certificates via ACME (Let's Encrypt) for each workspace subdomain. No manual certificate management is required.

### UC-6: Route to remote Docker host
If the workspace container is running on a remote Docker server (not the same machine as Traefik), Traefik's service upstream URL points to the remote host IP + exposed container port.

### UC-7: Health-check-based routing
Traefik monitors workspace container health. If the container becomes unhealthy, Traefik stops forwarding traffic. The platform updates the workspace status accordingly.

### UC-8: Serve a custom offline page
If a workspace is stopped and a user visits its subdomain, Traefik returns a platform-branded offline page explaining the workspace is inactive and offering a link to restart it.

---

## Technical Behavior

### Principal domain and wildcard DNS
The platform is hosted on a **principal domain** (e.g. `devsanctum.io`). All workspace subdomains are served under this domain. The DNS zone must be configured with a **wildcard record**:

```
*.devsanctum.io  →  <platform IP or load balancer>
```

This single wildcard entry covers every workspace subdomain without requiring individual DNS records per workspace.

### Subdomain convention
Each workspace is assigned a unique subdomain at creation time, composed of two parts:

- **Project slug**: derived from the project name (e.g. `my-app`).
- **Workspace slug**: a short unique slug generated at workspace creation (e.g. `a3k9p`).

The workspace slug is generated once at creation and never changes, ensuring stable URLs even if the project is renamed. The project slug reflects the project name at routing time and is updated if the project is renamed.

Two subdomain patterns are used:

#### Workspace manager subdomain
Points to the workspace backend — instance info, status, management API:

```
<project-slug>-<workspace-slug>.<platform-domain>
```

Example: `my-app-a3k9p.devsanctum.io`

#### Service subdomain
Each service exposed by the workspace (e.g. a dev server, a database UI) gets its own subdomain:

```
<project-slug>-<workspace-slug>-<service>.<platform-domain>
```

Example: `my-app-a3k9p-frontend.devsanctum.io`, `my-app-a3k9p-api.devsanctum.io`

The `<service>` identifier is defined in the workspace or project configuration and corresponds to the service name.

### Traefik dynamic configuration via REST API
The backend uses the Traefik REST API (HTTP provider) to push configuration:

- **Router**: matches on host rule, activates TLS, points to a service.
- **Service**: defines the upstream URL (container host + port).

No Traefik restart is needed. Changes take effect immediately.

### Route lifecycle
| Workspace Status | Traefik Route State         |
|------------------|-----------------------------|
| `STARTING`       | Not yet registered          |
| `RUNNING`        | Router + Service active     |
| `STOPPING`       | Being removed               |
| `STOPPED`        | Router removed or pointing to offline page |
| `DESTROYED`      | Router and Service deleted  |

---

## UI/UX

Routing is mostly invisible to the user — it is automatically managed by the platform during workspace lifecycle events. However, the UI surfaces routing status in the following ways:

### Workspace URL display
- Once a workspace reaches `RUNNING` status, its URL is shown prominently in the workspace detail header.
- Each service card shows its individual access URL.

### Route not ready state
- While the workspace is starting and the route is not yet active, the **Open workspace** button is disabled with a tooltip: "Workspace is starting, URL will be available shortly."

### Offline route feedback
- If a user navigates to a workspace subdomain while the workspace is stopped, they see a platform-branded page:
  > **This workspace is currently stopped.**
  > Last active: \<timestamp\>
  > [Restart workspace] (requires authentication, redirects to platform)

### TLS status (admin view)
- In the admin Docker servers or workspace detail panel, show TLS certificate status (valid, expiring soon, pending).
