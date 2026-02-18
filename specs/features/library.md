# Feature: Online Library

## Purpose
The platform can browse and import templates and features from an online library hosted in a Git repository. By default the library points to the official DevSanctum repository. Administrators can configure an alternative URL to use a private or self-hosted library.

The library provides a curated set of ready-to-use templates and feature definitions in JSON format. Importing from the library creates local copies that the admin can review and edit before publishing to users.

---

## Library Structure

The canonical library lives at the root of the repository under `library/`:

```
library/
├── features/          # Feature definition files (.json)
│   └── vscode-server.json
└── templates/         # Template definition files (.json)
    └── nodejs.json
```

Each entry is a single JSON file. The filename (without extension) is used as the default `id` when importing.

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
    { "name": "string", "port": 0, "type": "HTTP | HTTPS | WEBSOCKET | CUSTOM" }
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
    { "name": "string", "port": 0, "type": "HTTP | HTTPS | WEBSOCKET | CUSTOM" }
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

### UC-1: Browse the online library
An admin opens the library browser. The platform fetches the list of available templates and features from the configured library URL and displays them as cards. The admin can search and filter by name, category, or Alpine version.

### UC-2: Preview a library entry
The admin clicks a card to see the full definition: packages, features, options, ports, and Docker instructions — all rendered in a read-only formatted view before importing.

### UC-3: Import a template from the library
The admin clicks **Import** on a template card. The platform downloads the JSON, resolves any required features (importing them first if not already present locally), and creates a new local template record. The admin is taken to the edit form to review and adjust before saving.

### UC-4: Import a feature from the library
The admin imports a feature independently. The feature is added to the local feature catalog and becomes available for use in templates.

### UC-5: Update an imported entry
If the library publishes a new version of a template or feature, the platform shows an **Update available** badge on the local entry. The admin can review the diff and choose to apply the update.

### UC-6: Configure a custom library URL
In the administration configuration panel, the admin replaces the default library URL with a custom one (e.g. an internal Git repository). The platform fetches the library index from the new URL on the next refresh.

### UC-7: Refresh the library index
The admin manually triggers a refresh of the library index. The platform re-fetches the list from the configured URL and updates the available entries shown in the browser.

---

## Configuration

The library source URL is set in the platform configuration (see `specs/features/admin/configuration.md`):

| Setting             | Type   | Default                                                                 |
|---------------------|--------|-------------------------------------------------------------------------|
| `libraryUrl`        | string | `https://raw.githubusercontent.com/devsanctum/devsanctum/main/library` |
| `libraryAutoRefresh`| boolean| `true` — refresh the index on platform startup                         |

The platform constructs resource URLs as:
- Feature list index: `{libraryUrl}/features/index.json`
- Single feature: `{libraryUrl}/features/{id}.json`
- Template list index: `{libraryUrl}/templates/index.json`
- Single template: `{libraryUrl}/templates/{id}.json`

---

## UI/UX

### Library Browser Page (`/admin/library`)
- Two tabs: **Templates** and **Features**.
- Each tab shows cards fetched from the configured library URL.
- Card layout: name, description, version badge, Alpine range badge (features), feature badges (templates).
- Search bar and filter by type/version.
- **Refresh** button (top right) to re-fetch the index.
- Each card has:
  - **Preview** — shows the full JSON definition in a formatted read-only panel.
  - **Import** — imports the entry locally (with a confirmation step if a local entry with the same id already exists).
  - **Update available** badge — shown when the remote version is newer than the local imported version.

### Import Flow
1. Admin clicks **Import**.
2. Platform checks for unmet feature dependencies (for templates).
3. If dependencies are missing: a modal lists them with a **Import all** shortcut.
4. On confirm: entries are created locally and the admin is redirected to the edit form.
5. A success toast: "Node.js template imported. Review and save to publish."

### Custom URL Configuration
- Located in `Admin → Configuration → Library` (new section in configuration.md).
- Field: **Library URL** (text input, default pre-filled).
- **Test URL** button: fetches the index and reports success or error.
- **Reset to default** link.
