# Page Spec: Admin — Audit Logs (`/admin/audit-logs`)

Auth required: **admin only** — non-admin authenticated users are redirected to `/dashboard`. Unauthenticated visitors are redirected to `/login?redirect=/admin/audit-logs`.

Primary goal: let administrators review the full platform event history, filter by actor/resource/action, inspect event details, and export logs for compliance.

Shell & navigation: see **[navigation.md](navigation.md) §4**. **Audit Logs** is the active admin sidebar item.

Related spec: [specs/features/admin/audit-logs.md](../features/admin/audit-logs.md) (event taxonomy, data model, use cases).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Topbar                                             [Avatar ▾]  │
├──────────────────┬──────────────────────────────────────────────┤
│  ← Back to app  │  Admin / Audit Logs              [ ↓ Export ]│
│  ADMINISTRATION  │                                              │
│  Overview        │  ┌── Filters ─────────────────────────────┐ │
│  INFRASTRUCTURE  │  │ [Search…]  Actor ▾  Resource ▾  Date ▾ │ │
│  Docker Servers  │  └────────────────────────────────────────┘ │
│  Templates       │                                              │
│  Features        │  ┌──────────────────────────────────────┐   │
│  PEOPLE          │  │  Time   Actor   Action   Resource  ▸  │   │
│  Users           │  │  ────────────────────────────────────   │   │
│  Groups          │  │  [row]                              ▸  │   │
│  Invitations     │  │  [row]                              ▸  │   │
│  PLATFORM        │  └──────────────────────────────────────┘   │
│  Audit Logs ◄    │  Showing 1–25 of 1 042   [ ← ] [ → ]       │
│  Configuration   │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

Page root: `PageLayout` with the admin sidebar (see [navigation.md](navigation.md) §4). **Audit Logs** is the active admin sidebar item.

---

## 2. Section: Page Header & Toolbar

- **Breadcrumb**: `Admin / Audit Logs` — `Admin` links to `/admin`.
- **Page heading** (h1): `"Audit Logs"`
- **`↓ Export` button** (default, `DownloadIcon`): triggers a CSV download of the current filter results (up to 10 000 rows). Shows a `Spinner` while the server prepares the file.

### Filters

| Filter | Component | Options |
|--------|-----------|---------|
| Search | `TextInput` | Full-text search on action key and resource name. Debounced 500 ms. |
| Actor | `Select` | `All actors` + one entry per unique actor (user name + email). |
| Resource type | `Select` | `All resources`, `User`, `Project`, `Workspace`, `Template`, `Feature`, `DockerServer`, `Invitation`, `PlatformConfig`. |
| Date range | Two `DatePicker` inputs (From / To) | Defaults to last 7 days. |

URL query params kept in sync for shareable / reloadable filter state.

---

## 3. Section: Audit Log Table

25 rows per page, sorted by `createdAt` descending.

### Columns

| Column | Content |
|--------|---------|
| Time | Absolute timestamp (local timezone). Relative ("3 min ago") on hover via `Tooltip`. |
| Actor | `Avatar` (16 px) + user name. `"System"` for automated events (no avatar). |
| Action | Human-readable label (e.g. `"Stopped workspace"`, `"Changed platform config"`). Bold. |
| Resource | Resource type + name (e.g. `"Workspace ws-alpha"`, `"User john@example.com"`). Linked to the resource's admin page when the resource still exists. `fg.muted` when the resource has been deleted. |
| Expand | `▸` chevron button — expands the row to show full metadata (section 4). |

### Loading state
Ten skeleton rows.

### Empty state (no logs matching filters)
`Blankslate` — `"No audit log entries match your filters."` + `Clear filters` button.

### Empty state (no logs at all)
`"No audit events have been recorded yet."` — neutral, no CTA.

---

## 4. Expanded Row: Event Details

Clicking `▸` expands the row into a sub-row showing the raw event metadata in a structured format:

```
┌────────────────────────────────────────────────────────────────┐
│  Event ID:   3f7a-…                                            │
│  IP:         192.168.1.42                                       │
│  Actor role: ADMIN                                              │
│  Resource ID: 9b2c-…                                           │
│  Metadata:                                                      │
│  {                                                              │
│    "field": "registrationMode",                                 │
│    "from":  "OPEN",                                             │
│    "to":    "INVITE_ONLY"                                       │
│  }                                                              │
└────────────────────────────────────────────────────────────────┘
```

- Metadata is rendered as pretty-printed JSON in a monospace font inside a `Box` with `canvas.subtle` background.
- Long JSON is scrollable within the sub-row (max-height 200 px, `overflow-y: auto`).
- A `Copy` icon button copies the raw JSON to clipboard.

---

## 5. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| List audit logs | `GET /api/v1/admin/audit-logs?search=&actorId=&resource=&from=&to=&page=&limit=25` | Returns entries with actor name, action label, resource info. |
| Export CSV | `GET /api/v1/admin/audit-logs/export?<same filters>` | Returns a `text/csv` response. |
