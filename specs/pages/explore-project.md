# Page Spec: Public Project (`/explore/:projectSlug`)

Auth required: **no** — accessible to any visitor. If the project has `visibility = PRIVATE`, return a 404 (do not reveal the project exists).

Primary goal: let any visitor read the project README, open a running public workspace, and explore recent development activity — without creating an account.

Related pages: [home.md](home.md) (links here from workspace rows and project cards), [explore.md](explore.md) (project listing).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo · Explore           [Sign in]  [Register?]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ← Back to Explore                                               │
│                                                                  │
│  [Owner avatar] owner-name / project-name   [Template badge]    │
│  Short description (from project.description)                    │
│  Feature badges (up to 5, +N more)                              │
│                                                                  │
├──────────────────────────────────┬──────────────────────────────┤
│                                  │                               │
│  ── README ──────────────────    │  ── Active Workspaces ──     │
│                                  │   Workspace card              │
│  Rendered markdown content       │   Workspace card              │
│  (from README.md in the repo)    │   …                          │
│                                  │                               │
│                                  │  ── Recent Commits ────      │
│                                  │   Commit row                  │
│                                  │   Commit row                  │
│                                  │   …                          │
│                                  │                               │
└──────────────────────────────────┴──────────────────────────────┘
```

Layout: `PageLayout` with a main content pane (README) and a right sidebar (Active Workspaces + Recent Commits).

On tablet and mobile, the sidebar stacks below the README.

---

## 2. Section: Project Header

Shown above the two-column layout, full width.

| Element | Detail |
|---------|--------|
| Back link | `← Back to Explore` → `/explore` |
| Owner avatar | `Avatar` (24px) + `owner.username` — linked to owner's profile if public profiles are implemented, otherwise plain text |
| Project name | `Heading` (h1), large |
| Template badge | `Label` with template name |
| Feature badges | Up to 5 `Label` components, `+N more` text if exceeded |
| Description | `Text` (`fg.muted`), one line, from `project.description`. Hidden if empty. |
| Visibility | Not shown explicitly — private projects return 404 |

### Loading state
Skeleton row matching the header height (avatar circle + two text lines + badge row).

---

## 3. Section: README

### Purpose
Give visitors the full context of what the project does and how to use it.

### Content

- Fetches the `README.md` file from the repository bound to the project's default workspace branch.
- Rendered as **sanitised HTML from Markdown** — use a server-side or client-side Markdown renderer (e.g. `marked` + `DOMPurify`). Never render unsanitised HTML.
- Rendered content is wrapped in a `Box` styled as a GitHub-like Markdown body (prose font size, code blocks, headings hierarchy).
- If the project has no repository URL configured, or the README does not exist in the repository, show the empty state below.

### Empty state
"No README found for this project."
(neutral, no CTA — this is an informational section)

### Error state
"Could not load the README." + `Retry` button that re-fetches.

### Loading state
Three `SkeletonText` blocks of varying widths simulating paragraph text.

---

## 4. Section: Active Workspaces (sidebar)

### Purpose
The primary action surface — let visitors open a running workspace immediately.

### Content

Up to **5 RUNNING workspaces** for this project, ordered by `startedAt` descending.

Each **workspace card** shows:

| Field | Detail |
|-------|--------|
| Workspace name | Plain text |
| Branch badge | `branch-name` |
| Running duration | "Running for 1h 32m" |
| Public service chips | One `Label`-style chip per service with `isPublic = true`: `[Service ↗]` — opens URL in new tab |

- The entire list is scoped to **public services only** (`isPublic = true` on the port/service). No internal ports are exposed.
- Workspaces with no public services are **not shown** on this public page (unlike the global explore list).
- Cards use `border.default` border, `canvas.default` background, `8px` border radius.

### Empty state
"No workspaces are running right now."
(no CTA — visitors cannot deploy)

### Loading state
Two skeleton cards matching the card height.

---

## 5. Section: Recent Commits (sidebar, below Active Workspaces)

### Purpose
Show development activity to build trust and give a sense of the project's momentum.

### Content

The **10 most recent commits** across all branches of this project's repository, ordered by `committedAt` descending.

Each **commit row** shows:

| Field | Detail |
|-------|--------|
| Author avatar | `Avatar` (20px) |
| Author name | Plain text |
| Branch badge | Small `Label` |
| Commit message | Truncated at 60 chars; full message in `Tooltip` |
| Short SHA | 7 chars, monospace, copyable on click |
| Timestamp | Relative (e.g. "3 hours ago"), absolute on hover via `Tooltip` |

- Rows are separated by a subtle `border.muted` divider.
- No "view all commits" link for unauthenticated visitors — the list is intentionally capped at 10.

### Empty state
"No commits recorded yet."

### Error state
Inline `Flash variant="warning"` — "Could not load commit history." No retry (non-critical section).

### Loading state
Three skeleton rows (avatar circle + two text lines).

---

## 6. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| Project detail | `GET /api/v1/explore/projects/:slug` | Returns project metadata, owner, template, features. Returns 404 if private. Unauthenticated. |
| Active workspaces | `GET /api/v1/explore/projects/:slug/workspaces?status=RUNNING&hasPublicPorts=true&limit=5` | Unauthenticated. Only workspaces with at least one public port. |
| README content | `GET /api/v1/explore/projects/:slug/readme` | Backend fetches from the git repository and returns sanitised Markdown as a string. Returns 404 if not found. Unauthenticated. |
| Recent commits | `GET /api/v1/explore/projects/:slug/commits?limit=10` | Unauthenticated. Returns commits from the `CommitActivity` table scoped to this project. |

---

## 7. UX Notes

- The three content sections (README, active workspaces, recent commits) load **independently**. A failure in one does not block the others.
- The project header loads first (from the same call as the project detail); the rest of the page populates progressively.
- If the project slug does not match any public project, the page renders a standard 404 — do not distinguish between "does not exist" and "is private".
- Never show a sign-in prompt inside this page. Authentication is offered only in the global header.
- README rendering must sanitise all HTML to prevent XSS. Strip `<script>`, `<iframe>`, `on*` event attributes, and `javascript:` hrefs.
- Commit rows are read-only and informational. No click-to-navigate on commits (no auth to view workspace detail pages).
