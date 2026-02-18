# Feature: Docker Servers

## Purpose
Allow platform administrators to register and manage Docker daemon hosts. These hosts are used to provision workspace containers. Multiple servers can be registered to distribute workloads or support different environments.

Each registered server is continuously monitored for resource usage (CPU cores, RAM, disk). Projects can be assigned one or more Docker servers. When a workspace is deployed, the platform selects the server with the most available resources among those assigned to the project, ensuring even load distribution.

---

## Use Cases

### UC-1: Register a Docker server
An admin provides the host address, port, and optional TLS credentials. The platform saves the server configuration and performs an initial connectivity check.

### UC-2: Test server connectivity
Before or after registration, the admin can trigger a connectivity test. The platform attempts to connect to the Docker daemon and reports the result (success, unreachable, TLS error).

### UC-3: List all Docker servers
The admin sees all registered servers with their current status (`ONLINE`, `OFFLINE`, `UNREACHABLE`).

### UC-4: Edit a Docker server
The admin updates the host, port, or TLS credentials of an existing server.

### UC-5: Remove a Docker server
The admin removes a server. If active workspaces are running on it, the platform warns and prevents deletion until those workspaces are stopped or migrated.

### UC-6: View server usage
The admin sees how many workspaces are currently running on each server.

### UC-7: Monitor server resources
The platform periodically polls each `ONLINE` Docker server via dockerode to collect:
- **CPU cores** — total logical CPU count.
- **RAM** — total memory and currently used memory in MB.
- **Disk** — total disk capacity and used disk space in GB (Docker root directory).

Metrics are stored on the `DockerServer` record and updated at each polling interval. A `resourcesUpdatedAt` timestamp tracks data freshness. If a server becomes unreachable, its resource data is preserved but shown as stale.

### UC-8: Assign Docker servers to a project
A project manager assigns one or more registered Docker servers to a project. When deploying a workspace, the platform automatically picks the assigned server with the greatest available RAM (or lowest CPU pressure) to balance load across the pool.

---

## UI/UX

### Server List Page (`/admin/servers`)
- Table layout with columns: **Name**, **Host**, **Port**, **TLS**, **Status**, **Active Workspaces**, **CPU**, **RAM**, **Disk**, **Actions**.
- Status shown as a colored badge: green (`ONLINE`), yellow (`OFFLINE`), red (`UNREACHABLE`).
- Resource columns display compact usage bars:
  - **CPU**: core count (e.g. `8 cores`).
  - **RAM**: mini progress bar — used / total in human-readable units (e.g. `6.2 GB / 16 GB`).
  - **Disk**: mini progress bar — used / total (e.g. `120 GB / 500 GB`). Bar turns orange above 80%, red above 90%.
- Resource cells show a stale indicator (clock icon + last-updated tooltip) if `resourcesUpdatedAt` is older than 2 polling intervals.
- CTA button: **+ Add Server** (top right).
- Row actions: **Test connection**, **Edit**, **Delete**.
- Delete is disabled (grayed out with tooltip) when the server has active workspaces.

### Add / Edit Server Drawer or Modal
- Fields:
  - **Name** (label for identification)
  - **Host** (hostname or IP)
  - **Port** (default: 2376)
  - **TLS Enabled** (toggle)
  - **CA Certificate** (textarea, shown when TLS enabled)
  - **Client Certificate** (textarea, shown when TLS enabled)
  - **Client Key** (textarea, shown when TLS enabled)
- CTA: **Save** | **Test connection** (secondary, runnable before saving).
- Inline feedback after test: success message or error details.

### Server Detail / Monitoring Panel
Clickable from any row in the list. Shows:
- Connection info (host, port, TLS).
- Current status badge.
- **Resource gauges** (large, real-time auto-refreshed):
  - CPU cores available.
  - RAM usage bar with exact values (used / total).
  - Disk usage bar with exact values (used / free / total).
- Last polled timestamp with a **Refresh now** button.
- List of workspaces currently running on this server (name, project, user, status).

### Connectivity Test Feedback
- Running state: spinner with "Testing connection…"
- Success: green checkmark, "Docker daemon reachable. Version: X.X.X"
- Failure: red icon, specific error message (e.g. "Connection refused", "TLS handshake failed").

### Resource Stale State
- If metrics have not been refreshed within 2× the polling interval, resource cells are grayed out with a tooltip: "Resource data may be outdated. Last updated: \<timestamp\>".
- The server detail panel shows a banner: "Resource data is stale. The server may be unreachable."
