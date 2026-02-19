# Page Spec: Admin — Templates (`/admin/templates`)

Auth required: **yes, ADMIN role** — redirect to `/login` if unauthenticated; 403 if authenticated but not admin.

Primary goal: let an admin manage the catalogue of environment templates — browse what exists, create new ones from scratch, import ready-made definitions from the online library, edit, and delete.

Related features: [templates.md](../features/templates.md), [library.md](../features/library.md).  
Related pages: [admin-template-form.md](admin-template-form.md) (create / edit form).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo · Dashboard · Projects · Explore · Admin  [Avatar]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Admin                                                          │
│  ── UnderlineNav ──────────────────────────────────────────     │
│  Users   Groups   Templates   Features   Servers   Invitations  │
│                                                                  │
│  Templates               [ Import from library ]  [ + New ]     │
│                                                                  │
│  [ Search templates… ]                                          │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  Node.js      │  │  Python       │  │  Go           │  …    │
│  │  Alpine 3.19  │  │  Alpine 3.19  │  │  Alpine 3.20  │       │
│  │  3 projects   │  │  1 project    │  │  2 projects   │       │
│  │ [Edit][Delete]│  │ [Edit][Delete]│  │ [Edit][Delete]│       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                  │
│  Empty state: "No templates yet.                                 │
│   Create one or import from the library to get started."        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Page root: `PageLayout` without a sidebar. Content is full-width inside the admin shell.

---

## 2. Navigation

Standard authenticated `Header`. The admin section uses an `UnderlineNav` below the header for top-level admin tabs:  
**Users · Groups · Templates · Features · Servers · Invitations**.  
`Templates` is the active tab on this page.

---

## 3. Page Heading & Actions

```
Templates                 [ Import from library ]   [ + New template ]
```

