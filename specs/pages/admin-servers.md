# Page Spec: Admin — Docker Servers (`/admin/servers`)

Auth required: **admin only** — non-admin authenticated users are redirected to `/dashboard`. Unauthenticated visitors are redirected to `/login?redirect=/admin/servers`.

Primary goal: let an administrator register Docker daemon hosts, monitor their health and resource usage, manage group assignments, inspect running workspaces, and remove servers.

Shell & navigation: see **[navigation.md](navigation.md) §4**. **Docker Servers** is the active admin sidebar item.

Related spec: [specs/features/docker-servers.md](../features/docker-servers.md) (full domain model, server selection algorithm, resource polling).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Topbar                                             [Avatar ▾]  │
├──────────────────┬──────────────────────────────────────────────┤
│  ← Back to app  │  Admin / Docker Servers                      │
│  ADMINISTRATION  │                                              │
│  Overview        │  ┌── Status filter ──────────────────┐     │
│  INFRASTRUCTURE  │  │  All ▾                            │     │
│  Docker Srvrs ◄  │  └───────────────────────────────────┘     │
│  Templates       │                       [ + Add server ]      │
│  Features        │  ┌────────────────────────────────────┐    │
│  PEOPLE          │  │  Name  Host  Status  RAM  Disk  ⋯  │    │
│  Users           │  │  ──────────────────────────────     │    │
│  Groups          │  │  [row]                              │    │
│  Invitations     │  │  [row]                              │    │
│  PLATFORM        │  └────────────────────────────────────┘    │
│  Audit Logs      │                                              │
│  Configuration   │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

Page root: `PageLayout` with the admin sidebar (see [navigation.md](navigation.md) §4). **Docker Servers** is the active admin sidebar item.

---

## 2. Section: Page Header & Toolbar

- **Breadcrumb**: `Admin / Docker Servers` — `Admin` links to `/admin`.
- **Page heading** (h1): `"Docker Servers"`
- **`+ Add server` button** (primary, `PlusIcon`): opens the Add Server drawer (section 4).
- **Status filter** (`Select`): `All statuses`, `Online`, `Offline`, `Unreachable`. Defaults to `All statuses`. Filters the table client-side.

---

## 3. Section: Server Table

### Columns

| Column | Content | Notes |
|--------|---------|-------|
| Name | Server label, bold. Clicking opens the Server Detail panel (section 5). | — |
| Host : Port | `host:port` in monospace, `fg.muted` | — |
| TLS | `LockIcon` when TLS is enabled, `—` otherwise | — |
| Status | `Label` badge — `ONLINE` (`success`), `OFFLINE` (`attention`), `UNREACHABLE` (`danger`) | Auto-refreshed every 30 s |
| CPU | Core count (e.g. `8 cores`). `—` when offline or stale. | — |
| RAM | Compact `ProgressBar` + `used / total` text (e.g. `6.2 / 16 GB`). Bar colour: < 70% `success.emphasis`, 70–90% `attention.emphasis`, > 90% `danger.emphasis`. | Stale indicator when > 2× polling interval |
| Disk | Same `ProgressBar` pattern as RAM. `used / total` in GB. | Stale indicator when > 2× polling interval |
| Workspaces | `CounterLabel` — number of RUNNING workspaces on this server. Clicking opens the Workspaces panel (section 6). `0` shown as muted text. | — |
| Actions | `ActionMenu` (`⋯`) per row | See below |

### Resource stale indicator

When `resourcesUpdatedAt` is older than 2× the polling interval, the RAM and Disk cells show a `⏱` icon. Hovering reveals a `Tooltip`: `"Resource data may be outdated — last updated <relative time>."` The cells are rendered with `fg.muted` colour to visually signal staleness.

### Row action menu (`⋯`)

| Action | Condition | Behaviour |
|--------|-----------|-----------|
| **Test connection** | Always | Runs connectivity test inline (see section 7). |
| **View workspaces** | Always | Opens the Workspaces panel (section 6). |
| **Manage groups** | Always | Opens the Manage Groups dialog (section 8). |
| **Edit** | Always | Opens the Edit Server drawer (section 4) pre-filled. |
| **Remove** | `activeWorkspaces === 0` | Opens the Remove confirmation dialog (section 9). |

**Remove** is shown as disabled with a `Tooltip` — `"Stop or migrate all N running workspaces before removing this server."` — when `activeWorkspaces > 0`.

### Loading state
Five skeleton rows matching the table row height.

