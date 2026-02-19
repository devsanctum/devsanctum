# Feature: Online Library

## Purpose
The platform can browse and import templates and features from an online library hosted in a Git repository. By default the library points to the official DevSanctum repository. Administrators can configure an alternative URL to use a private or self-hosted library.

The library provides a curated set of ready-to-use templates and feature definitions in JSON format. Importing from the library creates local copies that the admin can review and edit before publishing to users.

---

## Library Structure

The canonical library lives at the root of the repository under `library/`:

```
library/
├── features/
│   ├── index.json          # Feature catalogue index
│   └── vscode-server.json  # Individual feature definition
└── templates/
    ├── index.json          # Template catalogue index
    └── nodejs.json         # Individual template definition
```

Each entry is a single JSON file. The filename (without extension) is used as the default `id` when importing.

---

## Index Files

Each catalogue (`features/` and `templates/`) has a root `index.json`. The format is intentionally minimal: a single JSON object mapping each entry's `id` (which is also its filename without extension) to its current version string.

### `features/index.json`

```json
{
  "vscode-server": "1.0.0",
  "postgres": "2.1.0"
}
```

### `templates/index.json`

```json
{
  "nodejs": "1.2.0",
  "python": "1.0.0"
}
```

Each key is both the **unique identifier** and the **filename** of the full definition (`{key}.json` in the same directory). The version is the only metadata in the index — everything else (name, description, APK packages, options, tags…) lives in the individual file and is fetched on demand.

This keeps the index payload as small as possible: one short string per entry, regardless of how complex each definition is.

---

## Backend Download & Cache Mechanism

### Index refresh

The backend fetches both index files (`features/index.json` and `templates/index.json`) and stores them in the database (`LibraryCache` table) with a `cachedAt` timestamp. The cache is refreshed:
- On platform startup when `libraryAutoRefresh = true`.
- When an admin manually triggers a refresh (`POST /api/v1/library/refresh`).
- When the cached index is older than `libraryIndexTtlMin` minutes (default: 60).

### On-demand individual file download

The index only contains `{ id: version }` pairs. When the frontend requests the details of an entry (for a marketplace card render, preview, or import), the backend:

1. Derives the file URL: `{libraryUrl}/features/{id}.json` or `{libraryUrl}/templates/{id}.json`.
2. Checks `LibraryEntryCache` for a row matching `(id, version)`.
3. **Cache hit**: returns the stored `definition` JSON immediately — no network call.
4. **Cache miss**: fetches `{libraryUrl}/{type}/{id}.json`, validates against the schema, inserts a new `LibraryEntryCache` row, and returns the result.

Because the cache key includes the **version**, a version bump in the index causes a cache miss and triggers a fresh download automatically. Old version rows are kept in the table to allow rollback inspection but are never served to the frontend after a version bump.

### Version-based deduplication

When the marketplace drawer populates its card list, the backend compares each index entry's version against the locally imported version (if any):
- `indexVersion === localVersion` → `✓ Imported` badge.
- `indexVersion > localVersion` → `↑ Update` badge.
- No local record → **Import** button, no badge.

### Failure handling

- If the index fetch fails (network error, non-200, invalid JSON): the `LibraryCache` row is preserved and served stale with `stale: true` in the API response. The drawer shows a warning banner.
- If an individual file fetch fails: the error is returned to the frontend; no partial data is stored in `LibraryEntryCache`.

### Database tables (additions to schema)

| Table | Fields |
|-------|--------|
| `LibraryCache` | `type` (FEATURES \| TEMPLATES), `entries` (JSON — raw `{ id: version }` map), `cachedAt`, `stale` |
| `LibraryEntryCache` | `id`, `type`, `version`, `definition` (JSON), `cachedAt` |

---

## JSON Schemas

### Feature schema

