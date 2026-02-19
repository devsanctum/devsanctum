# Page Spec: My Workspaces (`/workspaces`)

Auth required: **authenticated** — unauthenticated visitors are redirected to `/login?redirect=/workspaces`.

Primary goal: give the user a single view of every workspace they own across all projects, let them manage lifecycle actions, and deploy new ones quickly.

Related pages: [dashboard.md](dashboard.md) (workspaces shown per-project in accordion), [workspace-detail.md](workspace-detail.md) (per-workspace detail).
Related spec: [specs/features/workspaces.md](../features/workspaces.md) (full lifecycle, slug generation, URL scheme).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo · Dashboard · Projects · Workspaces · Explore     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  My Workspaces                          [ + Deploy workspace ]  │
│                                                                  │
│  ┌── Filters ──────────────────────────────────────────────┐   │
│  │ Search by name or branch   Status ▾   Project ▾         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌── Workspace table ──────────────────────────────────────┐   │
│  │  Name  Project  Branch  Status  Server  Activity  ⋯     │   │
│  │  ─────────────────────────────────────────────────────   │   │
│  │  [row]                                                   │   │
│  │  [row]                                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Showing 1–25 of 42   [ ← Prev ]  [ Next → ]                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Section: Page Header & Toolbar

- **Page heading** (h1): `"My Workspaces"`
- **`+ Deploy workspace` button** (primary, `RocketIcon`): opens the Deploy Workspace dialog (section 4).
- **Search input**: filters by workspace name or branch, debounced 300 ms. Applies server-side when paginating.
- **Status filter** (`Select`): `All statuses`, `Running`, `Stopped`, `Starting / Stopping`, `Destroyed`. Defaults to all non-destroyed (destroyed workspaces are hidden by default).
- **Project filter** (`Select`): `All projects` + one entry per project the user has a workspace in.

URL query params (`?search=`, `?status=`, `?project=`, `?page=`) are kept in sync for shareable / reloadable URLs.

---

## 3. Section: Workspace Table

### Columns

| Column | Content | Sortable |
|--------|---------|---------|
| Name | Workspace name, linked to `/workspaces/:slug` (the workspace detail page). Pin 📌 and Keep 🔒 inline icons when active. | No |
| Project | Project name, linked to `/projects/:id` | No |
| Branch | `Label` secondary | No |
| Status | `Label` badge: `RUNNING` (`success`), `STOPPED` (`secondary`), `STARTING`/`STOPPING` (`attention` + animated `Spinner`), `DESTROYED` (`danger`, dimmed row) | No |
| Server | Docker server name, `fg.muted` | No |
| Activity | Relative timestamp of `lastActivityAt` (e.g. `"3 min ago"`). Absolute on `Tooltip` hover. For RUNNING workspaces: inactivity countdown `"Stops in 1h 23m"` in amber when < 30 min, red when < 15 min. Hidden when pinned. | Yes |
| Actions | `ActionMenu` (`⋯`) per row | — |

### Row action menu (`⋯`)

| Action | Condition | Behaviour |
|--------|-----------|-----------|
| **Open** | `RUNNING` | Opens `workspace.slug.<platform-domain>` in a new tab |
| **Stop** | `RUNNING` | Calls `POST /api/v1/workspaces/:id/stop`. Optimistic status update. |
| **Start** | `STOPPED` | Calls `POST /api/v1/workspaces/:id/start`. Optimistic status update. |
| **Pin** | `!pinned` | Calls `PATCH /api/v1/workspaces/:id { pinned: true }`. |
| **Unpin** | `pinned` | Calls `PATCH /api/v1/workspaces/:id { pinned: false }`. |
| **Keep** | `!kept` | Calls `PATCH /api/v1/workspaces/:id { kept: true }`. |
| **Un-keep** | `kept` | Calls `PATCH /api/v1/workspaces/:id { kept: false }`. |
| **View detail** | Always | Navigate to `/workspaces/:slug` |
| **Destroy** | Not `DESTROYED` | Opens Destroy confirmation dialog (section 5). |

Rows with status `STARTING` or `STOPPING` have all action menu items disabled except **View detail**.

### Optimistic updates

