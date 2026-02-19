# Page Spec: Connected Dashboard (`/dashboard`)

Auth required: **yes** — redirect to `/login?redirect=/dashboard` if not authenticated.

Primary goal: give the authenticated user an instant overview of platform health and their own development activity. Make it effortless to resume work, spot problems, and deploy quickly.

Shell & navigation: see **[navigation.md](navigation.md)**. The dashboard activates the **Dashboard** item in the sidebar (§3.1 of that spec).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Topbar                                             [Avatar ▾]  │
├──────────────────┬──────────────────────────────────────────────┤
│  Dashboard   ◄   │  [ADMIN ONLY] Summary bar                   │
│  Explore         │  [ Users: 14 ] [ Servers: 3/4 ] [ WS: 7 ]  │
│  ── Projects ──  │                                              │
│  └ my-api    3🟢 │  Dashboard              [ + New Project ]   │
│  └ frontend  1🟢 │                                              │
│  └ pipeline      │  ── Docker Server Vitals ────────────────── │
│  + New project   │  Server card   Server card   Server card    │
│  ────────────    │                                              │
│  Groups          │  ── My Projects & Workspaces ─────────────  │
│  Profile         │  ▶ project-name  3 running / 5 total        │
│                  │      ↳ WS card  WS card  [+ Deploy]         │
│                  │                                              │
│                  │  ── Recent Git Activity ────────────────── │
│                  │  [Avatar] author  repo@branch  "msg"  2h    │
└──────────────────┴──────────────────────────────────────────────┘
```

---

## 2. Section: Platform Summary Bar (admin only)

Shown only when `user.role = ADMIN`. Displayed above the page heading.

Four stat tiles in a horizontal row, each interactive:

| Tile | Value | Navigation |
|------|-------|-----------|
| **Users** | Total registered users | → `/admin/users` |
| **Servers online** | `N / total` — red when any server is OFFLINE or UNREACHABLE | → `/admin/servers` |
| **Active workspaces** | Total RUNNING workspaces across all projects | — |
| **Pending invitations** | Unused, non-expired invitations | → `/admin/invitations` |

Each tile is a bordered `Box` with a large `CounterLabel` value and a muted label below.

---

## 3. Section: Docker Server Vitals

### Purpose
Surface infrastructure health as a first-class concern. Any unhealthy server or high-resource pressure is immediately visible without navigating to the admin panel.

### Visibility
- **Admin users**: all registered servers.
- **Non-admin users**: only servers assigned to a group the user belongs to.
- If the user has no accessible servers, this section is hidden entirely.

### Server Card

One card per server, responsive grid (3 cols → 2 → 1 on narrow):

```
┌────────────────────────────────────┐
│  🟢 server-name          ONLINE    │
│  host:port                         │
│                                    │
│  CPU     ████████░░  8 cores       │
│  RAM     ██████░░░░  6.2 / 16 GB   │
│  Disk    ███████░░░  120 / 500 GB  │
│                                    │
│  7 workspaces running              │
│  Updated 30s ago                   │
└────────────────────────────────────┘
```

- **Status badge**: `ONLINE` (success), `OFFLINE` (attention), `UNREACHABLE` (danger).
- **Resource bars** (inline progress bar):
  - < 70% → `success.emphasis`
  - 70–90% → `attention.emphasis`
  - > 90% → `danger.emphasis`
- **Stale data indicator**: if `resourcesUpdatedAt` > 2 × polling interval, show a clock icon + tooltip "Data may be stale — last updated N min ago".
- **Running workspace count** below the bars.
- Clicking the card:
  - **Admin**: navigate to `/admin/servers/:id`
  - **Non-admin**: open a read-only modal with the same stats.

### Empty / error states
- All servers offline: `Flash variant="danger"` — "All Docker servers are unreachable. Workspace deployments are unavailable."
- Load failure: inline retry button.

---

## 4. Section: My Projects & Workspaces

### Purpose
Let the user see the state of every workspace across all their projects and act without deep navigation.

### Accordion structure

**Collapsed project row:**

```
▶  project-name  [Private]  Node.js  3 running / 5 total  Last deploy: 2h ago  [+ Deploy]
```

- Project name (link → `/projects/:id`)
- Visibility badge
- Template badge
- Workspace summary: running count (green `CounterLabel`) / total count
- Last deploy relative time
- `+ Deploy` button (invisible variant, visible on hover)

**Expanded row** — horizontal scroll of workspace cards:

```
┌──────────────────────┐  ┌──────────────────────┐
│ 🟢 workspace-name    │  │ ⏸ workspace-name      │
│ branch: main         │  │ branch: feature/auth  │
│ Server: srv-01       │  │ Server: srv-02        │
│ Started: 3h ago      │  │ Stopped: 1h ago       │
│ Stops in: 45m ⚡      │  │                       │
│ [Open] [Stop] [⋯]   │  │ [Start] [⋯]          │
└──────────────────────┘  └──────────────────────┘
   + Deploy new workspace
