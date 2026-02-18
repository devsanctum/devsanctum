# Feature: Features (Add-ons)

## Purpose
Features are optional add-ons that can be activated on a template to enrich development environments. Each feature is fully self-described: it declares the APK packages it needs, its Alpine compatibility range, Docker build instructions, an s6-overlay service definition (so the feature's process is supervised inside the container), the ports it exposes (with protocol type), and a list of typed configurable options (required or optional with defaults). When a template activates a feature, option values are provided and stored on the `TemplateFeature` join record.

---

## Use Cases

### UC-1: Create a feature
An admin defines a new feature by providing:
- A name and optional description.
- The list of **APK packages** to install.
- The **Alpine version range** (min version, optional max version).
- Optional **Docker instructions** — a raw Dockerfile block (e.g. `COPY`, `RUN`, `ENV`) supporting `{{option.KEY}}` variable interpolation.
- An optional **s6-overlay service**: service name and the content of the `run` script (also supports `{{option.KEY}}` interpolation).
- The **ports** exposed, each with a name, port number, and type (`HTTP`, `HTTPS`, `WEBSOCKET`, `CUSTOM`).
- Default **environment variables** injected into the workspace (support `{{option.KEY}}` interpolation).
- A list of **options**: each option has a key, label, type (`STRING`, `NUMBER`, `BOOLEAN`, `SELECT`), a required flag, and an optional default value.

### UC-2: List all features
Any authenticated user can browse the available features when configuring a project.

### UC-3: Edit a feature
An admin updates an existing feature. Changes apply to future workspace deployments only.

### UC-4: Delete a feature
An admin deletes a feature. Deletion is blocked if any project currently uses it.

### UC-5: Attach a feature to a project
A project manager selects one or more features when creating or editing a project. Each selected feature will be activated for every workspace deployed from that project.

### UC-6: Preview feature details
A user browses the feature catalog and reads what a feature provides: APK packages, Alpine compatibility, exposed ports (with types), injected environment variables, and available options.

### UC-7: Validate option values at template assignment
When a template activates a feature, the platform validates that all `required` options have been given a value and that `SELECT` options contain an allowed value. Validation runs before the template can be saved.

---

## UI/UX

### Feature Catalog Page (`/admin/features` for admin, visible during project setup for all users)
- Card grid layout. Each card shows:
  - Feature name and icon/logo
  - Short description
  - Alpine version range badge (e.g. `≥ 3.18`)
  - APK packages count
  - Exposed ports summary (e.g. `5432/TCP`, `80/HTTP`)
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
  - Dynamic list. Each row: **Name**, **Port number**, **Type** (dropdown: `HTTP` / `HTTPS` / `WEBSOCKET` / `CUSTOM`).
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

### Feature Selection (inside Template create/edit form)
- Multi-select list or toggle cards showing the feature catalog.
- Each toggle shows the feature name, Alpine range badge, and a brief description.
- When a feature is toggled on, an inline **option form** expands below it showing all defined options (required ones highlighted). Values can be filled before saving the template.
- Selected features with unresolved required options show a warning indicator.

### Sidecar behavior indication
- Cards clearly indicate whether a feature deploys an s6-overlay service or is config-only.
- Label badge: **Service** (blue) vs **Config only** (gray).
