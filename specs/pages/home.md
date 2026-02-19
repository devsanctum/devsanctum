# Page Spec: Public Home (`/`)

Auth required: **no** — if the visitor is already authenticated, redirect immediately to `/dashboard`.

Primary goal: let any visitor discover the platform and **access public workspaces without creating an account**. Sign-up and sign-in are offered as secondary actions.

Related pages: [dashboard.md](dashboard.md) for the connected dashboard (`/dashboard`), [explore-project.md](explore-project.md) for the public project detail page (`/explore/:projectSlug`).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo · Explore           [Sign in]  [Register?]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── Hero ────────────────────────────────────────────────────   │
│  Heading: "Self-hosted dev environments, instantly."             │
│  Subheading: <platform description from config>                  │
│  [ Sign in ]   [ Register — if open registration is enabled ]    │
│                                                                  │
│  ── Active Public Workspaces ────────────────────────────────   │
│  Workspace row · project · branch · running duration · ports     │
│  Workspace row …                                                 │
│                                                                  │
│  ── Recently Updated Public Projects ────────────────────────   │
│  Project card   Project card   Project card   …                  │
│  [ Explore all public projects → ]                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Active Public Workspaces appears before the project list** — visitors should be able to open a workspace without scrolling or reading.

---

## 2. Section: Hero

- **Heading** (h1): `"Self-hosted dev environments, instantly."`
- **Subheading**: value of `platformConfig.description`, fallback to a built-in default string.
- **CTAs**:
  - `Sign in` → `/login` (always shown)
  - `Register` → `/register` (shown only when open registration is enabled; hidden in invitation-only mode)
- Background: `canvas.subtle`, centered, vertical padding 48px top / 32px bottom.

---

## 3. Section: Active Public Workspaces

This is the **primary section** of the public page. Any visitor can open a running workspace without an account.

### Content

Up to **10 RUNNING workspaces** belonging to public projects, ordered by `startedAt` descending.

Each **workspace row** shows:

| Field | Detail |
|-------|--------|
| Workspace name | Plain text (not a link — visitors cannot access the workspace detail page) |
| Project | `Label`-style link → `/explore/:projectSlug` (the public project page) |
| Branch badge | `branch-name` |
| Template badge | Template name |
| Running duration | "Running for 2h 14m" |
| Public service chips | One chip per service with `isPublic = true`: `[Service name ↗]` — opens URL in new tab |

- Workspaces with no public services are still listed; the services column shows `—`.
- Each row is a bordered `Box` (card-style) to give visual weight to the action chips.

### Empty state
"No public workspaces are currently running. Check back later or [explore public projects →](/explore)."

The `explore public projects` text is an inline link → `/explore`.

### UX note
This section renders first and loads independently. Even if the projects section is loading, visitors can already see and open workspaces.

---

## 4. Section: Recently Updated Public Projects

Secondary objective: help visitors understand what the platform hosts and encourage sign-up.

### Content

The **8 most recently active** projects with `visibility = PUBLIC`, ordered by `updatedAt` descending.

Card grid: 4 cols → 2 on tablet → 1 on mobile.

Each **project card** shows:
- Project name → linked to `/explore/:projectSlug` (public project page, see [explore-project.md](explore-project.md))
- Owner avatar + username
- Template badge
- Up to 3 feature badges, `+N more` if exceeded
- Running workspace count (`CounterLabel`)
- "Last active" relative timestamp (e.g. "3 hours ago")
- **"View project →"** link in the card footer → `/explore/:projectSlug`

Link below the grid: **"Explore all public projects →"** → `/explore`

> Every project name and every "View project →" link routes to the same `/explore/:projectSlug` page. The project slug is derived from `project.slug` returned by the API.

### Empty state
"Nothing public yet." — no CTA, no sign-up pressure.

---

## 5. Navigation Header (unauthenticated state)

```
[Logo] DevSanctum    Explore                     [Sign in]  [Register?]
```

- `Explore` → `/explore`
- `Sign in` → `/login`
- `Register` → `/register` — hidden when invitation-only mode is active

---

## 6. Routing Logic

| Path | Condition | Behavior |
|------|-----------|----------|
| `/` | Not authenticated | Render public home |
| `/` | Authenticated | Redirect → `/dashboard` |

---

## 7. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| Platform config | `GET /api/v1/config/public` | Returns `description`, `allowRegistration`. Unauthenticated. |
| Active public workspaces | `GET /api/v1/explore/workspaces?status=RUNNING&limit=10` | Unauthenticated |
| Recent public projects | `GET /api/v1/explore/projects?limit=8&sort=updatedAt` | Unauthenticated |

---

## 8. UX Notes

- The three sections load **independently** — skeleton → content, with per-section error + retry.
- Workspace rows use a skeleton matching their card height while loading.
- Never prompt for login mid-page or behind a modal. The hero CTAs are the only entry points to authentication.
- Registration CTA visibility is driven by the `allowRegistration` flag from `GET /api/v1/config/public`. Never hardcode this.
