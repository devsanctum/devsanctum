# Feature: Templates

## Purpose
Templates define reusable environment blueprints used when provisioning workspace containers. A template specifies the Alpine Linux version, the APK packages to install, shared folder mounts, optional raw Dockerfile instructions, exposed ports, default environment variables, and the set of features (with per-feature options) to activate. All workspace containers are built on **Alpine Linux + s6-overlay** as the base. Projects reference a template to determine how their workspaces are built.

---

## Use Cases

### UC-1: Create a template
An admin defines a new template by providing:
- A name and optional description.
- The **Alpine Linux version** (major + minor, e.g. `3.19`).
- A list of **APK packages** to install at build time (e.g. `nodejs`, `npm`, `git`).
- A list of **shared folders** — absolute paths mounted as shared volumes across all workspaces (e.g. `/home/user/projects`).
- Optional **Docker instructions** — raw Dockerfile directives appended after the base setup (e.g. `RUN npm install -g typescript`).
- **Exposed ports** with protocols.
- **Default environment variables**.
- An optional **start command** override.
- **Minimum resource requirements**:
  - **`minRamMb`** — minimum free RAM in MB the Docker host must have before a workspace from this template can be deployed (default: 256).
  - **`minDiskGb`** — minimum free disk space in GB required on the Docker host (default: 1.0).
- A selection of **features** with per-feature option overrides (e.g. PostgreSQL version, default database name).

### UC-2: List all templates
Any authenticated user can browse available templates to understand what environments are available when creating a project.

### UC-3: Edit a template
An admin updates an existing template. Changes apply to future workspace provisioning only — existing running workspaces are not affected.

### UC-4: Delete a template
An admin deletes a template. Deletion is blocked if any project currently references it. The admin must re-assign those projects first.

### UC-5: Preview a template
A user can view the full details of a template (Alpine version, packages, features, ports, env vars) before selecting it for a project.

### UC-6: Import a template from the online library
An admin opens the library browser (`/admin/library`), finds a template, and clicks **Import**. The platform downloads the JSON definition, resolves any required features (importing them first if absent locally), and creates a new local template ready for review. See `specs/features/library.md` for the full import flow.

---

## UI/UX

### Template List Page (`/admin/templates` for admin, `/templates` for users browsing)
- Card grid layout. Each card shows:
  - Template name
  - Docker image reference
  - Short description
  - Number of projects using it
- Search bar to filter by name or image.
- Admin CTA: **+ New Template** (top right).
- Each card has an **Edit** and **Delete** action (admin only).

### Template List Page (`/admin/templates` for admin, `/templates` for users browsing)
- Card grid layout. Each card shows:
  - Template name
  - Alpine version badge (e.g. `Alpine 3.19`)
  - Short description
  - Feature badges (icons of activated features)
  - Number of projects using it
- Search bar to filter by name.
- Admin CTA: **+ New Template** (top right).
- Each card has an **Edit** and **Delete** action (admin only).

### Create / Edit Template Form (full page, tabbed layout)

#### Tab 1 — General
- **Name** (required)
- **Description** (optional)
- **Alpine version** — two numeric inputs side by side: **Major** and **Minor** (e.g. `3` / `19`). Help text: "All workspace containers are built on Alpine Linux + s6-overlay."

#### Tab 2 — Packages
- **APK packages** — tag input field. The user types a package name and presses Enter to add it. Each package appears as a removable chip. Packages are installed in order.
- **Docker instructions** — monospace textarea. Raw Dockerfile lines appended after the base image setup. Placeholder: `RUN curl -fsSL https://... | sh`.

#### Tab 3 — Storage
- **Shared folders** — dynamic list of absolute path inputs. Each path is mounted as a Docker volume shared across all workspaces using this template. Add/remove rows. Example: `/home/user`, `/workspace/shared`.

#### Tab 4 — Services
- **Exposed ports** — dynamic list: port number + protocol dropdown (`HTTP` / `HTTPS` / `TCP`). Add/remove rows.
- **Environment variables** — dynamic key/value table. Add/remove rows.
- **Start command** — optional text input.

#### Tab 5 — Features
- Multi-select list of available features (card grid with toggle).
- When a feature is toggled on, an **Options** panel expands below it showing the feature's configurable fields (key/value inputs, pre-filled with the feature's defaults).
- Example: enabling PostgreSQL shows inputs for `version`, `defaultDb`, `port`.
- Features with no options show a simple "No options available" note.

- CTA: **Save Template** | **Cancel** (sticky footer).

### Template Detail / Preview Page
- Read-only view of all fields.
- Lists projects that reference this template (linked).

### Deletion guard
- If the template is in use, the delete button shows a warning modal:
  > "This template is used by N project(s). Reassign them before deleting."
- Lists the affected projects with links.
