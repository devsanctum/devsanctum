# Page Spec: Admin — Feature Management (`/admin/features`)

Auth required: **admin only** — non-admin authenticated users are redirected to `/dashboard`. Unauthenticated visitors are redirected to `/login?redirect=/admin/features`.

Primary goal: let an administrator browse all available features, create custom ones, and import community-published features from the library marketplace — without leaving the platform.

Shell & navigation: see **[navigation.md](navigation.md) §4**. **Features** is the active admin sidebar item.

Related pages: [admin-templates.md](admin-templates.md) (features are selected when building a template), [admin-template-form.md](admin-template-form.md).
Related spec: [specs/features/features.md](../features/features.md) (full domain model, option types, dependency rules), [specs/features/library.md](../features/library.md) (index files, caching, API).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Topbar                                             [Avatar ▾]  │
├──────────────────┬──────────────────────────────────────────────┤
│  ← Back to app  │  Admin / Features                            │
│  ADMINISTRATION  │                                              │
│  Overview        │  ┌── Filters ──────────────────────────┐   │
│  INFRASTRUCTURE  │  │ Search by name         Type ▾       │   │
│  Docker Servers  │  └─────────────────────────────────────┘   │
│  Templates       │  [ ↓ Browse library ]  [ + New Feature ]   │
│  Features   ◄    │                                              │
│  PEOPLE          │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐      │
│  Users           │  │card │  │card │  │card │  │card │  …    │
│  Groups          │  └─────┘  └─────┘  └─────┘  └─────┘      │
│  Invitations     │                                              │
│  PLATFORM        │                                              │
│  Audit Logs      │                                              │
│  Configuration   │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

Page root: `PageLayout` with the admin sidebar (see [navigation.md](navigation.md) §4). **Features** is the active admin sidebar item.

Card grid: 4 cols → 3 on tablet → 1 on mobile.

---

## 2. Section: Page Header & Toolbar

- **Breadcrumb**: `Admin / Features` — `Admin` links to `/admin`.
- **Page heading** (h1): `"Features"`
- **`+ New Feature` button** (primary): navigates to `/admin/features/new`.
- **`↓ Browse library` button** (default, with `SearchIcon`): opens the Library Marketplace Drawer (section 5).
- **Search input**: filters the card grid in real-time (debounced 300 ms) by feature name.
- **Type filter** (`Select`): options `All types`, `Service` (has an s6-overlay service), `Config only` (no service). Defaults to `All types`.

---

## 3. Section: Feature Card Grid

### Feature card

```
┌──────────────────────────────────────────┐
│  [●] VS Code Server           [Service]  │
│  Browser-accessible VS Code editor…      │
│                                          │
│  ≥ Alpine 3.18   512 MB   0.5 GB disk   │
│  APK: nodejs, npm (+0 more)              │
│  Ports: 8080/HTTP                        │
│  Requires: —                             │
│                                          │
│  Used by 3 templates                     │
│                                          │
│  [ Edit ]  [ Delete ]                    │
└──────────────────────────────────────────┘
```

| Element | Detail |
|---------|--------|
| Name | Bold, `fg.default` |
| Type badge | `Label variant="accent"` — **Service** if `serviceName` is set; `Label variant="secondary"` — **Config only** otherwise |
| Description | One line, `fg.muted`, truncated with `Tooltip` for full text |
| Alpine range | `≥ 3.x` or `3.x – 3.y`, shown as a small `Label` |
| Resource badges | Minimum RAM (MB) and disk (GB) — hidden if both are 0 |
| APK packages | First 2 package names + `(+N more)` if exceeded |
| Ports | `port/TYPE` chips, up to 3 — `(+N more)` if exceeded |
| Requires | Comma-separated names of required features — hidden if none |
| Usage count | "Used by N templates" (`fg.muted`). 0 templates shows "Not used by any template" |
| Edit button | `Button variant="default"` → `/admin/features/:id/edit` |
| Delete button | `Button variant="danger" size="small"` — opens Delete confirmation dialog (section 6). Disabled with `Tooltip` "In use by N templates — remove from all templates before deleting." when `usageCount > 0` or when other features depend on this one. |