### Empty state (no servers)
`Blankslate` with `ServerIcon`:
- Heading: `"No Docker servers registered."`
- Description: `"Add a Docker daemon host to enable workspace deployments."`
- CTA: `+ Add server` (primary).

### Empty state (filter active, no matches)
`Blankslate` — `"No servers match the selected status."` + `Clear filter` link.

### Error state
`Flash variant="danger"` replacing the table — `"Could not load servers."` + **Retry** button.

---

## 4. Drawer: Add / Edit Server

Opens as a right-side panel. Title: `"Add server"` (new) or `"Edit <server name>"` (edit).

### Fields

| Field | Component | Rules |
|-------|-----------|-------|
| Name | `TextInput` | Required. 2–64 chars. Unique across servers. |
| Host | `TextInput` | Required. Hostname or IP address. |
| Port | `TextInput` (type number) | Required. Default: `2376`. 1–65535. |
| TLS enabled | `Checkbox` | Default: off. When on, reveals the three certificate fields. |
| CA Certificate | `Textarea` | Shown when TLS on. Required when TLS on. PEM format. |
| Client Certificate | `Textarea` | Shown when TLS on. Required when TLS on. PEM format. |
| Client Key | `Textarea` | Shown when TLS on. Required when TLS on. PEM format. |

### Test connection button

A `Button variant="default"` (`"Test connection"`) is available below the fields at any time — including before saving. It sends current form values to `POST /api/v1/admin/servers/test` and shows inline feedback:

- **Running**: spinner + `"Testing connection…"` label, button disabled.
- **Success**: `Flash variant="success"` inline — `"Docker daemon reachable. Version: X.X.X"`.
- **Failure**: `Flash variant="danger"` inline — specific error: `"Connection refused"`, `"TLS handshake failed"`, `"Timeout"`, etc.

Test result feedback clears when any field is modified.

### Save behaviour

- New server: `POST /api/v1/admin/servers`. On success: drawer closes, new row appears in the table (optimistic insert), `Flash variant="success"` — `"Server <name> added."` (auto-dismisses 5 s).
- Edit: `PATCH /api/v1/admin/servers/:id`. On success: drawer closes, row updates, same flash.
- On error: `Flash variant="danger"` inside the drawer; form state preserved.

### Cancel behaviour

Dirty-state guard: if any field was changed, show a `Dialog` — `"Discard unsaved changes?"` — before closing. Clean form closes immediately.

---

## 5. Panel: Server Detail

Opens as a right-side `PageLayout.Pane` (or full-screen `Dialog` on mobile) when the server name is clicked in the table.

**Title**: `<server name>` + status badge.

### Subsection: Connection info

Read-only list:
- Host : Port (monospace)
- TLS: enabled / disabled
- `Edit server →` link — opens the Edit drawer.

### Subsection: Resource gauges

Auto-refreshes every 30 s. Each gauge:

```
CPU    8 cores
RAM    ████████░░  6.2 GB / 16 GB  (38%)
Disk   ███████░░░  120 GB / 500 GB (24%)
```

- `ProgressBar` with colour thresholds (same as table).
- `"Last polled: 30 seconds ago"` timestamp.
- `Refresh now` button (`Button variant="default" size="small"`) — calls `POST /api/v1/admin/servers/:id/refresh-metrics` and updates the gauges.
- Stale banner: `Flash variant="warning"` — `"Resource data is stale. The server may be unreachable."` — when `resourcesUpdatedAt > 2× polling interval`.

### Subsection: Groups

List of groups this server is currently assigned to.

Each row: group name + `Unassign` button (`Button variant="danger" size="small"`). Clicking asks `"Remove <server> from <group>?"` (inline confirm, not a full dialog) then calls `DELETE /api/v1/admin/servers/:id/groups/:groupId`.

Below the list:
`Assign to group` — a searchable `ActionMenu` listing groups not yet assigned. Selecting one calls `POST /api/v1/admin/servers/:id/groups`.

Empty state: `"Not assigned to any group. Workspaces cannot be deployed to this server until it is assigned to at least one group."` — styled as a `Flash variant="warning"`.

### Subsection: Running workspaces

See section 6 — the same workspace list is embedded here.

---

## 6. Panel: Running Workspaces

Accessible from the **Workspaces** counter in the table row and from the Server Detail panel.

**Title**: `"Workspaces on <server name>"` + RUNNING count badge.

### Workspace list

Each row:

| Field | Detail |
|-------|--------|
| Workspace name | Linked to `/projects/:projectId` (admin can navigate to the project) |
| Project | Project name, `fg.muted` |
| Owner | Avatar (20 px) + username |
| Branch badge | `Label` secondary |
| Status badge | `RUNNING` (`success`), transient states with spinner |
| Started | Relative time (e.g. `"2 hours ago"`) |
| Inactivity timer | `"Stops in 45 m"` — red when < 15 min. Hidden if pinned. |
| Pin indicator | 📌 if `pinned = true` |

No actions available in this panel — it is read-only for the server admin view.

### Empty state
`"No workspaces are currently running on this server."`

### Loading state
Three skeleton rows.

---

## 7. Inline: Connectivity Test

Triggered from the row `⋯` menu → **Test connection**.

The row expands below to show a temporary status strip:

```
⟳ Testing connection to 192.168.1.10:2376…
```

On result:
- **Success**: `🟢 Docker daemon reachable — Version 26.1.0` (auto-collapses after 5 s).
- **Failure**: `🔴 Unreachable — Connection refused` (stays until dismissed with `×`).

The server's `Status` badge in the row updates immediately to reflect the result.

---

## 8. Dialog: Manage Groups

Triggered from the row `⋯` menu → **Manage groups**.

**Title**: `"Groups — <server name>"`

A searchable list of all platform groups with a checkbox per row. Groups the server already belongs to are pre-checked. Divided into two sections: `Assigned` (checked) and `Available` (unchecked).

- On save: `PUT /api/v1/admin/servers/:id/groups` with the full list of selected group IDs (full replacement).
- On success: dialog closes, the group assignments update in the Server Detail panel if open.
- On error: `Flash variant="danger"` inside the dialog.

---

## 9. Dialog: Remove Server

Triggered from `⋯` → **Remove** (only when `activeWorkspaces === 0`).

**Title**: `"Remove <server name>?"`

```
This will permanently delete this server configuration.
Workspace history for workspaces that ran on this server is preserved.

Type the server name to confirm:
[___________________]

                  [ Cancel ]   [ Remove server ]
```

- `Remove server` button (danger) disabled until the typed name matches `server.name` exactly.
- On confirm: `DELETE /api/v1/admin/servers/:id`.
- On success: dialog closes, row removed from table optimistically, `Flash variant="success"` — `"Server <name> removed."` (auto-dismisses 5 s).
- On error: `Flash variant="danger"` inside the dialog.

---

## 10. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| List servers | `GET /api/v1/admin/servers` | Returns all servers with current status, resource metrics, workspace count, and group list. |
| Get server | `GET /api/v1/admin/servers/:id` | Full detail for the panel. |
| Create server | `POST /api/v1/admin/servers` | Admin only. |
| Update server | `PATCH /api/v1/admin/servers/:id` | Admin only. |
| Remove server | `DELETE /api/v1/admin/servers/:id` | Returns 409 if active workspaces exist. |
| Test connectivity | `POST /api/v1/admin/servers/test` `{ host, port, tls?, caCert?, clientCert?, clientKey? }` | Accepts form values before save. |
| Refresh metrics | `POST /api/v1/admin/servers/:id/refresh-metrics` | Forces immediate resource poll. |
| List running workspaces | `GET /api/v1/admin/servers/:id/workspaces?status=RUNNING` | Admin only. |
| Update group assignments | `PUT /api/v1/admin/servers/:id/groups` `{ groupIds }` | Full replacement. |
| Assign to single group | `POST /api/v1/admin/servers/:id/groups` `{ groupId }` | Used by the inline assign dropdown. |
| Remove from group | `DELETE /api/v1/admin/servers/:id/groups/:groupId` | Used by the inline unassign button. |

---

## 11. UX Notes

- The server table auto-refreshes status and resource metrics every **30 seconds** in the background. No page reload, no user action required.
- The refresh is paused when the browser tab is hidden to avoid unnecessary polling.
- Resource cells that cannot be computed (server offline, never polled) show `—` rather than a zero bar.
- Group assignment is the controlling factor for workspace deployment eligibility. The empty-groups warning in the Server Detail panel is critical — an ungrouped server is invisible to the deployment algorithm.
- The connectivity test in the drawer works with unsaved form values — the admin can verify credentials before committing.
- Removal confirmation requires typing the server name (not just clicking OK) because removing a server permanently deletes TLS credentials which cannot be recovered.
