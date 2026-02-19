# Page Spec: Authenticated Shell & Navigation

Auth required: **yes** — this spec applies to every page that requires authentication. Unauthenticated visitors see the public header described in [home.md](home.md).

This document describes:
1. The **global topbar** (persistent across all authenticated pages).
2. The **contextual sidebar** — content changes based on the active section.
3. The **admin sidebar** — replaces the contextual sidebar inside `/admin/*` routes.
4. **Responsive behaviour** on narrow viewports.

Related pages (main app): [dashboard.md](dashboard.md), [workspaces.md](workspaces.md), [explore.md](explore.md), [new-project.md](new-project.md).
Related pages (admin): [admin-overview.md](admin-overview.md), [admin-servers.md](admin-servers.md), [admin-templates.md](admin-templates.md), [admin-features.md](admin-features.md), [admin-users.md](admin-users.md), [admin-groups.md](admin-groups.md), [admin-invitations.md](admin-invitations.md), [admin-audit-logs.md](admin-audit-logs.md), [admin-configuration.md](admin-configuration.md).

---

## 1. Overall Shell

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOPBAR                                                    [Avatar ▾] │
├───────────────────┬──────────────────────────────────────────────────┤
│                   │                                                  │
│  CONTEXTUAL       │  PAGE CONTENT                                    │
│  SIDEBAR          │                                                  │
│  (240 px)         │                                                  │
│                   │                                                  │
│                   │                                                  │
│                   │                                                  │
│                   │                                                  │
└───────────────────┴──────────────────────────────────────────────────┘
```

- Root element: `PageLayout` with `columnGap="none"`.
- `PageLayout.Pane` (position `"start"`, width fixed at 240 px) — the contextual sidebar.
- `PageLayout.Content` — the page body.
- The topbar sits outside `PageLayout` as a sticky `Header` component at the very top.

---

## 2. Topbar

Persistent on every authenticated page. Implemented with Primer `Header`.

```
┌──────────────────────────────────────────────────────────────────────┐
│  [≡]  DevSanctum                                          [Avatar ▾] │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.1 Left side

| Element | Detail |
|---------|--------|
| **Sidebar toggle** | `IconButton` with `ThreeBarsIcon` (`aria-label="Toggle sidebar"`). Visible on mobile only — collapses / expands the sidebar drawer. Hidden on desktop (≥ 1012 px). |
| **Logo / wordmark** | `Header.Link` href `/dashboard`. Displays the platform name from `platformConfig.platformName` (fallback: `"DevSanctum"`). Styled as `Header.Brand`. |

### 2.2 Right side — Avatar menu

A single `ActionMenu` triggered by clicking the user's avatar.

```
  ┌─────────────────────────┐
  │  [Avatar]  Full Name    │
  │  username@example.com   │
  ├─────────────────────────┤
  │  👤  Profile            │
  │  ⚙   Settings          │
  ├─────────────────────────┤
  │  🛡   Admin area        │   ← shown only when user.role = ADMIN
  ├─────────────────────────┤
  │  ↩   Sign out           │
  └─────────────────────────┘
```

| Item | Condition | Target |
|------|-----------|--------|
| **Full name + email** | Always — read-only header inside the menu | — |
| **Profile** | Always | `/profile` |
| **Settings** | Always | `/settings` |
| **Admin area** | `user.role === ADMIN` only | `/admin` — navigates to the admin shell (see §4) |
| **Sign out** | Always | Calls `POST /api/v1/auth/logout`, clears session, redirects to `/` |

- The trigger is an `Avatar` component (size 32) showing the user's `avatarUrl`; initials fallback when no URL is set.
- The menu is an `ActionList` with a `Header` item (non-interactive) showing name + email.
- **Admin area** item uses `ShieldIcon` and is separated from Settings by an `ActionList.Divider`.
- **Sign out** is separated by a second `ActionList.Divider` and uses a `SignOutIcon`.

---

## 3. Contextual Sidebar

The sidebar shows a `NavList` whose content depends on the **active section** of the app. It has three states: **Dashboard/Projects**, **Project detail**, and **Workspace detail**.

