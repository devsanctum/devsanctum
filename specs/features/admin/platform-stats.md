# Admin Feature: Platform Statistics

## Purpose
Provide aggregated, real-time platform health metrics to administrators. These metrics power the **Admin Overview** stat tiles (`/admin` — see `pages/admin-overview.md` §2) and the **Platform Summary Bar** on the authenticated dashboard (`/dashboard` — see `pages/dashboard.md` §2).

The two consumer pages reference slightly different endpoint paths (`/api/v1/admin/stats` and `/api/v1/admin/summary`); the backend **exposes a single endpoint** at `GET /api/v1/admin/stats` and the frontend aliases it as needed.

---

## Use Cases

### UC-1: Poll platform summary for the admin overview
The Admin Overview page loads and periodically re-polls (every 30 s) the stats endpoint to refresh its four stat tiles: total users, servers online, running workspaces, and pending invitations.

### UC-2: Show summary bar on the authenticated dashboard (admin only)
When an admin opens the dashboard, the platform summary bar renders the same four metrics in a horizontal row above the page heading. It also polls every 30 s.

### UC-3: Surface server health degradation
If any Docker server has status `OFFLINE` or `UNREACHABLE`, the Stats response flags this so the front-end can colour the "Servers" tile red without a separate API call.

---

## API Endpoints

### `GET /api/v1/admin/stats`

**Auth**: required. **Role**: `ADMIN` only — returns `403 Forbidden` for regular users.

**Cache**: the response **may** be cached server-side for up to **10 seconds** to avoid hammering the database when multiple admin tabs are open simultaneously. A `Cache-Control: max-age=10` header is set accordingly.

**Response** (`200 OK`):
```json
{
  "userCount": 0,
  "serverCount": 0,
  "onlineServerCount": 0,
  "hasUnhealthyServer": false,
  "runningWorkspaceCount": 0,
  "pendingInvitationCount": 0
}
```

| Field | Description |
|-------|-------------|
| `userCount` | Total registered users (`isActive = true`). |
| `serverCount` | Total registered Docker servers. |
| `onlineServerCount` | Servers with `status = ONLINE`. |
| `hasUnhealthyServer` | `true` when at least one server has `status = OFFLINE` or `status = UNREACHABLE`. Drives the red colour rule on the Servers tile. |
| `runningWorkspaceCount` | Total workspaces with `status = RUNNING`. |
| `pendingInvitationCount` | Invitations with `status = PENDING` that have not yet expired (`expiresAt > NOW()`). |

**Implementation note**: all counts are derived from single `COUNT(*)` queries on their respective tables; the entire response must be assembled in a single fast aggregation query (or a handful of parallel queries) — not via N+1 calls.

---

## Security

- Endpoint is gated by the admin role check middleware applied to all `/api/v1/admin/*` routes.
- No sensitive data (credentials, tokens, emails) is included in the response.
- The 10-second server-side cache must be **per-user-role**, not shared across users, although in practice this endpoint is admin-only and the data is non-sensitive.
