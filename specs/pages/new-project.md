# Page Spec: New Project (`/projects/new`)

Auth required: **yes** — redirect to `/login?redirect=/projects/new` if not authenticated.

Primary goal: let any authenticated user create a new project quickly. The form follows a single-page, top-to-bottom layout inspired by GitHub's repository creation page — no wizard, no steps, no modal. Required fields come first; optional configuration follows below a visual separator.

Shell & navigation: see **[navigation.md](navigation.md)**. This page activates **+ New project** in the sidebar (§3.1 of that spec).

Related features: [projects.md](../features/projects.md), [templates.md](../features/templates.md), [features.md](../features/features.md).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Topbar                                               [Avatar ▾] │
├───────────────────┬─────────────────────────────────────────────┤
│  Dashboard       │  ← Projects                                   │
│  Explore         │                                              │
│  ── Projects ──   │  Create a new project                         │
│  └ my-api        │  A project groups repos, picks a template…    │
│  + New project ◄ │  ──────────────────────────────────────────  │
│  ─────────────────│  [owner] / [project-name]                   │
│  Groups          │  Description                                  │
│  Profile         │  Template picker                              │
│                  │  Visibility                                   │
│                  │  ──────────────────────────────────────────  │
│                  │  Repositories                                 │
│                  │  Features                                     │
│                  │  Advanced                                     │
│                  │  ────  [ Cancel ]  [ Create project ]           │
└──────────────────┴─────────────────────────────────────────────┘
```

Page root: `PageLayout` with the standard authenticated sidebar. The form content is constrained to `max-width: 768px`, centered inside `PageLayout.Content`.
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Owner            Project name *             [ Slug preview ]   │
│  [avatar ▾]   /   [________________________]                    │
│                                                                  │
│  Description                                                     │
│  [____________________________________________________________]  │
│                                                                  │
│  Template *                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Node.js     │  │  Python      │  │  Go          │  …       │
│  │  Alpine 3.19 │  │  Alpine 3.19 │  │  Alpine 3.20 │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  Visibility                                                      │
│  ◉ Private  — Only members of assigned groups can access.       │
│  ○ Public   — Visible to anyone. Running workspaces may be      │
│               exposed without authentication.                    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Repositories  (at least one required)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Name        │ Git URL                             [ × ] │   │
│  │ [_________] │ [___________________________________]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│  [ + Add another repository ]                                    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Features  (optional)                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ □ PostgreSQL │  │ □ VS Code    │  │ □ Redis      │  …       │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ▸ Advanced — resource requirements                              │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│                           [ Create project ]                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Page root uses `PageLayout` without a sidebar pane. The form is constrained to a max-width of `768px`, centered.

---

## 2. Navigation Header

Standard authenticated shell. See [navigation.md](navigation.md) — sidebar context: §3.1 (Dashboard / Projects), **+ New project** item active.

---

## 3. Page Heading

```
Create a new project
A project groups repositories, picks an environment template, and lets your team deploy workspaces.
```

- `Heading` (h1): `"Create a new project"`.
- `Text` (`fg.muted`, below heading): one-sentence description of what a project is.
- A horizontal rule (`border.default`) separates the heading from the first form field.

---

## 4. Form Fields

### 4.1 Owner / Project name

Two inputs on the same horizontal line, separated by a `/` divider, matching GitHub's `owner / repository-name` pattern.

| Field | Detail |
|-------|--------|
| **Owner** | Read-only `Select`-style button showing the current user's avatar + username. Non-editable in MVP (all projects are owned by the creator). |
| **Project name** | `TextInput`, required. Alphanumeric, hyphens, underscores. Max 100 chars. |
| **Slug preview** | Inline note below the name field: `"devsanctum.io/projects/my-project-name"` — updated as the user types, spaces auto-converted to hyphens. |

Validation on blur:
- Empty → `"Project name is required."`
- Invalid characters → `"Only letters, numbers, hyphens, and underscores are allowed."`
- Already taken → `"A project with this name already exists."` (checked via API on blur).

### 4.2 Description

Full-width `TextInput` (single line), optional. Max 255 chars.  
Placeholder: `"Short description (optional)"`.  
Caption: `"Shown on your project card and on the public project page."`

### 4.3 Template

Required. Displayed as a horizontal scrollable row of radio-style cards on desktop, wrapping on mobile.

Each **template card** shows:
- Template name (`Text`, semibold)
- Alpine version badge (`Label`, secondary)
- Short description (`Text`, `fg.muted`, 2-line clamp)

Selected card gains a `2px accent.emphasis` border and an `accent.subtle` background. Unselected cards have `border.default`.

Interaction: clicking a card selects it. Only one template can be active at a time.

Validation: if the user submits without selecting a template → `"Please select a template."` shown below the card row.

A **"Browse all templates →"** text link below the row opens the template catalog in a new tab for users who want to preview a template's full spec first.

### 4.4 Visibility

Radio group with two options, styled as prominent labeled rows (matching GitHub's visibility picker):

```
◉ 🔒 Private
     Only members of groups you assign to this project can view or deploy workspaces.

