# Feature: Workspaces

## Purpose
A workspace is a live, isolated development environment deployed as a Docker container (or set of containers) from a project. It is bound to a specific Git branch, runs on a registered Docker server, and is accessible via a dedicated URL. Workspaces have a full lifecycle with automatic inactivity management.

---

## Use Cases

### UC-1: Deploy a workspace
A user with `DEPLOY` or higher access selects a project, picks a branch from any of the project's repositories, and optionally provides a name. The platform provisions the workspace container(s) on a Docker server, registers the routing rule, and returns the workspace URL.

### UC-2: List workspaces for a project
Any member of the project sees the list of workspaces: their own and (if `MANAGE`) others'.

### UC-3: Access a workspace
The user opens the workspace URL. The reverse proxy routes the request to the running container. The workspace exposes one or more services (web app, terminal, etc.) accessible from the browser.

### UC-4: Stop a workspace
The user manually stops a running workspace. The container is paused or stopped. The routing rule is disabled.

### UC-5: Start a stopped workspace
The user restarts a previously stopped workspace. The container is started again. The routing rule is re-enabled.

### UC-6: Pin a workspace
The user marks the workspace as pinned. Pinned workspaces are exempt from the 2-hour inactivity stop and the 7-day auto-destroy policy.

### UC-7: Unpin a workspace
The user unpins a workspace. Auto-stop and auto-destroy timers resume from that moment.

### UC-8: Keep a workspace
The user marks a workspace as "kept". The 7-day auto-destroy policy is suspended, but the 2-hour inactivity stop still applies.

### UC-9: Destroy a workspace
The user permanently destroys the workspace. All containers are removed. The routing rule is deleted. This action is irreversible.

### UC-10: Auto-stop on inactivity
A background job monitors `lastActivityAt`. If a non-pinned workspace has had no activity for 2 hours, it is automatically stopped.

### UC-11: Auto-destroy on expiry
A background job checks `destroyAt`. If a non-pinned, non-kept workspace reaches its destroy date (7 days from creation), it is automatically destroyed.

### UC-12: View workspace services
The user sees all services exposed by their workspace (name, protocol, port, direct URL).

### UC-13: Make a workspace public or private
The owner of the workspace toggles its visibility. A public workspace URL is accessible without authentication.

---

## UI/UX

### Workspace List (inside Project Detail → Workspaces Tab)
- Table or card list. Columns: **Name**, **Branch**, **Status**, **Pinned**, **Created**, **Expires**, **Actions**.
- Status badge: `RUNNING` (green), `STOPPED` (gray), `STARTING` / `STOPPING` (yellow spinner), `DESTROYED` (red dimmed).
- Pin icon toggle (pin/unpin inline).
- Keep icon toggle (keep/un-keep inline).
- Actions per row: **Open**, **Stop / Start**, **Destroy**.
- CTA: **+ Deploy Workspace** (top right).

### Deploy Workspace Modal
- Fields:
  - **Name** (auto-generated suggestion, editable)
  - **Branch** (dropdown or searchable input, lists branches from all project repositories)
  - **Docker Server** (dropdown showing online servers, auto-selected if only one)
  - **Visibility** (toggle: Private / Public)
- CTA: **Deploy**.
- After clicking: the modal shows a progress log (streaming provisioning output), then transitions to a success state with the workspace URL.

### Workspace Detail Page (`/workspaces/:id`)
- Header: workspace name, project link, branch badge, status badge, visibility badge.
- Action bar: **Open workspace**, **Stop / Start**, **Pin / Unpin**, **Keep / Un-keep**, **Destroy** (danger, with confirmation).
- **Services** section: card list of available services (name, URL, protocol, port, **Open** link).
- **Info** section: Docker server, creation date, last activity, scheduled stop/destroy times.

### Inactivity and Lifecycle Indicators
- If the workspace is not pinned, show a live countdown to auto-stop below the status badge:
  > "Stops in 1h 42m due to inactivity — **Pin to prevent**"
- If the workspace is not kept, show a separate expiry indicator:
  > "Auto-destroys in 5 days — **Keep to prevent**"
- If pinned: both indicators are replaced by a "Pinned — no auto-shutdown" notice.

### Workspace URL and Services
- Each service gets a subdomain:
  `<workspace-id>-<port>.<platform-domain>`
- The **Open** button opens the service URL in a new tab.
- For `HTTP` services: direct browser link.
- For `TCP` services: show connection details (host + port) to use in a client.

### Workspace Destruction Confirmation
- Confirmation modal with the workspace name typed to confirm.
- Warning: "This action is irreversible. All container data will be lost."