```jsonc
{
  "$schema": "…/library/schemas/feature.schema.json",
  "id": "string",                        // unique machine-readable identifier
  "version": "string",                   // semver (e.g. "1.0.0")
  "name": "string",
  "description": "string",
  "apkPackages": ["string"],             // APK packages to install
  "alpineMinVersion": "string",          // e.g. "3.18"
  "alpineMaxVersion": "string | null",   // null = no upper bound
  "dockerInstructions": "string",        // raw Dockerfile block, supports {{option.KEY}}
  "serviceName": "string | null",        // s6-overlay service name, null = config-only
  "s6RunScript": "string | null",        // content of the s6 run script, supports {{option.KEY}}
  "ports": [
    { "name": "string", "port": 0, "type": "HTTP | HTTPS | WEBSOCKET | CUSTOM", "isPublic": false }
  ],
  "defaultEnv": { "KEY": "value" },      // supports {{option.KEY}}
  "options": [
    {
      "key": "string",
      "label": "string",
      "description": "string",
      "type": "STRING | NUMBER | BOOLEAN | SELECT",
      "required": false,
      "defaultValue": "string | null",
      "selectValues": ["string"] // only for SELECT type, null otherwise
    }
  ]
}
```

### Template schema

```jsonc
{
  "$schema": "…/library/schemas/template.schema.json",
  "id": "string",                        // unique machine-readable identifier
  "version": "string",                   // semver
  "name": "string",
  "description": "string",
  "alpineMajorVersion": 3,
  "alpineMinorVersion": 21,
  "apkPackages": ["string"],
  "sharedFolders": ["string"],           // absolute paths mounted across all workspaces
  "dockerInstructions": "string",        // raw Dockerfile block
  "ports": [
    { "name": "string", "port": 0, "type": "HTTP | HTTPS | WEBSOCKET | CUSTOM", "isPublic": false }
  ],
  "defaultEnv": { "KEY": "value" },
  "features": [
    {
      "featureId": "string",             // matches a feature id in the library or local catalog
      "optionValues": { "key": "value" } // overrides for feature options
    }
  ]
}
```

---

## Use Cases

### UC-1: Browse the library marketplace
An admin opens the library drawer from `/admin/templates` or `/admin/features`. The backend serves the cached index. The admin can search by name/description and filter by tags instantly (client-side against the cached results).

### UC-2: Preview a library entry
The admin clicks a card to expand a read-only preview of the full definition (packages, features, options, ports, Docker instructions). The full JSON is fetched and cached on demand when the preview is first opened.

### UC-3: Import a template from the library
The admin clicks **Import** on a template card. The backend downloads the template's full JSON (if not cached), resolves any required features (auto-importing missing ones), and creates local records. The admin receives an inline link to the edit form.

### UC-4: Import a feature from the library
The admin clicks **Import** on a feature card. The feature is added to the local catalog and becomes available for use in templates.

### UC-5: Re-import / update an entry
When the library publishes a new version, the local card shows an `↑ Update` badge. The admin clicks `↓` to re-import, overwriting the local record with the latest library version. No extra confirmation step.

### UC-6: Configure a custom library URL
In `Admin → Configuration → Library`, the admin replaces the default library URL with a custom one (e.g. an internal Git repository). Saving triggers an automatic index refresh.

### UC-7: Refresh the library index
The admin clicks the `↻` refresh button in the drawer footer. The backend re-fetches both index files and updates the cache. The drawer reflects the updated list immediately.

---

## Configuration

The library source URL is set in the platform configuration (see `specs/features/admin/configuration.md`):

| Setting              | Type    | Default                                                                 |
|----------------------|---------|-------------------------------------------------------------------------|
| `libraryUrl`         | string  | `https://raw.githubusercontent.com/devsanctum/devsanctum/main/library` |
| `libraryAutoRefresh` | boolean | `true` — refresh the index on platform startup                         |
| `libraryIndexTtlMin` | number  | `60` — minutes before the cached index is considered stale             |

The backend constructs individual file URLs as:
- Feature index: `{libraryUrl}/features/index.json`
- Single feature: `{libraryUrl}/features/{id}.json`
- Template index: `{libraryUrl}/templates/index.json`
- Single template: `{libraryUrl}/templates/{id}.json`

The `id` is the key from the index object and matches the filename without extension.

---

## API Endpoints