Stop, Start, Pin, Unpin, Keep, Un-keep all update the row immediately on click. The `Status` badge changes to the transitional state (`STOPPING`, `STARTING`). If the API call fails, the row rolls back and a `Flash variant="danger"` appears: `"Could not <action> workspace <name>. Try again."`.

### Auto-refresh

When any workspace in the table has a transient status (`STARTING`, `STOPPING`), the table polls every **10 seconds** until all transient statuses resolve.

### Loading state
Five skeleton rows matching the table height.

### Empty state (no workspaces at all)
`Blankslate` with `RocketIcon`:
- Heading: `"No workspaces yet."`
- Description: `"Deploy a workspace from one of your projects to get started."`
- CTA: `+ Deploy workspace` (primary).

### Empty state (filters active, no matches)
`Blankslate` — `"No workspaces match your filters."` + `Clear filters` button.

---

## 4. Dialog: Deploy Workspace

Triggered by `+ Deploy workspace`. Uses a `Dialog`.

### Fields

| Field | Component | Rules |
|-------|-----------|-------|
| Project | `Select` (searchable) | Required. Lists projects where the user has `DEPLOY` or higher access. |
| Branch | `TextInput` with autocomplete | Required. Suggests branches from the selected project's repositories. Free-text allowed for new branches. |
| Name | `TextInput` | Optional. Auto-generated default: `<project-name>-<branch>-<random 4 chars>` (editable). 2–64 chars, URL-safe. |
| Docker server | `Select` | Optional — auto-selects the best eligible server based on resource requirements. A manual override dropdown shows ONLINE servers accessible via the project's groups. Ineligible servers (insufficient RAM/disk) shown disabled with a `Tooltip` explaining the gap. |
| Visibility | `SegmentedControl` or radio: **Private** / **Public** | Default: Private. |

When the **Project** field changes, Branch and Docker Server reset.

### Live eligibility check

After Project is selected, the dialog fetches `GET /api/v1/projects/:id/deploy-eligibility` and shows either:
- A green `Flash variant="success"` inline: `"Ready to deploy — 2 servers available."`
- An amber `Flash variant="warning"`: `"Only 1 server has sufficient resources."`
- A red `Flash variant="danger"`: `"No eligible servers. This project requires X MB RAM and Y GB disk — no available server meets this requirement."` The **Deploy** button is disabled.

### Deploy behaviour

1. On submit: `POST /api/v1/workspaces` — button shows `Spinner` + `"Deploying…"`, disabled.
2. The dialog transitions to a **provisioning view** (the form is replaced):

```
┌──────────────────────────────────────────────────────┐
│  Deploying workspace…                                 │
│                                                       │
│  ⟳ Pulling image alpine:3.21…                        │
│  ✓ Installing APK packages…                           │
│  ✓ Running Docker instructions…                       │
│  ⟳ Starting s6 services…                             │
│                                                       │
│  Elapsed: 00:23                                       │
└──────────────────────────────────────────────────────┘
```

Provisioning log lines are streamed via SSE (`GET /api/v1/workspaces/:id/logs`).

3. On success, the dialog transitions to a **success view**:

```
┌──────────────────────────────────────────────────────┐
│  ✓ Workspace ready                                    │
│                                                       │
│  my-project-main-k4x8                                 │
│  k4x8m2pq.devsanctum.io                              │
│                                                       │
│  Services:                                            │
│  [VS Code ↗]   [App ↗]                               │
│                                                       │
│  [ Close ]          [ Open workspace ↗ ]              │
└──────────────────────────────────────────────────────┘
```

- **Open workspace ↗** opens `<slug>.<platform-domain>` in a new tab.
- **Close** closes the dialog; the new workspace row appears in the table.

4. On provisioning failure: the dialog shows an error view with the last log lines and a `"Retry"` button that retriggers provisioning on the already-created workspace record.

### Cancel during provisioning

If the admin closes the dialog while provisioning is in progress, provisioning continues in the background. The row appears in the table with `STARTING` status and the live countdown updates normally.

---

## 5. Dialog: Destroy Workspace

Triggered from `⋯` → **Destroy**.

**Title**: `"Destroy <workspace name>?"`

