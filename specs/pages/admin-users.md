# Page Spec: User Management (`/admin/users`)

Auth required: **admin only** — non-admin authenticated users are redirected to `/dashboard`. Unauthenticated visitors are redirected to `/login?redirect=/admin/users`.

Primary goal: let an administrator browse all registered users, invite new ones, remove accounts, manage group membership, and inspect what each user owns.

Related pages: [dashboard.md](dashboard.md) (admin summary bar links here), [admin-invitations.md](admin-invitations.md) (pending invitations list).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo · Dashboard · Projects · Explore · Admin ▼        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Admin / Users                                                   │
│                                                                  │
│  ┌── Filters ─────────────────────────────┐  [ + Invite user ]  │
│  │ Search by name or email   Role ▾       │                     │
│  └────────────────────────────────────────┘                     │
│                                                                  │
│  ┌── Users table ──────────────────────────────────────────┐   │
│  │  Avatar  Name / Email       Role    Groups   Joined      │   │
│  │  ───────────────────────────────────────────────────     │   │
│  │  [row]                                         [⋯]      │   │
│  │  [row]                                         [⋯]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Showing 1–25 of 42   [ ← Prev ]  [ Next → ]                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Section: Page Header & Toolbar

- **Breadcrumb**: `Admin / Users` — `Admin` links to `/admin`.
- **Page heading** (h1): `"Users"`
- **`+ Invite user` button** (primary, top-right): opens the Invite User dialog (see section 5).
- **Search input**: filters the table in real-time (debounced 300 ms) by `name` or `email`. Clears with an `×` button inside the field.
- **Role filter** (`Select`): options `All roles`, `User`, `Admin`. Defaults to `All roles`.

Filters are applied client-side on the fetched page, and also drive the server query when the user navigates to another page.

---

## 3. Section: Users Table

### Columns

| Column | Content | Sortable |
|--------|---------|----------|
| User | `Avatar` (24 px) + full name (bold) + email (`fg.muted`, smaller) | Yes (by name) |
| Role | `Label` — `Admin` uses `attention` variant, `User` uses `secondary` variant | No |
| Groups | List of group names as small `Label` components. "+N more" if > 3. | No |
| Joined | Relative date (e.g. "3 months ago"), absolute on hover via `Tooltip` | Yes (by `createdAt`) |
| Actions | `ActionMenu` trigger button (`⋯`) per row | — |

### Row action menu (`⋯`)

Each row's `ActionMenu` exposes:

| Action | Condition | Behaviour |
|--------|-----------|-----------|
| **Change role** | Always shown | Inline `Select` in a sub-menu toggling `USER` ↔ `ADMIN`. Confirmation dialog before promoting to Admin. |
| **Manage groups** | Always shown | Opens the Manage Groups dialog (section 6). |
| **View ownership** | Always shown | Opens the Ownership panel (section 7). |
| **Remove user** | Shown for all users except the currently logged-in admin | Opens the Remove User confirmation dialog (section 8). |

The currently logged-in admin's own row does not show `Remove user` and dims the role-change option with a tooltip: "You cannot change your own role."

### Default sort
`createdAt` descending (newest first).

### Loading state
Five skeleton rows matching the table row height (avatar circle + two text lines + label + label row + date).

### Empty state (no users match filters)
`Blankslate` — "No users match your search." with a `Clear filters` button.

### Empty state (no users at all — impossible in practice but handled)
`Blankslate` — "No users yet. Invite someone to get started." with an `+ Invite user` CTA.

---

## 4. Section: Pagination

- Server-side pagination, 25 users per page.
- Controls: `← Previous` / `Next →` buttons + "Showing N–M of total" counter.
- Page state is reflected in the URL: `?page=2&search=alice&role=ADMIN` — allows sharing and browser back.

---

## 5. Dialog: Invite User

Triggered by `+ Invite user`. Uses a `Dialog` component.

### Fields

| Field | Type | Validation |
|-------|------|-----------|
| Email address | `TextInput` (type email) | Required, valid email format, not already registered |
| Role | `Select` — `User` (default), `Admin` | Required |
| Groups | Multi-select (searchable `ActionMenu` with checkboxes) | Optional |

