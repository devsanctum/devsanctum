# Page Spec: Admin — Invitations (`/admin/invitations`)

Auth required: **admin only** — non-admin authenticated users are redirected to `/dashboard`. Unauthenticated visitors are redirected to `/login?redirect=/admin/invitations`.

Primary goal: let an administrator send invitations to new users, monitor pending invitations, resend or revoke them, and consult the invitation history.

Shell & navigation: see **[navigation.md](navigation.md) §4**. **Invitations** is the active admin sidebar item.

Related pages: [admin-users.md](admin-users.md) (user list, where the `+ Invite user` button also triggers an invitation dialog).
Related spec: [specs/features/admin/invitations.md](../features/admin/invitations.md) (full domain model and use cases).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Topbar                                             [Avatar ▾]  │
├──────────────────┬──────────────────────────────────────────────┤
│  ← Back to app  │  Admin / Invitations                         │
│  ADMINISTRATION  │                                              │
│  Overview        │  [ Pending ]  [ History ]     [ + Invite ]  │
│  INFRASTRUCTURE  │                                              │
│  Docker Servers  │  ┌──────────────────────────────────────┐   │
│  Templates       │  │  Email  Role  Sent  Expires  Status  │   │
│  Features        │  │  ────────────────────────────────────  │   │
│  PEOPLE          │  │  [row]                       [⋯]     │   │
│  Users           │  │  [row]                       [⋯]     │   │
│  Groups          │  └──────────────────────────────────────┘   │
│  Invitations ◄   │                                              │
│  PLATFORM        │                                              │
│  Audit Logs      │                                              │
│  Configuration   │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

Page root: `PageLayout` with the admin sidebar (see [navigation.md](navigation.md) §4). **Invitations** is the active admin sidebar item.

---

## 2. Section: Page Header & Tabs

- **Breadcrumb**: `Admin / Invitations` — `Admin` links to `/admin`.
- **Page heading** (h1): `"Invitations"`
- **`+ Invite user` button** (primary, `MailIcon`): opens the Invite User dialog (section 4).
- **Tab bar** (`UnderlineNav`):
  - **Pending** (default active) — shows invitations with status `PENDING` or `EXPIRED`.
  - **History** — shows `ACCEPTED` and `REVOKED` invitations.

---

## 3. Section: Pending Tab

### Table columns

| Column | Content |
|--------|---------|
| Email | Invited email address |
| Role | `Label` — `Admin` (`attention`), `User` (`secondary`) |
| Sent by | Avatar + name of the admin who sent the invite |
| Sent at | Relative date (absolute on hover via `Tooltip`) |
| Expires at | Absolute date — amber when < 24 h remaining, red when expired |
| Status | `Label` — `PENDING` (`accent`), `EXPIRED` (`secondary`) |
| Actions | `ActionMenu` (`⋯`) per row |

### Row action menu (`⋯`)

| Action | Condition | Behaviour |
|--------|-----------|-----------|
| **Resend** | Always | `POST /api/v1/invitations/:id/resend`. Generates a new token, resets expiry. On success: `Flash variant="success"` — `"Invitation resent to <email>."`. Row expiry date updates. |
| **Revoke** | Status `PENDING` | Inline confirmation in the row (no modal): `"Revoke invitation to <email>? [Confirm] [Cancel]"`. On confirm: `DELETE /api/v1/invitations/:id`. Row fades out. |

### Empty state (no pending invitations)
`Blankslate` with `MailIcon`:
- Heading: `"No pending invitations."`
- Description: `"Invite users to give them access to the platform."`
- CTA: `+ Invite user` (primary).

### Loading state
Five skeleton rows.

---

## 4. Section: History Tab

### Table columns

| Column | Content |
|--------|---------|
| Email | Invited email address |
| Role | `Label` badge |
| Invited by | Avatar + admin name |
| Sent at | Relative date |
| Status | `Label` — `ACCEPTED` (`success`), `REVOKED` (`danger`) |
| Accepted at | Absolute timestamp (only for `ACCEPTED`); `—` otherwise |
| Account | Avatar + name linked to `/admin/users/:id` (only for `ACCEPTED`); `—` otherwise |

### Filters
- Date range filter: `Sent from` and `Sent to` date pickers.
- Invited-by filter: `Select` listing admin names.

### Empty state
`"No invitation history yet."` — neutral, no CTA.

---

## 5. Dialog: Invite User

Triggered by **`+ Invite user`**.

**Title**: `"Invite a new user"`

```
Email *
[________________________________]

Role
● User (default)   ○ Admin

           [ Cancel ]   [ Send invitation ]
```

| Field | Rules |
|-------|-------|
| Email | Required. Valid email format. Validated on blur. |
| Role | Radio — `User` or `Admin`. Default: `User`. |

**Submit**: `Button variant="primary"`: `"Send invitation"`. Shows `Spinner` while in flight.

**On success**: dialog closes, a `Flash variant="success"` appears on the page: `"Invitation sent to <email>."`. The Pending tab refreshes.

**On error — email already registered**: `"An account already exists for this email address."` inline under the Email field.

**On error — invitation already pending**: `"A pending invitation already exists for this email."` with a `"Resend instead"` inline link that triggers the resend flow for the existing invitation.

---

## 6. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| List pending invitations | `GET /api/v1/invitations?status=pending,expired&page=&limit=25` | — |
| List history | `GET /api/v1/invitations?status=accepted,revoked&from=&to=&invitedById=&page=&limit=25` | — |
| Send invitation | `POST /api/v1/invitations` `{ email, role }` | — |
| Resend invitation | `POST /api/v1/invitations/:id/resend` | — |
| Revoke invitation | `DELETE /api/v1/invitations/:id` | — |
