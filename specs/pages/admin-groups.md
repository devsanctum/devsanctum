# Page Spec: Admin — Groups (`/admin/groups`)

Auth required: **admin only** — non-admin authenticated users are redirected to `/dashboard`. Unauthenticated visitors are redirected to `/login?redirect=/admin/groups`.

Primary goal: let an administrator create and manage user groups — adding members, adjusting in-group roles, and assigning Docker servers.

Shell & navigation: see **[navigation.md](navigation.md) §4**. **Groups** is the active admin sidebar item.

Related pages: [admin-users.md](admin-users.md) (users can also be managed from user rows).
Related spec: [specs/features/admin/user-management.md](../features/admin/user-management.md) — Group Management section (UC-G1 through UC-G8).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Topbar                                             [Avatar ▾]  │
├──────────────────┬──────────────────────────────────────────────┤
│  ← Back to app  │  Admin / Groups                              │
│  ADMINISTRATION  │                                              │
│  Overview        │  ┌── Search ─────────────────────────┐     │
│  INFRASTRUCTURE  │  │ [Search by group name…]            │     │
│  Docker Servers  │  └───────────────────────────────────┘     │
│  Templates       │                              [ + New group ] │
│  Features        │  ┌──────────────────────────────────────┐   │
│  PEOPLE          │  │  Name  Members  Projects  Servers  ⋯ │   │
│  Users           │  │  ──────────────────────────────────   │   │
│  Groups     ◄    │  │  [row]                        [⋯]   │   │
│  Invitations     │  │  [row]                        [⋯]   │   │
│  PLATFORM        │  └──────────────────────────────────────┘   │
│  Audit Logs      │                                              │
│  Configuration   │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

Page root: `PageLayout` with the admin sidebar (see [navigation.md](navigation.md) §4). **Groups** is the active admin sidebar item.

---

## 2. Section: Page Header & Toolbar

- **Breadcrumb**: `Admin / Groups` — `Admin` links to `/admin`.
- **Page heading** (h1): `"Groups"`
- **`+ New group` button** (primary, `PlusIcon`): opens the Create Group dialog (section 4).
- **Search input**: filters the table in real-time (debounced 300 ms) by group name. Clears with an `×` button.

---

## 3. Section: Groups Table

### Columns

| Column | Content | Sortable |
|--------|---------|----------|
| Name | Group name (bold) + optional description (`fg.muted`, one line) | Yes (by name) |
| Members | `CounterLabel` — total member count | No |
| Projects | `CounterLabel` — number of projects this group has access to | No |
| Docker Servers | `CounterLabel` — number of servers assigned to this group | No |
| Actions | `ActionMenu` (`⋯`) per row | — |

### Row action menu (`⋯`)

| Action | Behaviour |
|--------|-----------|
| **View / Edit** | Opens the Group Detail panel (section 5). |
| **Delete** | Opens Delete Group confirmation dialog (section 6). |

### Loading state
Five skeleton rows.

### Empty state
`Blankslate` with `PeopleIcon`:
- Heading: `"No groups yet."`
- Description: `"Groups let you grant access to projects and Docker servers to multiple users at once."`
- CTA: `+ New group` (primary).

---

## 4. Dialog: Create / Edit Group

**Create title**: `"Create a new group"` — **Edit title**: `"Edit group"`

| Field | Rules |
|-------|-------|
| **Name** | Required. 2–64 chars. Must be unique. Validated on blur. |
| **Description** | Optional. Up to 255 chars. |

**Submit**: `"Create group"` / `"Save changes"` (`Button variant="primary"`). Shows `Spinner` while in flight.

On success: dialog closes, the new row appears at the top of the table with a brief `Flash variant="success"`.

---

## 5. Group Detail Panel

Opened by clicking a group row or selecting **View / Edit** from the action menu. Uses a right-side `Drawer` (slide-in from the right) or an expanded row — full-width on mobile.

Organised in three tabs: **Members**, **Projects**, **Servers**.

### 5.1 Members Tab

Table: **Avatar**, **Name / Email**, **In-group role** (dropdown: `Member` / `Manager`), **Remove** button.

- **Add member** row at the top: searchable `TextInput` that filters users by name or email + `Add` button. Added users default to `Member` role.
- Changing an in-group role: confirmed inline (no dialog needed).
- Removing a member: shows a brief inline confirmation `"Remove <name> from this group? [Confirm] [Cancel]"`.

### 5.2 Projects Tab

Table: **Project name**, **Role** (`READ` / `DEPLOY` / `MANAGE`), **Remove** button.

Lists all projects that have assigned this group as a member. These assignments are managed from the project's Access tab — this view is read-only. A note: `"To change a project's access settings, go to the project's Access tab."` with a link.

### 5.3 Servers Tab

Table: **Server name**, **Status** badge, **Remove** button.

- **Add server** row: searchable `Select` listing unassigned Docker servers + `Assign` button.
- Removing: inline confirmation.

---

## 6. Dialog: Delete Group

**Title**: `"Delete <group name>?"`

```
Deleting this group will remove access for its N members
to N projects and N Docker servers.

This action cannot be undone.

          [ Cancel ]   [ Delete group ]
```

- `Delete group` button (`danger`).
- On confirm: `DELETE /api/v1/admin/groups/:id`. The row fades out. A `Flash variant="success"` appears: `"Group deleted."`.

---

## 7. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| List groups | `GET /api/v1/admin/groups?search=&page=&limit=25` | Returns group with member, project, server counts. |
| Create group | `POST /api/v1/admin/groups` `{ name, description? }` | — |
| Edit group | `PATCH /api/v1/admin/groups/:id` `{ name?, description? }` | — |
| Delete group | `DELETE /api/v1/admin/groups/:id` | Returns 409 with impact summary if group has members / assigned resources (client shows warning). |
| List group members | `GET /api/v1/admin/groups/:id/members` | — |
| Add member | `POST /api/v1/admin/groups/:id/members` `{ userId, role }` | — |
| Change member role | `PATCH /api/v1/admin/groups/:id/members/:userId` `{ role }` | — |
| Remove member | `DELETE /api/v1/admin/groups/:id/members/:userId` | — |
| List group servers | `GET /api/v1/admin/groups/:id/servers` | — |
| Assign server | `POST /api/v1/admin/groups/:id/servers` `{ serverId }` | — |
| Remove server | `DELETE /api/v1/admin/groups/:id/servers/:serverId` | — |