### Behaviour
- On submit: `POST /api/v1/admin/invitations` — sends an invitation email with a sign-up link.
- On success: dialog closes, success `Flash` — "Invitation sent to alice@example.com." (auto-dismisses in 5 s). The Invitations count in the admin summary bar increments optimistically.
- On error (email already exists): field-level `FormControl.Validation` — "This email already has an account."
- On error (other): inline `Flash variant="danger"` inside the dialog — do not close it.

### Cancel behaviour
Dialog closes immediately, no confirmation needed (no destructive action).

---

## 6. Dialog: Manage Groups

Triggered from the row action menu. Uses a `Dialog` component.

**Title**: "Manage groups — `<username>`"

### Content
A searchable list of all platform groups with a checkbox next to each. Groups the user already belongs to are pre-checked.

- Grouped into two sections: `Member of` (checked) and `Available groups` (unchecked).
- Search input filters the list in real-time.
- `Add to new group` shortcut link at the bottom — navigates to `/admin/groups/new` (opens in new tab to avoid losing dialog state).

### Behaviour
- On save: `PUT /api/v1/admin/users/:id/groups` with the full list of selected group IDs.
- On success: dialog closes, groups column in the row updates optimistically.
- On error: `Flash variant="danger"` inside the dialog.

---

## 7. Panel: User Ownership

Triggered from the row action menu. Uses a `PageLayout.Pane` sliding in from the right (or a full `Dialog` on mobile).

**Title**: "`<username>`'s ownership"

### Content

Two subsections, each loading independently:

#### Projects
A list of all projects owned by the user:
- Project name (linked to `/explore/:slug` if public, plain text if private)
- Visibility badge
- Workspace count (`CounterLabel`)
- Created date

Empty state: "No projects."

#### Workspaces
A list of all workspaces owned by the user:
- Workspace name
- Project name
- Status badge (`RUNNING`, `STOPPED`, etc.)
- Last activity relative date

Empty state: "No workspaces."

### Purpose
Gives the admin visibility before removing a user — they can see what data will be orphaned.

---

## 8. Dialog: Remove User

Triggered from the row action menu. Uses a `Dialog` with `variant="danger"`.

**Title**: "Remove `<username>`?"

### Content
- Warning message: "This will permanently delete `<username>`'s account. Their projects and workspaces will remain but become unowned."
- To confirm, the admin must type the user's **email address** in a `TextInput`.
- `Remove user` button (danger variant) is disabled until the typed email matches exactly.

### Behaviour
- On confirm: `DELETE /api/v1/admin/users/:id`.
- On success: dialog closes, user row is removed from the table optimistically, success `Flash` — "User `<email>` has been removed." (auto-dismisses in 5 s).
- On error: `Flash variant="danger"` inside the dialog.

---

## 9. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| List users | `GET /api/v1/admin/users?page=1&limit=25&search=&role=` | Admin only. Returns paginated list with group membership. |
| List groups (for dialogs) | `GET /api/v1/admin/groups` | Admin only. Used to populate group pickers. |
| Change role | `PATCH /api/v1/admin/users/:id` `{ role }` | Admin only. |
| Update groups | `PUT /api/v1/admin/users/:id/groups` `{ groupIds }` | Admin only. Full replacement of group list. |
| User's projects | `GET /api/v1/admin/users/:id/projects` | Admin only. |
| User's workspaces | `GET /api/v1/admin/users/:id/workspaces` | Admin only. |
| Send invitation | `POST /api/v1/admin/invitations` `{ email, role, groupIds }` | Admin only. |
| Remove user | `DELETE /api/v1/admin/users/:id` | Admin only. |

---

## 10. UX Notes

- Filters (`search`, `role`) are debounced 300 ms before triggering a new API request.
- URL query string (`?page`, `?search`, `?role`) is kept in sync so the admin can copy, share, or reload the filtered view.
- Role change and group updates apply optimistically: the row updates immediately, rolls back with an error `Flash` on failure.
- The `Remove user` dialog requires typing the email (not the name) to prevent accidental deletion of accounts with similar display names.
- The Ownership panel is informational only — no actions are available from it. Its purpose is to inform the admin before deciding to remove a user.
- All dialogs trap focus and are closeable with `Escape`.
