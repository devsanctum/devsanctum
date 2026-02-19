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
- **Exposed ports** with protocols and public visibility flags.
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

See the dedicated page specs:

- **[specs/pages/admin-templates.md](../pages/admin-templates.md)** — template list, search, import-from-library drawer, and delete guard.
- **[specs/pages/admin-template-form.md](../pages/admin-template-form.md)** — create / edit form (tabbed: General, Packages, Storage, Services, Features).