```

**Workspace card fields:**
- Status badge: `RUNNING` (success), `STOPPED` (secondary), `STARTING`/`STOPPING` (attention, animated)
- Branch badge (linked to git repo URL if available)
- Docker server name
- Start / stop time (relative)
- **Inactivity countdown** (non-pinned RUNNING only): "Stops in 45m" — turns `danger` under 15 minutes
- **Pin indicator**: 📌 visible when pinned — countdown hidden
- **Actions by status**:
  - RUNNING: `Open` (primary), `Stop` (default), `⋯` → Pin/Unpin · Keep · Destroy
  - STOPPED: `Start` (primary), `⋯` → Pin/Unpin · Keep · Destroy
  - STARTING / STOPPING: all actions disabled, loading spinner on status badge

**Expanded footer:**
- `+ Deploy workspace` (primary) — opens the deploy modal pre-filled with this project.

### Ordering

1. Projects with ≥ 1 RUNNING workspace — sorted by `lastActivityAt` descending
2. Projects with only stopped workspaces
3. Projects with no workspaces

Projects with running workspaces are auto-expanded on first load; others start collapsed.

### Empty states
- No projects at all: "You don't have any projects yet." + `+ New Project` (primary).
- Project expanded, no workspaces: minimal empty card "No workspaces — [Deploy one →]".

---

## 5. Section: Recent Git Activity

### Purpose
Surface development momentum. Show what has been pushed to branches attached to workspaces so the user can see what changed and jump directly to the relevant workspace.

### Feed structure

**20 most recent commits** across all accessible workspace branches, ordered by `committedAt` descending.

Each **commit row:**
```
[Avatar]  author-name   workspace-name › project/repo@branch   "commit message…"  sha7   2h ago
```

- **Author avatar** — from git metadata or matched user account
- **Author name**
- **Workspace link** → `/workspaces/:id`
- **Branch ref**: `project / repo @ branch-name`
- **Commit message** — truncated at 80 chars, full text in tooltip
- **Commit SHA** — 7-char monospace, copied to clipboard on click
- **Timestamp** — relative, absolute on hover

**Grouped commits** (same author + same workspace/branch within 30 min):
```
[Avatar]  author   workspace › repo@branch   3 commits   2h ago
              ↳ "most recent commit message"
              ↳ View all 3 →
```

### Scope
- Non-admin: commits on workspaces they own, or on projects where they have `DEPLOY`+.
- Admin: all commits on all workspaces.

### Empty state
"No git activity recorded yet. Activity appears once workspaces are deployed and commits are pushed."

### Data model note
Commit metadata is stored in a `CommitActivity` table: `workspaceId`, `repoUrl`, `branch`, `sha`, `message`, `authorName`, `authorAvatarUrl`, `committedAt`. Records are populated via repository push webhooks or periodic branch polling.

---

## 6. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| Platform summary | `GET /api/v1/admin/summary` | Admin only |
| Docker servers + metrics | `GET /api/v1/docker-servers?withMetrics=true` | Filtered to user's accessible servers |
| Projects + workspace summary | `GET /api/v1/projects?mine=true&withWorkspaceSummary=true` | |
| Workspaces for a project | `GET /api/v1/projects/:id/workspaces` | Called on accordion expand |
| Recent commit activity | `GET /api/v1/activity/commits?limit=20` | Scoped to user |
| Stop workspace | `POST /api/v1/workspaces/:id/stop` | |
| Start workspace | `POST /api/v1/workspaces/:id/start` | |
| Deploy workspace | `POST /api/v1/workspaces` | Opens deploy modal |

---

## 7. UX Notes

- Each section loads **independently** — a failure in git activity does not block the server vitals or workspace sections.
- **Optimistic updates**: status badge updates immediately on stop/start; rolled back with a `Flash` on error.
- **Live polling**:
  - Server vitals: every 30 seconds.
  - Workspace status: every 15 seconds when any workspace is in a transient state (`STARTING`, `STOPPING`).
- **Inactivity countdown** ticks in real time on the client using `lastActivityAt` + 2h threshold — no server call needed.
- **Admin tiles are interactive** — clicking navigates directly to the relevant admin section.