These endpoints are used by the frontend marketplace UI and proxy all library access through the backend (no direct browser-to-GitHub requests).

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/library/features?search=&tag=` | Returns the cached feature index, filtered by name/description substring and optional tag. Includes `stale: true` when serving a cached response after a failed refresh. |
| `GET /api/v1/library/features/:id` | Returns the full feature definition (fetched + cached on demand). |
| `GET /api/v1/library/templates?search=&tag=` | Returns the cached template index, filtered by name/description substring and optional tag. |
| `GET /api/v1/library/templates/:id` | Returns the full template definition (fetched + cached on demand). |
| `POST /api/v1/library/refresh` | Forces a re-fetch of both index files. Returns `{ features: N, templates: N, cachedAt }`. |
| `POST /api/v1/library/features/:id/import` | Imports the feature into the local catalog. |
| `POST /api/v1/library/templates/:id/import` | Imports the template (and any missing required features) into the local catalog. Returns IDs of all created records. |

---

## UI/UX

### Marketplace Drawer (shared between Templates and Features pages)

Both `/admin/templates` and `/admin/features` expose an **`↓ Browse library`** button that opens a right-side drawer. The drawer is the **only** import surface — there is no manual URL input for individual files. The library index is the single source of truth for what can be imported.

#### Layout

```
┌──────────────────────────────────────────┐
│  Browse library                   [ × ]  │
│  ────────────────────────────────────    │
│  [ 🔍 Search features… ]                 │
│  Tags: [editor] [database] [runtime] …  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  VS Code Server     v1.0.0         │  │
│  │  ≥ Alpine 3.18  ·  512 MB          │  │
│  │  Browser-accessible IDE…           │  │
│  │  [editor] [ide]   [✓ Imported]  ↓  │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  PostgreSQL         v2.1.0         │  │
│  │  ≥ Alpine 3.18  ·  256 MB          │  │
│  │  Postgres database server          │  │
│  │  [database]              [ Import ]│  │
│  └────────────────────────────────────┘  │
│  …                                       │
│  ─────────────────────────────────────   │
│  Source: github.com/devsanctum  🟢  [↻]  │
│  Last updated: 5 minutes ago             │
└──────────────────────────────────────────┘
```

#### Search & filter
- A `TextInput` with `SearchIcon` searches name and description fields from the cached index (instant, client-side after first load).
- Tag chips below the search box filter by tag (multi-select — clicking a tag toggles it, active tags are highlighted).
- Results update immediately as the admin types; no submit button needed.

#### Entry card
- Shows: name, version badge, Alpine range, RAM requirement (features) or feature count (templates), description (2-line clamp), tag chips.
- **Already imported** badge (`Label variant="success"` — `✓ Imported`) if a local record with the same `id` exists. The import button shows `↓` (re-import icon) instead of `Import`.
- **Update available** badge (`Label variant="attention"` — `↑ Update`) when the library version is newer than the locally imported version.

#### Import flow (no wizard, no URL)
1. Admin clicks **Import** (or re-import `↓`).
2. Button shows `Spinner`, disabled.
3. Backend fetches the full definition file (from local cache if available, or downloads it).
4. If dependencies are missing (template importing features): they are auto-imported silently in the same request.
5. On success: entry badge updates to `✓ Imported`. A `Flash variant="success"` appears inside the drawer: `"VS Code Server imported. [ Edit → ]"`. The drawer stays open so the admin can continue browsing and importing.
6. On re-import (overwrite): no extra confirmation — the admin is already on the preview card. The local record is updated.
7. On error: inline `Flash variant="danger"` below the entry card; button resets.

#### Footer
- Library source URL (truncated), status indicator (🟢 fresh / 🟡 stale / 🔴 unreachable).
- Last index update timestamp.
- `[↻]` Refresh button — calls `POST /api/v1/library/refresh`, shows spinner, updates timestamp on success.

### Custom URL Configuration
Remains in `Admin → Configuration → Library`:
- Field: **Library URL** (text input, default pre-filled).
- **Test connection** button: fetches the index and reports entry counts or an error.
- **Reset to default** link.
- Changes take effect immediately on save (triggers an automatic index refresh).