### Loading state
Eight skeleton cards matching the card height.

### Empty state (no features match filters)
`Blankslate` — "No features match your search." with a `Clear filters` button.

### Empty state (no features at all)
`Blankslate` with `PackageIcon`:
- Heading: "No features yet."
- Description: "Features are reusable add-ons that extend workspace templates. Create your first or import one from the community."
- CTAs: `+ New Feature` (primary) and `↓ Import` (default).

---

## 4. Page: Create / Edit Feature (`/admin/features/new`, `/admin/features/:id/edit`)

This is a full page (not a dialog) given the form's length and complexity.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                          │
├─────────────────────────────────────────────────────────────────┤
│  Admin / Features / New feature                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  General          ─────────────────────────────────────  │  │
│  │  Alpine compat    ─────────────────────────────────────  │  │
│  │  Resources        ─────────────────────────────────────  │  │
│  │  APK Packages     ─────────────────────────────────────  │  │
│  │  Docker instr.    ─────────────────────────────────────  │  │
│  │  s6 Service       ─────────────────────────────────────  │  │
│  │  Ports            ─────────────────────────────────────  │  │
│  │  Env Variables    ─────────────────────────────────────  │  │
│  │  Options          ─────────────────────────────────────  │  │
│  │  Dependencies     ─────────────────────────────────────  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [ Cancel ]                              [ Save feature ]        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Each section is visually separated. Refer to `specs/features/features.md` → "Create / Edit Feature Form" for the full field definitions. The sections below document page-level UX behaviour only.

### Validation

- Required fields: **Name**, **Min Alpine version**.
- All fields validate on blur; `FormControl.Validation` messages appear inline.
- The `Save feature` button is always enabled — validation runs on submit and scrolls to the first error.
- Circular dependency check for the Dependencies section runs client-side in real time as features are selected.

### Save behaviour

- `POST /api/v1/admin/features` (new) or `PATCH /api/v1/admin/features/:id` (edit).
- On success: redirect to `/admin/features` with a `Flash variant="success"` — "Feature `<name>` saved." (auto-dismisses in 5 s).
- On error: `Flash variant="danger"` pinned below the toolbar — does not redirect, preserves form state.

### Edit-specific behaviour

- On load: form is pre-populated from `GET /api/v1/admin/features/:id`.
- If the feature is in use by templates, a persistent `Flash variant="warning"` is shown at the top of the form: "This feature is used by N template(s). Changes apply to future deployments only — existing workspaces are not affected."

### Cancel behaviour

If the form is dirty (any field changed), shows a native browser `confirm()` dialog — "Discard unsaved changes?" — before navigating away. If clean, navigates directly to `/admin/features`.

---

## 5. Drawer: Library Marketplace

Triggered by `↓ Browse library`. Opens as a right-side full-height panel (not a modal — the list page remains visible underneath). Follows the shared marketplace pattern described in `specs/features/library.md` → "Marketplace Drawer".

### Layout

```
┌──────────────────────────────────────────┐
│  Browse feature library           [ × ]  │
│  ────────────────────────────────────    │
│  [ 🔍 Search features… ]                 │
│  Tags: [editor] [database] [runtime] …  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  VS Code Server       v1.0.0       │  │
│  │  [Service]  ≥ Alpine 3.18  512 MB  │  │
│  │  Browser-accessible VS Code IDE…   │  │
│  │  [editor] [ide]   [✓ Imported]  ↓  │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  PostgreSQL           v2.1.0       │  │
│  │  [Service]  ≥ Alpine 3.18  256 MB  │  │
│  │  Postgres 16 database server       │  │
│  │  [database]           [ Import ]   │  │
│  └────────────────────────────────────┘  │
│  …                                       │
│  ─────────────────────────────────────   │
│  Source: github.com/devsanctum  🟢  [↻]  │
└──────────────────────────────────────────┘
```

### Search & filter
- `TextInput` with `SearchIcon` — instant client-side filtering of the cached index by name and description.
- Tag chips below — toggling a tag narrows the results. Multiple tags act as OR.
- Type chip — toggle `Service` / `Config only` alongside tag filters.

