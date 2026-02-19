# Feature: Projects

## Purpose
A project is the central unit of the platform. It groups one or more Git repositories, selects a template, activates a set of features, and defines who can access it. Users with sufficient permissions deploy workspaces from a project.

---

## Use Cases

### UC-1: Create a project
A user creates a project by providing a name, selecting a template, adding one or more Git repository URLs, selecting features, and setting visibility (public or private).
The user may also set **minimum resource requirements** (`minRamMb`, `minDiskGb`) on the project to override or raise the template baseline. These values are used at workspace deployment time to filter eligible Docker servers.

### UC-2: List accessible projects
A user sees all projects they own or that are accessible through a group they belong to. Public projects are also discoverable by authenticated users and by unauthenticated (public) visitors.

### UC-3: View project details
A user views the project configuration: repositories, template, features, assigned groups (with roles), and their own effective role (derived from group membership).

### UC-4: Edit a project
The owner or a `MANAGE`-level member can update the project name, description, repositories, template, features, visibility, and resource requirements (`minRamMb`, `minDiskGb`).

### UC-5: Manage project group access
The owner or a `MANAGE`-level member assigns one or more groups to the project, each with a role (`READ`, `DEPLOY`, `MANAGE`). All members of an assigned group inherit that role on the project. The role can be changed or the group removed at any time.

### UC-6: Transfer ownership (future)
The owner can transfer project ownership to another member.

### UC-7: Delete a project
Only the owner can delete a project. All workspaces must be destroyed first.

### UC-8: Make a project public
The owner or a `MANAGE` member toggles visibility to `PUBLIC`. Public projects are visible to all authenticated users and to unauthenticated visitors, who can view the project and its running workspaces but cannot deploy workspaces unless explicitly added as a member.

### UC-9: Configure public port visibility
The owner or a `MANAGE` member controls which of the project's exposed ports are visible to unauthenticated visitors. For each port inherited from the template or from an activated feature, the project-level `portVisibility` setting can override the default `isPublic` value declared on the template or feature. Ports set to public are shown (with live URLs) on the public project page for running workspaces.

---

## UI/UX

### Project List Page (`/projects`)
- Card grid or table list, toggleable.
- Each item shows: project name, owner avatar, template badge, visibility badge (`Public` / `Private`), member count, last activity.
- Filter bar: search by name, filter by visibility, filter by role.
- CTA: **+ New Project** (top right).
- Clicking a card navigates to the project detail page.

### New Project Page (`/projects/new`)
See **[specs/pages/new-project.md](../pages/new-project.md)** for the full page specification.

Summary of fields collected:
- **Name** (required) + slug preview
- **Description** (optional)
- **Template** (required) — radio-style card picker
- **Visibility** — Private (default) or Public
- **Repositories** — one or more rows of `{ name, gitUrl }` (at least one required)
- **Features** — optional multi-select card grid
- **Resource overrides** — optional `minRamMb` / `minDiskGb`, collapsed under an *Advanced* section
- CTA: **Create project**.

### Project Detail Page (`/projects/:id`)
- Top section: project name, owner, visibility badge, template badge, CTA **Deploy Workspace**.
- Tabs:
  - **Overview** — Description, repository list, feature list.
  - **Workspaces** — List of workspaces belonging to this project (see workspace feature).
  - **Access** — Group assignment list with roles.
  - **Settings** — Edit form (name, description, repositories, template, features, visibility, resource requirements). Danger zone: delete project.

### Access Tab
- Table: **Group name**, **Member count**, **Role** (dropdown to change), **Remove** button.
- Add group section: searchable group dropdown + role selector + **Assign** button.
- Effective access note: "Users inherit the highest role across all groups they belong to that are assigned this project."
- The owner row is displayed separately above the table and is not editable.
- If a group is removed and its members had workspaces on this project, an inline warning lists those workspaces.

### Visibility Toggle
- Toggle labeled **Private** / **Public** in Settings.
- Changing to Public shows a confirmation modal explaining the implications.

### Public Port Visibility
- Located in Settings, visible only when the project visibility is `PUBLIC`.
- Shows a table of all ports exposed by the selected template and activated features. Columns: **Port**, **Name**, **Type**, **Visible to public** (toggle).
- The **Visible to public** toggle defaults to the `isPublic` value declared on the source template or feature. The project owner or a `MANAGE` member can override this per port.
- Tooltip on each toggle: "When ON, this port's live URL is shown to unauthenticated visitors on the public project page."
- Changes are saved as part of the project settings.

### Role Badge
- `READ` — gray badge.
- `DEPLOY` — blue badge.
- `MANAGE` — purple badge.
- `OWNER` — gold badge.

### Post-creation: Access
After creating a project the user is redirected to the project detail page. Group access is managed from the **Access** tab of that page (see *Access Tab* section above), not during creation. This keeps the creation form lean.
