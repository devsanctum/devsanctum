# Page Spec: Admin Overview (`/admin`)

Auth required: **admin only** — non-admin authenticated users are redirected to `/dashboard`. Unauthenticated visitors are redirected to `/login?redirect=/admin`.

Primary goal: give administrators an at-a-glance view of platform health — registered users, server status, active workspaces, and outstanding invitations — with direct links to the relevant management pages.

Shell & navigation: see **[navigation.md](navigation.md) §4**. **Overview** is the active admin sidebar item.

Related pages: [dashboard.md](dashboard.md) (user-facing dashboard), [admin-servers.md](admin-servers.md), [admin-users.md](admin-users.md), [admin-invitations.md](admin-invitations.md).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Topbar                                             [Avatar ▾]  │
├──────────────────┬──────────────────────────────────────────────┤
│  ← Back to app  │  Administration                              │
│  ADMINISTRATION  │                                              │
│  Overview   ◄    │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐   │
│  INFRASTRUCTURE  │  │stats │  │stats │  │stats │  │stats │   │
│  Docker Servers  │  └──────┘  └──────┘  └──────┘  └──────┘   │
│  Templates       │                                              │
│  Features        │  ── Server Status ───────────────────────── │
│  PEOPLE          │  ┌────────┐  ┌────────┐  ┌────────┐        │
│  Users           │  │srv card│  │srv card│  │srv card│  …     │
│  Groups          │  └────────┘  └────────┘  └────────┘        │
│  Invitations     │                                              │
│  PLATFORM        │  ── Recent Activity ─────────────────────── │
│  Audit Logs      │  [row] actor · action · resource · time     │
│  Configuration   │  [row] …                                     │
└──────────────────┴──────────────────────────────────────────────┘
```

Page root: `PageLayout` with the admin sidebar (see [navigation.md](navigation.md) §4). **Overview** is the active admin sidebar item.

---

## 2. Section: Platform Summary Tiles

Four stat tiles in a row, each a bordered `Box` with a large number and a descriptive label.

| Tile | Value | Colour rule | Link |
|------|-------|-------------|------|
| **Users** | Total registered users | Always neutral | → `/admin/users` |
| **Servers** | `N online / total` | Red tile border when any server `OFFLINE` or `UNREACHABLE` | → `/admin/servers` |
| **Active workspaces** | Total `RUNNING` workspaces | Neutral | — |
| **Pending invitations** | Count of `PENDING` invitations | Amber when > 0 | → `/admin/invitations` |

All tiles are clickable (full tile is a link, `cursor: pointer`). Auto-refreshed every 30 s.

---

## 3. Section: Server Status

Compact server cards — one per registered Docker server, same design as the server cards in [dashboard.md](dashboard.md) §3 but always shown in full (no group-access filtering).

Ordered by status: `OFFLINE`/`UNREACHABLE` first (attention-drawing), then `ONLINE` alphabetically.

If no servers are registered yet, an inline `Flash variant="warning"`: `"No Docker servers registered. Workspaces cannot be deployed until at least one server is added."` with a `+ Add server →` link to `/admin/servers`.

---

## 4. Section: Recent Platform Activity

The last **10 audit log entries** across all resources, newest first.

Each row:

| Field | Detail |
|-------|--------|
| Actor | `Avatar` (16 px) + user name, or `"System"` for automated jobs |
| Action | Human-readable action label (e.g. `"stopped workspace"`, `"changed platform configuration"`) |
| Resource | Resource type + name (e.g. `"Workspace ws-alpha"`) |
| Time | Relative ("3 min ago"), absolute on hover |

A `"View all →"` link at the bottom navigates to `/admin/audit-logs`.

### Loading state
Ten skeleton rows.

---

## 5. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| Platform stats | `GET /api/v1/admin/stats` | Returns `{ userCount, serverCount, onlineServerCount, runningWorkspaceCount, pendingInvitationCount }` |
| Server list | `GET /api/v1/admin/servers` | Same as server list; include resource metrics for the cards. |
| Recent audit logs | `GET /api/v1/admin/audit-logs?limit=10` | Newest 10 entries. |