○ 🌐 Public
     Anyone, including unauthenticated visitors, can view this project and its running
     workspaces. You control which ports are exposed publicly.
```

Default: **Private**.

- Lock icon for Private, Globe icon for Public (`@primer/octicons-react`).
- The description text uses `fg.muted`.
- The selected option row has a subtle `accent.subtle` background.

### 4.5 Repositories

Separated from visibility by a horizontal rule.

At least one repository is required to submit the form.

Each **repository row** is a single-line card with two inputs side-by-side:

| Input | Detail |
|-------|--------|
| **Name** | Short `TextInput` (e.g. `frontend`, `api`). Required. Max 50 chars. Used as the display label within the project. |
| **Git URL** | Full-width `TextInput`. Required. Must be a valid `https://` or `git@` URL. |
| **Remove (×)** | `IconButton` with `TrashIcon`, `variant="danger"`, hidden when only one row remains. |

Below all rows: **`+ Add another repository`** — a `Button` (`variant="invisible"`, leading `PlusIcon`) that appends a new empty row.

Validation on blur (per field):
- Name empty → `"Repository name is required."`
- URL empty → `"Git URL is required."`
- URL invalid format → `"Enter a valid https:// or git@... URL."`

### 4.6 Features

Optional. Displayed as a 3-column card grid (→ 2 → 1 on smaller viewports).

Each **feature card** is a checkbox-style toggle card showing:
- Feature name (`Text`, semibold)
- Short description (`Text`, `fg.muted`, 2-line clamp)
- Port summary line (`Text`, `fg.muted`, e.g. `5432/TCP`)
- Alpine range badge (`Label`, secondary, e.g. `≥ 3.18`)

Selected cards gain a `2px accent.emphasis` border and `accent.subtle` background.  
Deselected cards have `border.default`.

A helper note below the grid:  
`"Features add services (databases, editors, etc.) to every workspace in this project."`

### 4.7 Advanced — Resource Requirements

A collapsible `<details>`-style section (using a `Button` with `variant="invisible"` and a `ChevronRightIcon` / `ChevronDownIcon` toggle), collapsed by default.

Label: **`Advanced — resource requirements`**

When expanded:

```
Effective floor from template + features:  512 MB RAM  ·  2 GB disk

Minimum RAM (MB)        [ _______ ]   Override: leave blank to use the template floor.
Minimum disk (GB)       [ _______ ]   Override: leave blank to use the template floor.
```

- **Effective floor** is a read-only computed preview (`canvas.subtle` callout box) showing `templateMinRamMb + sum(featureMinRamMb)` and `templateMinDiskGb + sum(featureMinDiskGb)`. Updated reactively when template or features change.
- **Minimum RAM** / **Minimum disk** inputs are numeric, optional. If the entered value is lower than the floor, an inline warning is shown: `"Value is below the effective floor (512 MB). The floor will be used instead."` — not an error, just informational.

---

## 5. Form Footer

A `border.default` horizontal rule followed by a right-aligned action row:

```
[ Cancel ]   [ Create project ]
```

| Button | Variant | Behaviour |
|--------|---------|-----------|
| **Cancel** | `default` | Navigates back to `/projects` without saving. |
| **Create project** | `primary` | Validates all fields, then `POST /api/v1/projects`. Shows a `Spinner` inside the button while in flight. On success, redirects to `/projects/:id`. On error, shows a `Flash variant="danger"` above the footer with the server message. |

The **Create project** button is disabled until:
- `name` is non-empty and valid.
- `templateId` is selected.
- At least one repository row has both `name` and `url` filled.

---

## 6. Validation Summary

All validation runs on blur for individual fields. On submit, any remaining empty required fields are marked at once.

A `Flash variant="danger"` at the top of the form appears on API errors (e.g. name conflict, server unreachable). It persists until the user dismisses it or a successful submit occurs.

---

## 7. API Endpoints

| Action | Endpoint | Notes |
|--------|----------|-------|
| Load templates | `GET /api/v1/templates` | List available templates for the picker. |
| Load features | `GET /api/v1/features` | List available features for the picker. |
| Check name availability | `GET /api/v1/projects/availability?name=:name` | Called on blur, debounced 300 ms. |
| Submit form | `POST /api/v1/projects` | Body: `{ name, description, visibility, templateId, repositories, featureIds, minRamMb?, minDiskGb? }` |

---

## 8. UX Notes

- The page loads instantly — no critical-path async requests block rendering. Templates and features load independently with inline skeletons.
- The owner picker is visually consistent with GitHub's `owner / repo` pattern, establishing a familiar mental model for developers.
- No wizard steps. All fields are visible at once so experienced users can fill the form in a single pass.
- The **Advanced** section is hidden by default to avoid overwhelming new users with resource tunables they rarely need.
- Features are truly optional — submitting with zero features selected is valid.
- After success, the redirect to the project detail page (`/projects/:id`) allows the user to immediately deploy a workspace via the **Deploy Workspace** CTA.
