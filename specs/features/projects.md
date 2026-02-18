# Feature: Projects

## Purpose
A project is the central unit of the platform. It groups one or more Git repositories, selects a template, activates a set of features, and defines who can access it. Users with sufficient permissions deploy workspaces from a project.

---

## Use Cases

### UC-1: Create a project
A user creates a project by providing a name, selecting a template, adding one or more Git repository URLs, selecting features, and setting visibility (public or private).

### UC-2: List accessible projects
A user sees all projects they own or that are accessible through a group they belong to. Public projects are also discoverable by authenticated users.

### UC-3: View project details
A user views the project configuration: repositories, template, features, assigned groups (with roles), and their own effective role (derived from group membership).

### UC-4: Edit a project
The owner or a `MANAGE`-level member can update the project name, description, repositories, template, features, and visibility.

### UC-5: Manage project group access
The owner or a `MANAGE`-level member assigns one or more groups to the project, each with a role (`READ`, `DEPLOY`, `MANAGE`). All members of an assigned group inherit that role on the project. The role can be changed or the group removed at any time.

### UC-6: Transfer ownership (future)
The owner can transfer project ownership to another member.

### UC-7: Delete a project
Only the owner can delete a project. All workspaces must be destroyed first.

### UC-8: Make a project public
The owner or a `MANAGE` member toggles visibility to `PUBLIC`. Public projects are visible to all authenticated users, who can view them but cannot deploy workspaces unless explicitly added as a member.

---

## UI/UX

### Project List Page (`/projects`)
- Card grid or table list, toggleable.
- Each item shows: project name, owner avatar, template badge, visibility badge (`Public` / `Private`), member count, last activity.
- Filter bar: search by name, filter by visibility, filter by role.
- CTA: **+ New Project** (top right).
- Clicking a card navigates to the project detail page.

### New Project Page (`/projects/new`)
- Step-by-step form (wizard or single scrollable page):
  1. **General** — Name, description, visibility.
  2. **Template** — Select from a card grid of available templates.
  3. **Repositories** — Add one or more Git URLs with a short name each.
  4. **Features** — Multi-select feature cards.
  5. **Review** — Summary before saving.
- CTA: **Create Project**.

### Project Detail Page (`/projects/:id`)
- Top section: project name, owner, visibility badge, template badge, CTA **Deploy Workspace**.
- Tabs:
  - **Overview** — Description, repository list, feature list.
  - **Workspaces** — List of workspaces belonging to this project (see workspace feature).
  - **Access** — Group assignment list with roles.
  - **Settings** — Edit form (name, description, repositories, template, features, visibility). Danger zone: delete project.

### Access Tab
- Table: **Group name**, **Member count**, **Role** (dropdown to change), **Remove** button.
- Add group section: searchable group dropdown + role selector + **Assign** button.
- Effective access note: "Users inherit the highest role across all groups they belong to that are assigned this project."
- The owner row is displayed separately above the table and is not editable.
- If a group is removed and its members had workspaces on this project, an inline warning lists those workspaces.

### Visibility Toggle
- Toggle labeled **Private** / **Public** in Settings.
- Changing to Public shows a confirmation modal explaining the implications.

### Role Badge
- `READ` — gray badge.
- `DEPLOY` — blue badge.
- `MANAGE` — purple badge.
- `OWNER` — gold badge.

### New Project Wizard — Access Step
A step is added to the project creation wizard between **Features** and **Review**:

**Step 5 — Access:**
- Assign one or more groups from a searchable dropdown.
- Set a role per group.
- At least one group with `DEPLOY` or `MANAGE` is recommended (warning shown if skipped).
