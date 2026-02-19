# Page Spec: Admin — New / Edit Template (`/admin/templates/new`, `/admin/templates/:id/edit`)

Auth required: **yes, ADMIN role** — redirect to `/login` if unauthenticated; 403 if not admin.

Primary goal: let an admin define or revise a template through a structured, tabbed form without losing unsaved work when switching between configuration sections.

Related features: [templates.md](../features/templates.md), [features.md](../features/features.md).  
Related pages: [admin-templates.md](admin-templates.md) (list / import).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo · Dashboard · Projects · Explore · Admin  [Avatar]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ← Templates                                                     │
│                                                                  │
│  New template               (edit mode: "Edit Node.js")         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ General │ Packages │ Storage │ Services │ Features       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  (active tab content)                                    │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│                                    [ Cancel ]  [ Save template ] │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Page root: `PageLayout` without sidebar. Form is constrained to `max-width: 800px`, centered.  
Tabs: `UnderlineNav` — **General · Packages · Storage · Services · Features**.  
Sticky footer: always visible at the bottom of the viewport.

---

## 2. Navigation Header

Standard admin `Header`. Back link: **← Templates** → `/admin/templates`.

Page `Heading` (h2):
- Create mode: `"New template"`
- Edit mode: `"Edit <template name>"`

---

## 3. Tab: General

Mandatory fields for identity and base environment.

| Field | Type | Required | Detail |
|-------|------|----------|--------|
| **Name** | `TextInput` | Yes | Max 100 chars. Unique. |
| **Description** | `TextInput` (single line) | No | Max 255 chars. Placeholder: `"Short description (optional)"`. |
| **Alpine version** | Two side-by-side `TextInput` (Major / Minor) | Yes | Integers only. Help text below: `"All workspace containers are based on Alpine Linux + s6-overlay."` |
| **Min RAM (MB)** | Numeric `TextInput` | No | Default `256`. Help text: `"Minimum free RAM required on the Docker host before deploying a workspace."` |
| **Min disk (GB)** | Numeric `TextInput` | No | Default `1.0`. One decimal allowed. |

Validation on blur:
- Name empty → `"Name is required."`
- Name taken → `"A template with this name already exists."` (API check on blur, 300 ms debounce).
- Alpine version non-integer → `"Enter a whole number."`
- RAM / disk negative or zero → `"Must be a positive number."`

---

## 4. Tab: Packages

Packages and custom build instructions.

### APK packages

Tag-input component: the user types a package name and presses `Enter` or `,` to add it. Each package appears as a removable `Token` chip. Chips can be reordered by drag-and-drop.

Caption: `"Packages are installed in order with apk add at build time."`

### Docker instructions

Monospace `Textarea`, ~8 rows.  
Placeholder:

```
RUN curl -fsSL https://example.com/install.sh | sh
COPY ./config /etc/myapp/
```

Caption: `"Raw Dockerfile lines appended after the base Alpine + s6-overlay setup. Use sparingly."`

---

## 5. Tab: Storage

Shared folders mounted as named Docker volumes across all workspaces using this template.

Dynamic list of `TextInput` rows, each for one absolute path.

| Element | Detail |
|---------|--------|
| Path input | Full-width `TextInput`. Placeholder: `/home/user`. Must start with `/`. |
| Remove button | `IconButton` with `TrashIcon`, `variant="danger"`, hidden when only one row. |
| Add row | `Button`, `variant="invisible"`, leading `PlusIcon`: `"Add shared folder"`. |

Validation on blur per row:
- Empty → `"Path is required."`
- Does not start with `/` → `"Path must be absolute (start with /)."`
- Duplicate → `"This path is already listed."`

Caption above the list: `"Each path is mounted as a shared volume. Data persists across workspace restarts but is shared by all workspaces of this template."`

---

## 6. Tab: Services

Exposed ports, injected environment variables, and start command.

### Exposed ports

Dynamic list. Each row:

| Field | Detail |
|-------|--------|
| **Port** | Numeric `TextInput`, 1–65535. |
| **Name** | Short `TextInput` (e.g. `web`, `api`). |
| **Protocol** | `Select` dropdown: `HTTP` / `HTTPS` / `TCP`. |
| **Public** | `Checkbox` toggle. Caption: `"Visible to unauthenticated visitors on public projects."` Default: off. |
| **Remove** | `IconButton`, `TrashIcon`, `variant="danger"`. |