### 3.1 Dashboard / Projects context

Active when the current route matches `/dashboard`, `/projects`, `/projects/new`, or `/projects/:id` when no workspace is selected.

```
┌───────────────────┐
│  Dashboard        │  → /dashboard
│  Explore          │  → /explore
├───────────────────┤
│  PROJECTS         │  (section heading, non-link)
│  ┌─ my-api        │  → /projects/:id  (active = highlighted)
│  ├─ frontend-v2   │
│  └─ data-pipeline │
│  + New project    │  → /projects/new
├───────────────────┤
│  Groups           │  → /groups
│  Profile          │  → /profile
└───────────────────┘
```

| Item | Icon | Target | Notes |
|------|------|--------|-------|
| **Dashboard** | `HomeIcon` | `/dashboard` | Active when route = `/dashboard`. |
| **Explore** | `TelescopeIcon` | `/explore` | Always visible. |
| *(divider)* | — | — | Visual separator before project list. |
| **Projects** | — | — | `NavList.GroupHeading`, non-interactive. |
| *Project rows* | `RepoIcon` | `/projects/:id` | One row per project the user owns or is a member of. Active project is highlighted. Shows a `CounterLabel` with the count of `RUNNING` workspaces (hidden when 0). If there are more than 8 projects, the list is capped and a **"View all projects →"** link is shown at the bottom. |
| **+ New project** | `PlusIcon` | `/projects/new` | Styled as `variant="invisible"` small `Button` inside the nav, below the project list. |
| *(divider)* | — | — | |
| **Groups** | `PeopleIcon` | `/groups` | Visible to all authenticated users. |
| **Profile** | `PersonIcon` | `/profile` | |

### 3.2 Project detail context

Active when the current route matches `/projects/:id/**` (project detail, settings, access tab, etc.).

```
┌───────────────────┐
│  ← Projects       │  → /projects  (back link)
├───────────────────┤
│  project-name     │  (heading, non-link — current project name)
├───────────────────┤
│  Overview         │  → /projects/:id
│  Workspaces       │  → /projects/:id/workspaces
│  Access           │  → /projects/:id/access
│  Settings         │  → /projects/:id/settings
├───────────────────┤
│  WORKSPACES       │  (section heading)
│  ┌─ ws-alpha  🟢  │  → /workspaces/:id  (RUNNING = green dot)
│  ├─ ws-beta   ⚫  │  (STOPPED = gray dot)
│  └─ ws-gamma  🟡  │  (STARTING/STOPPING = yellow spinner)
│  + Deploy         │  opens Deploy Workspace modal
└───────────────────┘
```

| Item | Icon | Target | Notes |
|------|------|--------|-------|
| **← Projects** | `ArrowLeftIcon` | `/projects` | Top back-link, visually distinct from nav items. |
| *Project name* | — | — | `NavList.GroupHeading` showing the current project name. Truncated at 28 chars with tooltip. |
| **Overview** | `InfoIcon` | `/projects/:id` | |
| **Workspaces** | `ServerIcon` | `/projects/:id/workspaces` | Shows a `CounterLabel` with total workspace count. |
| **Access** | `PeopleIcon` | `/projects/:id/access` | |
| **Settings** | `GearIcon` | `/projects/:id/settings` | |
| *(divider)* | — | — | |
| **Workspaces** | — | — | `NavList.GroupHeading`. |
| *Workspace rows* | status dot | `/workspaces/:id` | One row per workspace belonging to this project (all statuses except `DESTROYED`). Status dot: green for `RUNNING`, gray for `STOPPED`, yellow animated for transitional states. Capped at 8; **"View all →"** link if exceeded. |
| **+ Deploy** | `PlusIcon` | — | Opens the Deploy Workspace modal inline. Styled as small `Button variant="invisible"`. |

### 3.3 Workspace detail context

Active when the current route matches `/workspaces/:id/**`.

