# Admin Feature: Audit Logs

## Purpose
Provide administrators with a complete, tamper-evident record of significant actions performed on the platform. Audit logs support security reviews, incident investigation, and compliance requirements.

---

## Logged Events

### Authentication
- User registered (method: local / GitHub / Google)
- User logged in / failed login attempt
- User logged out
- Password reset requested / completed
- Account deactivated / reactivated

### User Management
- User role changed (by whom, from → to)
- User deleted
- Admin impersonation started / ended (future)

### Invitation
- Invitation sent (to email, by admin)
- Invitation accepted (account created)
- Invitation revoked

### Project
- Project created / updated / deleted
- Project visibility changed (public ↔ private)
- Member added / removed / role changed

### Workspace
- Workspace created / started / stopped / destroyed
- Workspace pinned / unpinned / kept
- Workspace visibility changed

### Administration
- Platform configuration changed (which setting, old → new value)
- Docker server added / edited / removed
- Template created / updated / deleted
- Feature created / updated / deleted
- SMTP credentials updated
- OAuth provider enabled / disabled

---

## Data Model

Each audit log entry stores:

| Field       | Type      | Description                                           |
|-------------|-----------|-------------------------------------------------------|
| `id`        | `uuid`    | Unique identifier                                     |
| `actorId`   | `uuid`    | User who performed the action (null for system jobs)  |
| `actorRole` | `string`  | Role of the actor at time of action                   |
| `action`    | `string`  | Namespaced action key (e.g. `workspace.stopped`)      |
| `resource`  | `string`  | Resource type (e.g. `Workspace`, `User`, `Project`)   |
| `resourceId`| `string`  | ID of the affected resource                           |
| `metadata`  | `json`    | Additional context (diff of changed fields, IP, etc.) |
| `ip`        | `string`  | IP address of the request                             |
| `createdAt` | `datetime`| Timestamp of the event                                |

Logs are append-only. No log entry can be edited or deleted through the platform.

---

## Use Cases

### UC-1: Browse audit logs
The admin views a chronological list of all platform events, newest first.

### UC-2: Filter by actor, resource, or action
The admin filters logs by user, resource type, action type, or date range to narrow down specific events.

### UC-3: View event details
The admin expands a log entry to see the full metadata (e.g. which fields changed, the user's IP, relevant IDs).

### UC-4: Export logs
The admin exports the filtered log results as CSV for external archiving or compliance reporting.

---

## UI/UX

### Audit Log Page (`/admin/audit-logs`)
- Full-width table, newest first, paginated.
- Columns: **Timestamp**, **Actor** (avatar + name), **Action** (namespaced badge), **Resource** (type + ID link), **IP**.
- Filter bar above the table:
  - Date range picker.
  - Actor search (user name or email).
  - Resource type dropdown.
  - Action type dropdown.
- Each row is expandable to show the full `metadata` JSON in a formatted viewer.
- **Export CSV** button (top right, applies current filters).

### Event Badge Colors
- Auth events: blue
- User management: purple
- Project events: teal
- Workspace events: green
- Admin/config events: orange
- System events (no actor): gray

### Empty and error states
- No results: "No events match the current filters."
- Load error: "Failed to load audit logs. Try refreshing."