- `Heading` (h2): `"Templates"`.
- Two CTAs aligned to the right of the heading row:
  - **Import from library** — `Button`, `variant="default"`, leading `DownloadIcon`. Opens the [Import Drawer](#5-import-from-library-drawer).
  - **+ New template** — `Button`, `variant="primary"`, leading `PlusIcon`. Navigates to [`/admin/templates/new`](admin-template-form.md).

---

## 4. Template List

### Search bar

Full-width `TextInput` with a `SearchIcon`, placeholder `"Search templates…"`. Filters the grid client-side by name (case-insensitive substring match). No debounce needed — list is small.

### Card grid

Responsive: 3 cols → 2 on tablet → 1 on mobile.

Each **template card**:

```
┌──────────────────────────────────────┐
│  Template name            [Edit] [⋯] │
│  Extends: Node.js base  (if child)   │
│  Alpine 3.19  ·  4 features          │
│                                      │
│  Short description (1-line clamp).   │
│                                      │
│  feat: PostgreSQL  feat: VS Code     │
│                                      │
│  Used by 3 projects                  │
└──────────────────────────────────────┘
```

| Element | Detail |
|---------|--------|
| **Template name** | `Text`, semibold, links to the template edit form. |
| **Edit** | `Button`, `variant="invisible"`, `size="small"`, navigates to `/admin/templates/:id/edit`. |
| **⋯ menu** | `ActionMenu` with a single **Delete** item (`variant="danger"`). |
| **Extends badge** | `Label`, secondary: `"Extends › Parent name"` — shown only when the template has a parent. Clicking it navigates to the parent template's edit form. Hidden for root templates. |
| **Alpine badge** | `Label`, secondary: `"Alpine 3.x"`. |
| **Feature count** | Plain `Text`, `fg.muted`: `"N features"` (effective count, including inherited). |
| **Description** | `Text`, `fg.muted`, 1-line clamp. Hidden if empty. |
| **Feature badges** | Up to 4 `Label` components showing active feature names. `"+N more"` text if exceeded. |
| **Project count** | `CounterLabel` at card bottom: `"Used by N project(s)"`. Muted when 0. |

Cards are loaded with a skeleton grid (3 placeholder cards) while the API response is in flight.

### Empty state

Shown when no templates exist (after load, not during):

```
No templates yet.
Create one from scratch or import a ready-made definition from the online library.
        [ + New template ]   [ Import from library ]
```

Both CTAs are the same as the page heading actions.

### Error state

`Flash variant="danger"` replacing the grid:  
`"Could not load templates."` + **Retry** button.

---

## 5. Import from Library Drawer

Triggered by **Import from library** CTA. Opens as a right-side `Dialog` (full-height panel) without leaving the list page.

### 5.1 Layout

```
┌──────────────────────────────────────────┐
│  Import from library              [ × ]  │
│  ────────────────────────────────────    │
│  [ Search library… ]                     │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Node.js  · Alpine 3.21            │  │
│  │  Node.js runtime with npm and git. │  │
│  │  2 features  ·  v1.2.0             │  │
│  │                          [Import]  │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Python  · Alpine 3.20             │  │
│  │  …                                 │  │
│  │                          [Import]  │  │
│  └────────────────────────────────────┘  │
│  …                                       │
│                                          │
│  Library source: github.com/devsanctum  │
│  [ Configure library URL → ]             │
└──────────────────────────────────────────┘
```

### 5.2 Loading the library

On drawer open the platform fetches the library index. While loading, show 3 skeleton rows. On failure:  
`Flash variant="danger"`: `"Could not reach the library. Check your network or library URL."` + **Retry**.

### 5.3 Library card (per entry)

| Field | Detail |
|-------|--------|
| Name | `Text`, semibold |
| Alpine version | `Label`, secondary |
| Description | `Text`, `fg.muted`, 2-line clamp |
| Feature count | Plain `Text`, `fg.muted` |
| Library version | `Label`, secondary (`v1.2.0`) |
| **Already imported** badge | `Label variant="success"` — shown if a local template with the same library `id` already exists. The **Import** button becomes **Re-import** in that case. |
| **Import / Re-import** | `Button`, `variant="primary"`, `size="small"` |

### 5.4 Import action

On **Import** click:

1. Button shows `Spinner` + `"Importing…"`, disabled.
2. Backend resolves any required features not yet present locally (auto-imports them silently).
3. On success: the drawer entry shows `Flash variant="success"` inline: `"Imported. Review and save →"` with a link to `/admin/templates/:newId/edit`. The rest of the drawer remains open.
4. On failure: inline `Flash variant="danger"` below the card with the error message. Button resets to **Import**.

### 5.5 Library source footer

At the bottom of the drawer, a dimmed line:  
`Library source: github.com/devsanctum/library`  
`Configure library URL →` — navigates to `/admin/configuration` (system settings page), closing the drawer.

---

## 6. Delete Template

Initiated from the **⋯ → Delete** action on a card.

### 6.1 Safe delete (0 projects, 0 children)

`Dialog` confirmation:

```
Delete "Node.js"?
This template is not used by any project. Deleting it is permanent.

                              [ Cancel ]   [ Delete template ]
```

**Delete template**: `Button`, `variant="danger"`. On confirm, `DELETE /api/v1/templates/:id`. On success, card is removed from the grid with a fade-out animation. `Flash variant="success"`: `"Template deleted."` (auto-dismisses 5 s).

### 6.2 Blocked — projects exist

If the template is referenced by one or more projects, the confirmation is replaced by a guard dialog:

```
Cannot delete "Node.js"
This template is used by 3 project(s). Reassign them to another template before deleting.

  · my-api  →
  · frontend-v2  →
  · data-pipeline  →

                                              [ Close ]
```

- Project names are links to `/projects/:id`.
- No destructive action is offered — only **Close**.

### 6.3 Blocked — child templates exist

If the template is used as a parent by other templates, a separate guard dialog is shown (takes priority over the projects check):

```
Cannot delete "Alpine base"
This template is extended by 2 child template(s). Delete or re-parent them before deleting this one.

  · Node.js  →
  · Python   →

                                              [ Close ]
```

- Child template names link to their respective edit forms.
- No destructive action is offered.

---

## 7. API Endpoints

| Action | Endpoint | Notes |
|--------|----------|-------|
| Load templates | `GET /api/v1/templates` | Returns list with project count, child count, and parent name per template. |
| Delete template | `DELETE /api/v1/templates/:id` | Returns 409 if projects exist or child templates exist (includes affected list). |
| Fetch library index | `GET /api/v1/library/templates` | Proxied by backend from the configured library URL. |
| Import library template | `POST /api/v1/library/templates/:libraryId/import` | Returns the new local template `id`. |

---

## 8. UX Notes

- The two CTAs (**+ New template** and **Import from library**) are always co-located so admins can choose their path without hunting.
- Import stays in a drawer rather than a separate page — the admin keeps context of the existing list and can import several entries in one session.
- After an import, the user is taken to the edit form to review before the template becomes visible to users. This prevents accidental publishing of unreviewed definitions.
- Deletion is never optimistic — the guard check (`GET` project count) is performed before showing the confirmation, so the admin always sees accurate information.