```
┌───────────────────┐
│  ← project-name   │  → /projects/:id
├───────────────────┤
│  workspace-name   │  (heading, non-link)
│  🟢 RUNNING       │  (status badge)
├───────────────────┤
│  Overview         │  → /workspaces/:id
│  Services         │  → /workspaces/:id/services
│  Info             │  → /workspaces/:id/info
├───────────────────┤
│  ACTIONS          │  (section heading)
│  Open workspace   │  external link ↗
│  Stop             │  (or Start if STOPPED)
│  Pin              │  (or Unpin if pinned)
│  Keep             │  (or Un-keep if kept)
│  ─────────────    │
│  Destroy…         │  danger — opens confirmation dialog
└───────────────────┘
```

| Item | Icon | Target / Action | Notes |
|------|------|-----------------|-------|
| **← project-name** | `ArrowLeftIcon` | `/projects/:id` | Back to the parent project. Shows the actual project name, truncated. |
| *Workspace name* | — | — | `NavList.GroupHeading`. Truncated at 28 chars with tooltip. |
| *Status badge* | — | — | Inline `Label` below the heading inside the pane: green `RUNNING`, gray `STOPPED`, yellow `STARTING`/`STOPPING`. Not a nav item — rendered as a static element in the pane header area. |
| **Overview** | `InfoIcon` | `/workspaces/:id` | |
| **Services** | `LinkExternalIcon` | `/workspaces/:id/services` | Shows a `CounterLabel` with the count of exposed services. |
| **Info** | `ClockIcon` | `/workspaces/:id/info` | Lifecycle, creation date, scheduled stop/destroy times. |
| *(divider + "Actions" heading)* | — | — | `NavList.GroupHeading` labelled `"Actions"`. |
| **Open workspace** | `LinkExternalIcon` | Primary service URL (new tab) | Disabled and grayed when status ≠ `RUNNING`. |
| **Stop** / **Start** | `StopIcon` / `PlayIcon` | Inline action | **Stop** when `RUNNING`; **Start** when `STOPPED`. Disabled during transitional states. Triggers API call, updates status badge in real time. |
| **Pin** / **Unpin** | `PinIcon` | Inline action | Toggle. Shows current state. |
| **Keep** / **Un-keep** | `BookmarkIcon` | Inline action | Toggle. Shows current state. |
| *(danger divider)* | — | — | |
| **Destroy…** | `TrashIcon` | Inline action | `color: danger.fg`. Opens the workspace destruction confirmation dialog (user must type the workspace name). Disabled during transitional states. |

---

## 4. Admin Sidebar

Shown when the current route starts with `/admin`. Replaces the contextual sidebar entirely.

```
┌───────────────────┐
│  ← Back to app   │  → /dashboard
├───────────────────┤
│  ADMINISTRATION   │
│  Overview         │  → /admin
├───────────────────┤
│  INFRASTRUCTURE   │
│  Docker Servers   │  → /admin/servers
│  Templates        │  → /admin/templates
│  Features         │  → /admin/features
├───────────────────┤
│  PEOPLE           │
│  Users            │  → /admin/users
│  Groups           │  → /admin/groups
│  Invitations      │  → /admin/invitations
├───────────────────┤
│  PLATFORM         │
│  Audit Logs       │  → /admin/audit-logs
│  Configuration    │  → /admin/configuration
└───────────────────┘
```

| Group | Item | Icon | Target | Notes |
|-------|------|------|--------|-------|
| — | **← Back to app** | `ArrowLeftIcon` | `/dashboard` | Returns to the regular app. Always at the top, visually distinct. |
| **Administration** | **Overview** | `DashboardIcon` | `/admin` | Admin summary: total users, servers online, running workspaces, pending invites. Active on `/admin` exactly. |
| **Infrastructure** | **Docker Servers** | `ServerIcon` | `/admin/servers` | Badge: count of OFFLINE/UNREACHABLE servers in `danger.fg` when > 0. |
| | **Templates** | `PackageIcon` | `/admin/templates` | |
| | **Features** | `PlugIcon` | `/admin/features` | |
| **People** | **Users** | `PeopleIcon` | `/admin/users` | |
| | **Groups** | `OrganizationIcon` | `/admin/groups` | |
| | **Invitations** | `MailIcon` | `/admin/invitations` | Badge: count of `PENDING` invitations when > 0. |
| **Platform** | **Audit Logs** | `LogIcon` | `/admin/audit-logs` | |
| | **Configuration** | `GearIcon` | `/admin/configuration` | |

