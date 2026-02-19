# Feature: Features (Add-ons)

## Purpose
Features are optional add-ons that can be activated on a template to enrich development environments. Each feature is fully self-described: it declares the APK packages it needs, its Alpine compatibility range, Docker build instructions, an s6-overlay service definition (so the feature's process is supervised inside the container), the ports it exposes (with protocol type), and a list of typed configurable options (required or optional with defaults). When a template activates a feature, option values are provided and stored on the `TemplateFeature` join record.

A feature may also declare **required features** — other features that must be activated alongside it. When a template or project enables a feature, all of its required features are automatically included. This prevents incomplete configurations (e.g. a "Prisma Studio" feature that needs "PostgreSQL" to be present).

---

## Use Cases

### UC-1: Create a feature
An admin defines a new feature by providing:
- A name and optional description.
- The list of **APK packages** to install.
- The **Alpine version range** (min version, optional max version).
- **Minimum RAM** (`minRamMb`) — additional RAM this feature requires on the Docker host (default: 0).
- **Minimum disk** (`minDiskGb`) — additional disk space this feature requires on the Docker host (default: 0).
- Optional **Docker instructions** — a raw Dockerfile block (e.g. `COPY`, `RUN`, `ENV`) supporting `{{option.KEY}}` variable interpolation.
- An optional **s6-overlay service**: service name and the content of the `run` script (also supports `{{option.KEY}}` interpolation).
- The **ports** exposed, each with a name, port number, type (`HTTP`, `HTTPS`, `WEBSOCKET`, `CUSTOM`), and a **public visibility** flag (`isPublic`) that indicates whether this port may be shown to unauthenticated visitors on the public project page (default: `false`).
- Default **environment variables** injected into the workspace (support `{{option.KEY}}` interpolation).
- A list of **options**: each option has a key, label, type (`STRING`, `NUMBER`, `BOOLEAN`, `SELECT`), a required flag, and an optional default value.
- A list of **required features**: zero or more other features that must be co-activated whenever this feature is used. Circular dependencies are rejected at save time.

### UC-2: List all features
Any authenticated user can browse the available features when configuring a project.

### UC-3: Edit a feature
An admin updates an existing feature. Changes apply to future workspace deployments only.

### UC-4: Delete a feature
An admin deletes a feature. Deletion is blocked if any project currently uses it, if any template activates it, or if any other feature declares it as a required dependency. All such usages must be resolved before deletion.

### UC-5: Attach a feature to a project
A project manager selects one or more features when creating or editing a project. Each selected feature will be activated for every workspace deployed from that project.

### UC-6: Preview feature details
A user browses the feature catalog and reads what a feature provides: APK packages, Alpine compatibility, exposed ports (with types), injected environment variables, and available options.

### UC-7: Validate option values at template assignment
When a template activates a feature, the platform validates that all `required` options have been given a value and that `SELECT` options contain an allowed value. Validation runs before the template can be saved.

### UC-8: Auto-resolve feature dependencies
When a feature with required dependencies is toggled on (in the template form or project form), the platform automatically selects all missing required features and shows a notice listing which features were auto-added. If an auto-added feature has required options, the user must fill them before saving. Conversely, toggling off a feature that is required by another currently-selected feature is blocked: the dependent feature must be deselected first.

---

## UI/UX

### Feature Catalog Page (`/admin/features` for admin, visible during project setup for all users)
- Card grid layout. Each card shows:
  - Feature name and icon/logo
  - Short description
  - Alpine version range badge (e.g. `≥ 3.18`)
  - APK packages count
  - Exposed ports summary (e.g. `5432/TCP`, `80/HTTP`)
  - **Requires** line: comma-separated names of required features, if any (e.g. `Requires: PostgreSQL`). Hidden when empty.
  - Number of templates using it
- Admin CTA: **+ New Feature** (top right).
- Card actions (admin only): **Edit**, **Delete**.

### Create / Edit Feature Form (full page)
- **General** section:
  - **Name** (required)
  - **Description** (optional)
- **Alpine Compatibility** section:
  - **Min Alpine version** (required, e.g. `3.18`)
  - **Max Alpine version** (optional — leave blank for no upper bound)
- **Resource Requirements** section:
  - **Min RAM (MB)** — numeric input (default: 0). Tooltip: "Additional RAM this feature contributes to the workspace requirement."
  - **Min disk (GB)** — numeric input with one decimal (default: 0). Tooltip: "Additional disk space this feature requires on the target Docker host."
- **APK Packages** section:
  - Dynamic tag-input list of package names (type + Enter to add, click × to remove).
- **Docker Instructions** section:
  - Large textarea for raw Dockerfile instruction block.
  - Inline hint: "Use `{{option.KEY}}` to interpolate option values."
  - Syntax-highlighted editor (Dockerfile mode).
- **s6-overlay Service** section:
  - **Service name** (optional — leave blank for config-only features).
  - **Run script** — textarea for the s6-overlay `run` script content.
  - Inline hint: "Use `{{option.KEY}}` to interpolate option values."
- **Exposed Ports** section:
  - Dynamic list. Each row: **Name**, **Port number**, **Type** (dropdown: `HTTP` / `HTTPS` / `WEBSOCKET` / `CUSTOM`), **Public** toggle (checkbox: whether this port may be shown to unauthenticated visitors on a public project page; default: off).
- **Environment Variables** section:
  - Dynamic key/value table. Values support `{{option.KEY}}` interpolation.
- **Options** section:
  - Dynamic list of option definitions. Each row:
    - **Key** (machine-readable, e.g. `db_password`)
    - **Label** (display name)
    - **Type** (`STRING` / `NUMBER` / `BOOLEAN` / `SELECT`)
    - **Required** toggle
    - **Default value** (disabled when Required is on)
    - **Allowed values** (tag input, only shown for `SELECT` type)
    - Drag handle to reorder.
- CTA: **Save Feature** | **Cancel**.

**Required Features section** (in Create / Edit Feature Form):
- Searchable multi-select list of all other features.
- Each selected dependency appears as a removable `Token` chip.
- Inline cycle-detection: if selecting feature B would create a circular dependency chain, that option is greyed out with a `"Would create a circular dependency"` tooltip.
- Caption: `"These features are automatically activated whenever this feature is used. Use this to declare hard runtime dependencies (e.g. a query UI that requires a database)."` 

### Feature Selection (inside Template create/edit form)
- Multi-select list or toggle cards showing the feature catalog.
- Each toggle shows the feature name, Alpine range badge, and a brief description.
- When a feature is toggled on, an inline **option form** expands below it showing all defined options (required ones highlighted). Values can be filled before saving the template.
- Selected features with unresolved required options show a warning indicator.

### Sidecar behavior indication
- Cards clearly indicate whether a feature deploys an s6-overlay service or is config-only.
- Label badge: **Service** (blue) vs **Config only** (gray).