Add row: `Button`, `variant="invisible"`, leading `PlusIcon`: `"Add port"`.

### Environment variables

Dynamic key/value table. Each row:

| Field | Detail |
|-------|--------|
| **Key** | `TextInput`. Uppercase letters, digits, underscores only. |
| **Value** | `TextInput`. Supports `{{option.KEY}}` interpolation tokens (shown as hint). |
| **Remove** | `IconButton`, `TrashIcon`, `variant="danger"`. |

Add row: `Button`, `variant="invisible"`, leading `PlusIcon`: `"Add variable"`.

### Start command

Optional full-width `TextInput`. Placeholder: `"/bin/sh /etc/s6/run"`. Caption: `"Overrides the container default start command. Leave blank to use the base image default."`

---

## 7. Tab: Features

Multi-select of available features with per-feature option configuration.

### Feature grid

3-col grid (→ 2 → 1) of toggle cards, matching the style used in the new-project form:

Each card shows:
- Feature name (`Text`, semibold)
- `Label` badge: **Service** (blue) if the feature has an s6-overlay service, **Config only** (gray) otherwise
- Alpine range badge (e.g. `≥ 3.18`)
- Short description (`Text`, `fg.muted`, 2-line clamp)
- Port summary (e.g. `5432/TCP`)

Selected cards have a `2px accent.emphasis` border + `accent.subtle` background.

### Option panel (inline expansion)

When a feature is toggled on, an **options panel** expands directly below the card (collapsible per feature). Each defined option is rendered as:

| Option type | Control |
|-------------|---------|
| `STRING` | `TextInput` |
| `NUMBER` | Numeric `TextInput` |
| `BOOLEAN` | `Checkbox` |
| `SELECT` | `Select` dropdown |

Required options are marked with `*`. If a required option has no value, the card shows a `⚠` warning badge until resolved.

Features with no options show: `"No configurable options for this feature."`

Caption above the grid: `"Selected features are activated for every workspace built from this template. Feature resource requirements are added on top of the template baseline."`

---

## 8. Sticky Footer

Always visible at the bottom of the viewport, separated from content by a `border.default` rule.

```
                                        [ Cancel ]  [ Save template ]
```

| Button | Variant | Behaviour |
|--------|---------|-----------|
| **Cancel** | `default` | Navigates to `/admin/templates`. If unsaved changes exist, shows an `"Unsaved changes"` confirm dialog before leaving. |
| **Save template** | `primary` | Validates all tabs, then `POST /api/v1/templates` (create) or `PUT /api/v1/templates/:id` (edit). Shows `Spinner` inside button while in flight. On success, redirects to `/admin/templates` with a `Flash variant="success"` toast: `"Template saved."`. On error, shows `Flash variant="danger"` above the footer. |

**Save template** is disabled when any required field is empty or has an unresolved validation error (across all tabs). Tabs with errors display a red dot indicator on their tab label.

---

## 9. Unsaved Changes Guard

If the user navigates away (browser back, menu link) with unsaved changes, a `Dialog` is shown:

```
Discard unsaved changes?
You have unsaved changes to this template. Leaving will discard them.

                         [ Keep editing ]   [ Discard changes ]
```

---

## 10. Edit mode specifics

When editing an existing template (`/admin/templates/:id/edit`):

- Form is pre-populated with the template's current values.
- An info callout is shown at the top of the **General** tab:  
  `"Changes apply to future workspace provisioning only. Running workspaces are not affected."`
- If the template is used by projects, the **Alpine version** field shows an additional warning on change:  
  `"Changing the Alpine version may break existing APK package lists and feature compatibility."`

---

## 11. API Endpoints

| Action | Endpoint | Notes |
|--------|----------|-------|
| Load template (edit) | `GET /api/v1/templates/:id` | Full definition including features and option values. |
| Load features | `GET /api/v1/features` | For the features tab picker. |
| Check name availability | `GET /api/v1/templates/availability?name=:name` | Debounced 300 ms on blur. Excluded from check when editing and name is unchanged. |
| Create template | `POST /api/v1/templates` | Full template body. |
| Update template | `PUT /api/v1/templates/:id` | Full template body. |