Group labels (`INFRASTRUCTURE`, `PEOPLE`, `PLATFORM`) are `NavList.GroupHeading` — non-interactive, all-caps, muted.

The active item is highlighted with the standard `NavList` active state (left accent bar + `accent.subtle` background).

---

## 5. Sidebar States

### Loading

When session data is being resolved (initial page load), the sidebar renders skeleton rows:
- 2 skeleton lines for the top nav items.
- 4 skeleton lines for the project list (dashboard context).

No layout shift — skeleton rows match the height of real items.

### Empty project list

If the user has no projects yet, the Projects section shows:

```
  No projects yet.
  [ + New project ]
```

The `+ New project` CTA is the only item in the section (no skeleton, no empty-list anxiety copy beyond the one line).

### Error

If the project list fails to load, the Projects section shows a single muted line:  
`"Could not load projects."` with a small **Retry** link inline.

---

## 6. Active State Rules

The active item is determined by an **exact or prefix match** on the current pathname:

| Current route | Active sidebar item |
|---------------|---------------------|
| `/dashboard` | Dashboard |
| `/explore` | Explore |
| `/workspaces` | — (no dedicated item; §3.1 sidebar remains, nothing highlighted) |
| `/workspaces/:slug` | The matching workspace row (§3.2 from parent project) + Overview (§3.3) |
| `/projects` | Projects heading (no individual item) |
| `/projects/new` | + New project |
| `/projects/:id` | The matching project row (§3.1) + Overview (§3.2) |
| `/projects/:id/workspaces` | The matching project row + Workspaces (§3.2) |
| `/projects/:id/access` | The matching project row + Access (§3.2) |
| `/projects/:id/settings` | The matching project row + Settings (§3.2) |
| `/admin` | Overview |
| `/admin/servers` | Docker Servers |
| `/admin/templates` | Templates |
| `/admin/templates/new` | Templates |
| `/admin/templates/:id/edit` | Templates |
| `/admin/features` | Features |
| `/admin/features/new` | Features |
| `/admin/features/:id/edit` | Features |
| `/admin/users` | Users |
| `/admin/groups` | Groups |
| `/admin/invitations` | Invitations |
| `/admin/audit-logs` | Audit Logs |
| `/admin/configuration` | Configuration |

When a project page is active, both the project row **and** the relevant sub-item (Overview, Workspaces, etc.) are highlighted simultaneously.

---

## 7. Responsive Behaviour

### Desktop (≥ 1012 px)
- Sidebar always visible as a fixed left pane.
- Sidebar toggle button hidden.

### Tablet / Mobile (< 1012 px)
- Sidebar collapses into an off-canvas drawer (slides in from the left).
- Topbar sidebar toggle button (hamburger) becomes visible.
- Navigating to any link inside the sidebar closes the drawer automatically.
- The overlay behind the open drawer is a semi-transparent backdrop; clicking it closes the drawer.

---

## 8. Implementation Notes

- The entire shell (topbar + sidebar + content area) is rendered by a single `AuthenticatedLayout` component wrapping all protected routes via React Router's nested `<Route element={<AuthenticatedLayout />}>`.
- The sidebar content component (`AppSidebar`) reads the current location from `useLocation()` and the user's project list from a shared context (or React Query cache) — no per-page prop drilling.
- Active project/workspace is resolved from route params (`useParams()`), not from prop drilling.
- Admin sidebar is a separate component (`AdminSidebar`) rendered when `location.pathname.startsWith('/admin')`.
- Status dots on workspace rows are updated optimistically when the user triggers Stop/Start from the sidebar actions; a background poll (every 10 s) reconciles true container state.
- The avatar menu `ActionMenu` fetches no additional data — user name, email, role, and avatar URL are available from the session context loaded at app bootstrap.
