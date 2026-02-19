# Page Spec: Explore Public Projects (`/explore`)

Auth required: **no** — accessible to any visitor. Authenticated users also see this page (it is listed in the authenticated sidebar at §3.1 of [navigation.md](navigation.md)).

Primary goal: let any visitor discover and browse all public projects on the platform, and navigate to a project's detail page or its active workspaces.

Related pages: [home.md](home.md) (links here from the hero "Explore all public projects →" CTA), [explore-project.md](explore-project.md) (individual project detail).

---

## 1. Layout

### Unauthenticated visitor

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo · Explore           [Sign in]  [Register?]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Explore public projects                                         │
│                                                                  │
│  ┌── Search & filters ────────────────────────────────────┐    │
│  │ [Search by project name…]   Template ▾   Sort ▾        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                       │
│  │ card │  │ card │  │ card │  │ card │  …                     │
│  └──────┘  └──────┘  └──────┘  └──────┘                       │
│                                                                  │
│  Showing 1–24 of 87   [ ← Prev ]  [ Next → ]                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Authenticated user

Uses the standard authenticated shell (topbar + sidebar). The **Explore** sidebar item is active.

```
┌─────────────────────────────────────────────────────────────────┐
│  Topbar                                             [Avatar ▾]  │
├──────────────────┬──────────────────────────────────────────────┤
│  Dashboard       │  Explore public projects                     │
│  Explore    ◄    │                                              │
│  ── Projects ──  │  ┌── Search & filters ─────────────────┐   │
│  └ my-api    3🟢 │  │ [Search…]   Template ▾   Sort ▾     │   │
│  + New project   │  └─────────────────────────────────────┘   │
│  ────────────    │                                              │
│  Groups          │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │
│  Profile         │  │ card │  │ card │  │ card │  │ card │  │
│                  │  └──────┘  └──────┘  └──────┘  └──────┘  │
└──────────────────┴──────────────────────────────────────────────┘
```

---

## 2. Section: Toolbar

- **Page heading** (h1): `"Explore public projects"`
- **Search input**: real-time filter (debounced 300 ms) by project name or description.
- **Template filter** (`Select`): `All templates` + one entry per template that has at least one public project. Filters the grid.
- **Sort** (`Select`): `Most recently updated` (default), `Most active workspaces`, `Alphabetical`.

URL query params (`?search=`, `?template=`, `?sort=`, `?page=`) kept in sync for shareable URLs.

---

## 3. Section: Project Card Grid

4 cols → 3 on tablet → 1 on mobile.

### Project card

```
┌──────────────────────────────────────────┐
│  [Owner avatar]  owner / project-name    │
│                                          │
│  Short description (1 line, truncated)   │
│                                          │
│  [Template badge]  [Feature] [Feature]…  │
│                                          │
│  🟢 2 running   Updated 3 days ago      │
└──────────────────────────────────────────┘
```

| Element | Detail |
|---------|--------|
| Owner avatar | `Avatar` 20 px + `owner.username` |
| Project name | Bold link → `/explore/:projectSlug` |
| Description | `fg.muted`, truncated to one line with `Tooltip` for full text |
| Template badge | `Label variant="secondary"` with template name |
| Feature badges | Up to 3 `Label` components, `+N more` if exceeded |
| Running workspaces | `CounterLabel` showing count of `RUNNING` workspaces, green. Hidden when 0. |
| Updated | `"Updated <relative>"` in `fg.muted` |

Card click → `/explore/:projectSlug`.

### Loading state
Eight skeleton cards matching the card height.

### Empty state (no public projects)
`Blankslate` with `TelescopeIcon`:
- Heading: `"No public projects yet."`
- Description: `"Public projects will appear here once they are created."`
- No CTA for unauthenticated users.
- Authenticated users see: `"Create a public project →"` → `/projects/new`.

### Empty state (filters active, no matches)
`Blankslate` — `"No public projects match your search."` + `Clear filters` button.

---

## 4. Pagination

- 24 cards per page.
- Standard `Pagination` component below the grid.
- Current page shown in URL (`?page=2`).

---

## 5. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| List public projects | `GET /api/v1/projects?visibility=public&search=&templateId=&sort=&page=&limit=24` | No auth required. Returns project cards with owner, template, feature count, running workspace count. |