```
This will permanently stop and delete the workspace container and all its data.
Workspace history is preserved in the platform but the container cannot be recovered.

Type the workspace name to confirm:
[___________________]

          [ Cancel ]   [ Destroy workspace ]
```

- `Destroy workspace` button (danger) disabled until typed name matches `workspace.name` exactly.
- On confirm: `DELETE /api/v1/workspaces/:id`.
- On success: dialog closes, row status updates to `DESTROYED` (dimmed) and fades out after 3 s.
- On error: `Flash variant="danger"` inside the dialog.

---

## 6. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| List workspaces | `GET /api/v1/workspaces?search=&status=&projectId=&page=&limit=25` | Returns only workspaces owned by the authenticated user. Excludes DESTROYED by default unless `status=DESTROYED` is requested. |
| Deploy workspace | `POST /api/v1/workspaces` `{ projectId, branch, name?, dockerServerId?, visibility }` | Returns the new workspace with its slug. |
| Provisioning log stream | `GET /api/v1/workspaces/:id/logs` | SSE stream of provisioning log lines. |
| Stop workspace | `POST /api/v1/workspaces/:id/stop` | — |
| Start workspace | `POST /api/v1/workspaces/:id/start` | — |
| Patch workspace | `PATCH /api/v1/workspaces/:id` `{ pinned?, kept?, visibility? }` | Partial update. |
| Destroy workspace | `DELETE /api/v1/workspaces/:id` | Permanent. |
| Deploy eligibility | `GET /api/v1/projects/:id/deploy-eligibility` | Returns eligible server count and per-server capacity vs. requirements. |

---

## 7. UX Notes

- Destroyed workspaces are hidden from the default view. Users who specifically want to see them can select `Status = Destroyed` in the filter.
- Transient statuses (`STARTING`, `STOPPING`) poll at 10 s intervals until resolved. The polling only runs for rows in the current page view.
- The provisioning log stream in the deploy dialog is always shown — never hide it behind a "verbose" toggle. It is the user's primary feedback that something is happening.
- The workspace slug in the success view is the publicly routable address. It is shown prominently so the user can copy it immediately.
- Pin and Keep state changes are optimistic. If the server rejects (e.g. session expired), the icon reverts and an error Flash appears.

---

# Page Spec: Workspace Detail (`/workspaces/:slug`)

Auth required: **authenticated for private workspaces** — unauthenticated visitors are redirected to `/login`. **Public workspaces** are accessible without auth (services exposed, no management actions shown).

Primary goal: let the owner monitor and control a single workspace — open services, manage lifecycle, and inspect activity.

Related pages: [workspaces.md](workspaces.md) (list), [explore-project.md](explore-project.md) (public surface).

---

## 8. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ← My Workspaces                                                 │
│                                                                  │
│  workspace-name     [RUNNING]  [Private]  📌 Pinned             │
│  project-name ›  branch-name                                     │
│                                                                  │
│  [ Open workspace ↗ ]  [ Stop ]  [ Pin ]  [ Keep ]  [ Destroy ] │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌── Services ─────────────────────────────────────────────┐   │
│  │  VS Code ↗   App ↗   …                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌── Lifecycle ────────────────────────────────────────────┐   │
│  │  Started: 3 hours ago                                   │   │
│  │  Last activity: 12 min ago                              │   │
│  │  Stops in: 1h 48m  (countdown)                         │   │
│  │  Auto-destroy in: 4 days                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌── Info ─────────────────────────────────────────────────┐   │
│  │  Server: srv-01   Template: Node.js   Features: 2       │   │
│  │  URL: k4x8m2pq.devsanctum.io                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Section: Workspace Header

| Element | Detail |
|---------|--------|
| Back link | `← My Workspaces` → `/workspaces` |
| Name | `Heading` (h1) |
| Status badge | `Label` — same variants as the list table |
| Visibility badge | `Label variant="secondary"` — `Private` or `Public` |
| Pin indicator | 📌 `"Pinned"` when `pinned = true` |
| Breadcrumb | `project.name` → linked to `/projects/:id` › `branch` badge |

### Action bar

