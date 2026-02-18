# Admin Feature: User Management

## Purpose
Allow platform administrators to view, manage, and control all user accounts on the platform. Admins can deactivate accounts, change roles, reset credentials, and enforce access policies.

---

## Use Cases

### UC-1: List all users
The admin sees every registered user with their name, email, provider, role, account status, and creation date.

### UC-2: View user details
The admin views a full profile for a specific user: account info, auth provider, projects they belong to, active workspaces, and last login.

### UC-3: Deactivate a user account
The admin disables a user account. The user can no longer log in. Their existing workspaces are stopped. Their data (projects, workspaces) is preserved but inaccessible until the account is reactivated.

### UC-4: Reactivate a user account
The admin re-enables a previously deactivated account. The user can log in again.

### UC-5: Delete a user account
The admin permanently deletes a user. All their owned projects must be transferred or deleted first. Their workspaces are destroyed. This action is irreversible.

### UC-6: Change a user's platform role
The admin promotes a user to `ADMIN` or demotes them to `USER`. Only admins can access the administration panel.

### UC-7: Force-reset a user's password
The admin triggers a password reset email for a user (local auth only). The user must set a new password on next login.

### UC-8: Impersonate a user (future)
An admin can temporarily act as another user for debugging or support purposes. All impersonation events are recorded in the audit log.

---

## Group Management

Admins manage user groups from the same administration area. A group pools users together so that access to projects and Docker servers can be granted at the group level.

### UC-G1: Create a group
The admin provides a group name and optional description. The group is created empty.

### UC-G2: List all groups
The admin sees all groups with their member count, number of assigned projects, and number of assigned Docker servers.

### UC-G3: View group details
The admin views the group's members, projects it has access to (with role), and Docker servers assigned to it.

### UC-G4: Edit group name and description
The admin updates the group's name or description.

### UC-G5: Add a user to a group
The admin (or a group `MANAGER`) searches for a user by name or email and adds them to the group with a role of `MEMBER` or `MANAGER`.

### UC-G6: Change a user's role within a group
The admin or group `MANAGER` changes a member's in-group role between `MEMBER` and `MANAGER`.

### UC-G7: Remove a user from a group
The admin or group `MANAGER` removes a member. If the user has active workspaces in projects only accessible through this group, a warning is shown.

### UC-G8: Delete a group
The admin deletes a group. All `ProjectGroup` and `DockerServerGroup` entries for this group are removed. Users who had access only through this group lose access to the affected projects and servers. A confirmation lists the impact before deletion.

---

## UI/UX

### User List Page (`/admin/users`)
> Groups are managed at `/admin/groups` (see Group Management section below).

#### User List
- Full-width table. Columns: **Avatar**, **Name**, **Email**, **Provider** (badge), **Role** (badge), **Status** (Active / Deactivated), **Last login**, **Created**, **Actions**.
- Search bar by name or email.
- Filters: by role, by status, by provider.
- Row actions: **View**, **Deactivate / Reactivate**, **Change role**, **Delete**.
- Badge colors:
  - Role: `USER` gray, `ADMIN` orange.
  - Provider: `LOCAL` slate, `GITHUB` dark, `GOOGLE` blue.
  - Status: `Active` green, `Deactivated` red.

### User Detail Page (`/admin/users/:id`)
- Profile card: avatar, name, email, provider, role, status, dates.
- **Projects** section: list of projects the user owns or is a member of, with their role per project.
- **Workspaces** section: list of active and recent workspaces.
- **Danger Zone**: Deactivate, Force password reset, Delete.

### Role Change
- Inline dropdown in the table row or a confirmation modal.
- Modal includes a warning when promoting to `ADMIN`.

### Account Deletion Confirmation
- Confirmation modal requiring the admin to type the user's email.
- Pre-deletion check: if the user owns projects, the modal lists them and requires action before proceeding.

---

### Group List Page (`/admin/groups`)
- Table columns: **Name**, **Description**, **Members**, **Projects**, **Docker Servers**, **Actions**.
- CTA: **+ New Group** (top right).
- Row actions: **View / Edit**, **Delete**.

### Group Detail Page (`/admin/groups/:id`)
- Header: group name, description, edit button.
- **Members** tab:
  - Table: avatar, name, email, in-group role (dropdown), **Remove** button.
  - Add member section: user search input + role selector + **Add** button.
- **Projects** tab:
  - Table: project name, owner, role granted to this group, **Remove** button.
  - Note: project-to-group assignment is managed from the project settings page; this tab is read-only.
- **Docker Servers** tab:
  - Table: server name, host, status, **Remove** button.
  - Add server: dropdown of registered servers + **Assign** button.

### Create / Edit Group Drawer
- Fields: **Name** (required), **Description** (optional).
- CTA: **Save**.

### Group Deletion Confirmation
- Modal listing:
  - Number of members who will lose group-based access.
  - Projects affected (those only accessible through this group).
  - Docker servers affected.
- Requires typing the group name to confirm.
