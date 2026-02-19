# Feature: User Group Membership View

## Purpose
Allow authenticated users to browse the groups they belong to, understand their in-group role, and see which projects and Docker servers each group grants them access to. This is a read-only view for regular users; all group management (create, edit, delete, add/remove members) is performed by administrators at `/admin/groups` (see `features/admin/user-management.md` — Group Management section).

Related page: `/groups` — referenced in [navigation.md](../pages/navigation.md) §3.1.

---

## Use Cases

### UC-1: List own groups
An authenticated user opens `/groups` and sees all groups they are a member of, together with their in-group role (`MEMBER` or `MANAGER`) and the member/project/server counts for each group.

Admin users see **all** groups on the platform, not just their own memberships (consistent with their platform-wide visibility).

### UC-2: View group detail
The user expands a group row (or navigates to `/groups/:id`) and sees three read-only sections:

- **Members** — all group members with their avatar, display name, and in-group role.
- **Projects** — all projects the group grants access to, with the role (`READ`, `DEPLOY`, `MANAGE`). Each project name is a link to `/projects/:id` if the user themselves has access; otherwise it is shown as plain text.
- **Docker Servers** — Docker servers assigned to this group (name and status badge only). No resource metrics are shown to non-admin users; admins see full metrics.

### UC-3: Group manager actions
A user with in-group role `MANAGER` can, from the group detail view:
- **Add members**: search for a platform user by name or email and add them with a role of `MEMBER` or `MANAGER`.
- **Change a member's in-group role**: toggle between `MEMBER` and `MANAGER` for any member (except the last `MANAGER` — at least one must remain).
- **Remove a member**: remove a user from the group (with inline confirmation). Cannot remove themselves if they are the sole `MANAGER`.

Group `MANAGER` actions are **not available** to plain `MEMBER` users; their view is fully read-only.

> Creating, renaming, deleting groups, and assigning servers or projects to groups remains admin-only.

---

## Access Control

| Actor | Visible groups | Write access |
|-------|----------------|--------------|
| Regular user (`USER`) | Only groups they belong to | MANAGER: add/remove/role-change on members |
| Admin (`ADMIN`) | All groups | Same as MANAGER on any group; full CRUD via `/admin/groups` |

---

## API Endpoints

### `GET /api/v1/groups`

**Auth**: required.

Returns groups visible to the current user (own memberships for regular users; all groups for admins), with aggregate counts.

**Query parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Filter by group name (case-insensitive substring). |
| `page` | integer | 1 | Page number. |
| `limit` | integer | 25 | Rows per page (max 100). |

**Response** (`200 OK`):
```json
{
  "groups": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string | null",
      "myRole": "MEMBER | MANAGER | null",
      "memberCount": 0,
      "projectCount": 0,
      "serverCount": 0,
      "createdAt": "ISO datetime"
    }
  ],
  "total": 0,
  "page": 1,
  "limit": 25
}
```

`myRole` is `null` only for admin users viewing groups they are not members of.

---

### `GET /api/v1/groups/:id`

**Auth**: required.

Returns full detail for a single group. Non-admin users can only call this endpoint for groups they are a member of; otherwise `403 Forbidden`.

**Response** (`200 OK`):
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "myRole": "MEMBER | MANAGER | null",
  "members": [
    {
      "userId": "uuid",
      "name": "string",
      "email": "string",
      "avatarUrl": "string | null",
      "role": "MEMBER | MANAGER",
      "joinedAt": "ISO datetime"
    }
  ],
  "projects": [
    {
      "projectId": "uuid",
      "name": "string",
      "role": "READ | DEPLOY | MANAGE",
      "accessible": true
    }
  ],
  "servers": [
    {
      "serverId": "uuid",
      "name": "string",
      "status": "ONLINE | OFFLINE | UNREACHABLE"
    }
  ]
}
```

`projects[].accessible` is `true` when the calling user has access to that project (via any of their groups, or as owner). Non-accessible projects are still listed (so the user understands what the group grants) but the `name` field is replaced with `"[Private project]"` for non-admin regular users.

---

### `POST /api/v1/groups/:id/members`

**Auth**: required. **Condition**: caller must be a group `MANAGER` or platform `ADMIN`.

Adds a user to the group.

**Request body**:
```json
{
  "userId": "uuid",
  "role": "MEMBER | MANAGER"
}
```

**Errors**:
- `404` if group or user not found.
- `403` if caller is not a MANAGER or ADMIN.
- `409` if the user is already a member.

**Response**: `201 Created` with the updated member list.

---

### `PATCH /api/v1/groups/:id/members/:userId`

**Auth**: required. **Condition**: caller must be a group `MANAGER` or platform `ADMIN`.

Changes a member's in-group role.

**Request body**:
```json
{
  "role": "MEMBER | MANAGER"
}
```

**Errors**:
- `409` if this would leave the group with zero `MANAGER`s.

**Response**: `200 OK` with the updated member object.

---

### `DELETE /api/v1/groups/:id/members/:userId`

**Auth**: required. **Condition**: caller must be a group `MANAGER` or platform `ADMIN`.

Removes a member from the group.

**Errors**:
- `409` if removing the user would leave the group with zero `MANAGER`s.

**Response**: `204 No Content`.

---

## UI/UX

### Groups List Page (`/groups`)

- **Page heading** (h1): `"Groups"`
- **Search input**: debounced filter by group name.
- **Table columns**: Name + description, My role badge, Members count, Projects count, Servers count, Actions.
- **Row click** or **View** action: opens group detail panel (drawer from the right or inline expand).
- **Empty state**:
  - Regular user with no groups: `"You are not a member of any group. Ask an administrator to add you."` (no CTA).
  - Admin seeing no groups: same as `/admin/groups` empty state (link to create a group).

### Group Detail Panel

Read-only for `MEMBER` role; write-enabled for `MANAGER` and admin.

Three tabs: **Members**, **Projects**, **Servers** — same visual structure as the admin group detail panel described in [admin-groups.md](../pages/admin-groups.md) §5, with write controls hidden for non-managers.

**Manager-only actions** (when `myRole = MANAGER` or user is admin):
- **Add member** row above the members table.
- In-group role dropdown (editable inline).
- **Remove** button per member row (with inline confirmation).
