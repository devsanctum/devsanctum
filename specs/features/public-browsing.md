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

---

## UC-6: Fetch project README for public display

A visitor views a public project's detail page. The backend fetches the `README.md` file from the Git repository configured on the project (via the `ProjectRepository` table) and returns its raw Markdown content. The frontend renders it as sanitised HTML.

**Endpoint**: `GET /api/v1/explore/projects/:slug/readme`

**Auth**: not required.

**Backend behaviour**:
1. Resolve the project by slug; return `404` if not found or `visibility ≠ PUBLIC`.
2. Select the **primary repository** for the project (the first `ProjectRepository` row, or the one flagged as primary if such a flag exists).
3. Attempt to fetch the file at path `README.md` (case-insensitive fallback to `readme.md`, `Readme.md`) from the repository's default branch using an unauthenticated HTTP GET against the raw content URL.
   - GitHub: `https://raw.githubusercontent.com/:owner/:repo/:branch/README.md`
   - GitLab / Gitea: equivalent raw content URL.
4. If the request succeeds, return the raw Markdown string.
5. If the file is not found (`404`) or the repository has no configured URL, return `404`.
6. If the remote request fails (network error, timeout), return `502 Bad Gateway` with `{ "message": "Could not fetch README from the repository." }`.

**Response** (`200 OK`):
```json
{
  "content": "string (raw Markdown)",
  "repoUrl": "string",
  "branch": "string"
}
```

**Security**:
- The returned content is **raw Markdown**. The frontend must sanitise it before rendering (strip `<script>`, `<iframe>`, inline event handlers, `javascript:` hrefs).
- The backend must enforce a maximum response size of **512 KB**. If the upstream response exceeds this limit, return `413` with a human-readable message.
- No credentials are sent to the upstream repository — this endpoint only works for publicly accessible repositories.

**Caching**: responses may be cached by the backend for up to **5 minutes** per `(projectId, branch)` tuple to avoid hammering remote repositories.

---

## UC-7: Fetch public platform configuration

Any visitor to the home page (`/`) needs to know whether open registration is enabled and the platform's description to render the hero section correctly.

**Endpoint**: `GET /api/v1/config/public`

**Auth**: not required.

**Response** (`200 OK`):
```json
{
  "platformName": "string",
  "description": "string | null",
  "allowRegistration": true
}
```

| Field | Source | Description |
|-------|--------|-------------|
| `platformName` | `PlatformConfig.platformName` | Display name of the platform (shown in header and hero). |
| `description` | `PlatformConfig.description` (future field) or a hardcoded default | Subheading shown in the hero section. |
| `allowRegistration` | `PlatformConfig.registrationMode === "OPEN"` | Whether the **Register** button is shown to unauthenticated visitors. |

**Security**: this endpoint must **never** expose SMTP credentials, OAuth secrets, or any other sensitive configuration — only the three fields listed above.