| Button | Condition | Behaviour |
|--------|-----------|-----------|
| **Open workspace ↗** | `RUNNING` | Opens `<slug>.<platform-domain>` in a new tab |
| **Stop** | `RUNNING` | `POST /api/v1/workspaces/:id/stop`. Optimistic. |
| **Start** | `STOPPED` | `POST /api/v1/workspaces/:id/start`. Optimistic. |
| **Pin / Unpin** | Always | `PATCH /api/v1/workspaces/:id { pinned }`. Toggle label. |
| **Keep / Un-keep** | Always | `PATCH /api/v1/workspaces/:id { kept }`. Toggle label. |
| **Make public / private** | Always | `PATCH /api/v1/workspaces/:id { visibility }`. Toggle. |
| **Destroy** | Not `DESTROYED` | Opens Destroy dialog (same as section 5). |

Transient states (`STARTING`, `STOPPING`) disable all action buttons except the status badge is replaced by `Spinner` + label.

---

## 10. Section: Services

Card row — one card per `WorkspaceService`:

```
┌────────────────────────┐  ┌────────────────────────┐
│  VS Code               │  │  App                   │
│  HTTP  ·  port 8080    │  │  HTTP  ·  port 3000    │
│  [ Open ↗ ]            │  │  [ Open ↗ ]            │
└────────────────────────┘  └────────────────────────┘
```

- `Open ↗` button opens the service URL in a new tab.
- For `TCP` protocol: instead of `Open ↗`, show connection details: `host:port` in a monospace copyable `TextInput`.
- Cards are greyed out when the workspace is `STOPPED` — links are disabled with `Tooltip`: `"Start the workspace to access this service."`.

### Empty state
`"No services configured for this workspace."` (edge case — templates always define at least one port).

---

## 11. Section: Lifecycle

| Row | Condition | Content |
|-----|-----------|---------|
| Started | Always | `"Started <relative time>"` (`createdAt`) |
| Last activity | `RUNNING` | `"Last activity: <relative>"` (`lastActivityAt`) |
| Auto-stop countdown | `RUNNING` and `!pinned` | `"Stops in <HH:MM:SS>"` — live countdown ticking client-side from `stopAt`. Amber < 30 min, red < 15 min. `"Pin to prevent →"` inline link. |
| Auto-destroy countdown | `!pinned` and `!kept` | `"Auto-destroys in <N> days"` (`destroyAt`). `"Keep to prevent →"` inline link. |
| Pinned notice | `pinned = true` | `"Pinned — no automatic stop or deletion."` (`success` colour) |
| Kept notice | `kept = true` and `!pinned` | `"Kept — auto-destroy disabled. Inactivity stop still applies."` |

---

## 12. Section: Info

Read-only metadata grid:

| Field | Value |
|-------|-------|
| Server | Docker server name |
| Template | Template name, linked to admin view for admins |
| Features | Count + comma-separated feature names (up to 3, `+N more`) |
| Workspace URL | `<slug>.<platform-domain>` — monospace, copyable with a `CopyIcon` button |
| Created | Absolute timestamp |

---

## 13. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| Get workspace | `GET /api/v1/workspaces/:slug` | Lookup by slug (not UUID). Returns full workspace with services, project, and server info. |
| Stop | `POST /api/v1/workspaces/:id/stop` | — |
| Start | `POST /api/v1/workspaces/:id/start` | — |
| Patch | `PATCH /api/v1/workspaces/:id` `{ pinned?, kept?, visibility? }` | — |
| Destroy | `DELETE /api/v1/workspaces/:id` | — |

> Note: the detail page route uses the **slug** for lookup (`GET /api/v1/workspaces/:slug`). The slug is stable, URL-safe, and opaque. The UUID `id` is only used in mutation endpoints after the initial load.

---

## 14. UX Notes

- The action bar button labels update immediately on optimistic mutation (e.g. **Stop** → **Start** while `STOPPING` is in progress), then reconcile with the server state on the next poll.
- The auto-stop countdown is computed entirely client-side from `workspace.stopAt` — no polling needed for the timer display itself.
- When the workspace is `DESTROYED`, the detail page still renders (read-only, all actions hidden) with a persistent `Flash variant="danger"`: `"This workspace has been destroyed. Its data is no longer available."`.
- Routes are by slug: `/workspaces/k4x8m2pq`. The UUID is never exposed in any URL.
