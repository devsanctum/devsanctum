# Feature: Public Project Browsing

## Purpose
Allow unauthenticated (public) users to browse projects that have been marked as PUBLIC, view their workspace information, and access the URLs of ports that are explicitly marked as public. This enables teams to share live development environments or demos with external stakeholders without requiring them to create an account.

---

## Use Cases

### UC-1: Browse public projects as an unauthenticated visitor
A visitor navigates to the platform's public project list (`/explore`). The platform displays all projects whose `visibility` is `PUBLIC` without requiring login. Private projects are never shown.

### UC-2: View a public project's details
The visitor clicks a public project card and is taken to the project detail page (`/explore/:projectSlug`). The page shows:
- Project name, description, template badge, and feature list.
- A read-only list of active (RUNNING) workspaces: workspace name, status badge, and creation date.
- No deploy, edit, or access-management controls are shown.

### UC-3: View public workspace ports on a project
For each RUNNING workspace listed on the public project page, the visitor can see the services whose `isPublic` flag resolves to `true`. Each service card shows its name, port, protocol, and a direct **Open** link to the service URL. Services with `isPublic = false` are hidden from the public view.

### UC-4: Access a public workspace service
The visitor clicks the URL of a public port on a running, publicly visible workspace. Because the workspace `visibility` is `PUBLIC`, the service URL is reachable without authentication. If the workspace has since been stopped or destroyed, the platform returns an offline page.

### UC-5: Public browsing of a private project is denied
If a visitor navigates directly to a project detail URL that belongs to a PRIVATE project, the platform returns a 404 (not found) response rather than a 403, to avoid revealing the existence of the project.

---

## UI/UX

### Public Project List Page (`/explore`)
- Accessible without login.
- Card grid layout — identical visual style to the authenticated project list.
- Each card shows: project name, owner avatar, template badge, feature badges, workspace count, last activity.
- Search bar to filter by name.
- No **+ New Project** CTA.
- Navigation bar shows a **Sign in** button (and **Register** if open registration is enabled).

### Public Project Detail Page (`/explore/:projectSlug`)
- Header: project name, template badge, feature list, description.
- No tabs — only a flat read-only view.
- **Active Workspaces** section:
  - Table or card list of RUNNING workspaces: **Name**, **Status**, **Started**, **Public Ports**.
  - The **Public Ports** column lists icon-links for each service whose `isPublic = true`.
  - Stopped or destroyed workspaces are not shown.
- No **Deploy Workspace**, **Settings**, or **Access** sections.

### Public Workspace Services Panel
- Inline per workspace: a chip row of public service links.
- Each chip: `<service-name>` icon + port number + **Open** button.
- Tooltip on hover: full service URL.
- If no public ports are available for a workspace, the workspace row is still shown (ports cell displays "—").

### Navigation — unauthenticated state
- Top navigation shows: **DevSanctum logo**, **Explore** link, **Sign in** button, and **Register** button (if open registration is enabled).
- Authenticated-only links (Dashboard, Projects, Admin) are hidden.