### Entry card
| Element | Detail |
|---------|--------|
| Name + version | `Text` semibold + `Label` secondary |
| Type badge | `Label variant="accent"` **Service** or `Label variant="secondary"` **Config only** |
| Alpine range | Small `Label` |
| RAM | Shown only when > 0 |
| Description | 2-line clamp, `fg.muted` |
| Tag chips | Small `Label` components |
| `✓ Imported` | `Label variant="success"` — shown when a local feature with the same `id` exists |
| `↑ Update` | `Label variant="attention"` — shown when library version > local imported version |
| `Import` / `↓` button | `Button variant="primary" size="small"` — `↓` icon when already imported (re-import) |

### Import behaviour
1. Admin clicks **Import** — button shows `Spinner`, disabled.
2. Backend calls `POST /api/v1/library/features/:id/import` (downloads + validates + stores locally if not cached).
3. On success: badge updates to `✓ Imported`, inline `Flash variant="success"` inside the drawer — `"<name> imported. [ Edit → ]"`. Drawer stays open.
4. On re-import: replaces the existing local feature without extra confirmation. The local record is updated.
5. On error: inline `Flash variant="danger"` below the card; button resets.

### Loading state
On drawer open: fetches `GET /api/v1/library/features`. While loading: 4 skeleton rows. On failure: `Flash variant="danger"` — "Could not reach the library." + **Retry** button.

### Footer
Source URL, freshness status (🟢 / 🟡 stale / 🔴 unreachable), last updated timestamp, `[↻]` Refresh button.

---

## 6. Dialog: Delete Feature

Triggered by the `Delete` button on a card.

**Title**: "Delete `<feature name>`?"

```
┌──────────────────────────────────────────────────────┐
│  Delete "VS Code Server"?                             │
│                                                       │
│  This will permanently delete this feature definition │
│  and remove it from all templates that use it.        │
│                                                       │
│  Type the feature name to confirm:                    │
│  [___________________]                                │
│                                                       │
│  [ Cancel ]                   [ Delete feature ]      │
└──────────────────────────────────────────────────────┘
```

- The `Delete feature` button (danger) is disabled until the typed name matches exactly (`feature.name`).
- The dialog is only reachable when `usageCount === 0` and no other feature depends on it (enforced both client-side via the disabled button and server-side).
- On success: dialog closes, card is removed from the grid optimistically, success `Flash` — "Feature `<name>` deleted." (auto-dismisses in 5 s).
- On error: `Flash variant="danger"` inside the dialog.

---

## 7. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| List local features | `GET /api/v1/admin/features?search=&type=` | Returns features with `usageCount` and `requiredBy` list. |
| Get local feature | `GET /api/v1/admin/features/:id` | Used to populate the edit form. |
| Create feature | `POST /api/v1/admin/features` | Admin only. |
| Update feature | `PATCH /api/v1/admin/features/:id` | Admin only. |
| Delete feature | `DELETE /api/v1/admin/features/:id` | Admin only. Returns 409 if in use. |
| Browse library features | `GET /api/v1/library/features?search=&tag=` | Returns cached index entries. `stale: true` when index is outdated. |
| Get library feature detail | `GET /api/v1/library/features/:id` | Downloads + caches the full definition on demand. |
| Import from library | `POST /api/v1/library/features/:id/import` | Creates a local feature from the library definition. |
| Refresh library index | `POST /api/v1/library/refresh` | Forces re-fetch of both index files. |

---

## 8. UX Notes

- The card grid refreshes automatically after a create, import, or delete — no manual page reload.
- The library drawer stays open after an import so the admin can import several features in one session without reopening it.
- There is no manual URL input for individual files. The library index is the only import surface. If an admin needs a feature not in the library, they use `+ New Feature` to create it from scratch.
- Re-importing (overwriting) a locally customised feature with a library version does not require extra confirmation — the admin chose the library card explicitly.
- The `Update available` badge signals when a newer library version exists; the admin decides when to pull the update.
- Delete is blocked client-side (disabled button + tooltip) when the feature is in use — this prevents the error dialog from ever being needed for in-use features.
- On the edit form, the dirty-state check uses a shallow comparison of the form values against the originally loaded values.
