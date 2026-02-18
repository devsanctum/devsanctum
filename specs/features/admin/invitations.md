# Admin Feature: Invitations

## Purpose
Allow administrators to invite users to the platform by email. When invitation-only mode is active, this is the only way to create new accounts. Invitations are time-limited, single-use, and can be revoked at any time before they are accepted.

---

## Use Cases

### UC-1: Send an invitation
An admin enters an email address (and optionally a target platform role) and sends an invitation. The platform generates a secure one-time token, stores it with an expiry, and sends an invitation email containing the registration link.

### UC-2: List pending invitations
The admin sees all invitations that have been sent but not yet accepted, along with their expiry status.

### UC-3: Resend an invitation
The admin resends an invitation email for a pending invitation (e.g. if the user lost the original email). A new token is generated and the expiry is reset.

### UC-4: Revoke an invitation
The admin cancels a pending invitation before it is accepted. The token is immediately invalidated.

### UC-5: Accept an invitation (user-facing)
The invited user clicks the link in their email, is taken to the registration form with their email pre-filled, sets their credentials or uses OAuth, and completes account creation. The invitation is marked as accepted.

### UC-6: Handle expired invitation
If a user clicks an expired invitation link, they see an error page. The admin must resend the invitation.

### UC-7: View accepted invitations (history)
The admin can see a log of accepted invitations: who was invited, when, by whom, and when the account was created.

---

## Data Model (additions to database)

| Field        | Type      | Constraints          | Description                                             |
|--------------|-----------|----------------------|---------------------------------------------------------|
| `id`         | `uuid`    | PK                   | Unique identifier                                       |
| `email`      | `string`  | NOT NULL             | Invited email address                                   |
| `token`      | `string`  | UNIQUE, NOT NULL     | Secure random one-time token                            |
| `role`       | `enum`    | NOT NULL             | Intended platform role: `USER` or `ADMIN`               |
| `invitedById`| `uuid`    | FK → User            | Admin who sent the invitation                           |
| `status`     | `enum`    | NOT NULL             | `PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`             |
| `expiresAt`  | `datetime`| NOT NULL             | Token expiry (default: 48 hours from creation)          |
| `acceptedAt` | `datetime`| NULLABLE             | Timestamp when the invitation was accepted              |
| `createdAt`  | `datetime`| NOT NULL             | Invitation creation timestamp                           |

---

## UI/UX

### Invitations Page (`/admin/invitations`)
- Two tabs: **Pending** and **History**.

#### Pending Tab
- Table columns: **Email**, **Role**, **Sent by**, **Sent at**, **Expires at**, **Status**, **Actions**.
- Status badge: `PENDING` (blue), `EXPIRED` (gray).
- Row actions: **Resend**, **Revoke**.
- CTA: **+ Invite User** (top right).

#### History Tab
- Table columns: **Email**, **Role**, **Invited by**, **Sent at**, **Accepted at**, **Account link**.
- Shows accepted and revoked invitations.
- Filter by date range and invited-by.

### Invite User Modal
- Fields:
  - **Email** (required, validated format)
  - **Role** (dropdown: `User` / `Admin`, default: `User`)
- CTA: **Send invitation**.
- On success: toast notification "Invitation sent to <email>."
- On error (email already registered): "An account already exists for this email."
- On error (invitation already pending): "A pending invitation already exists for this email." with an option to resend.

### Revoke Confirmation
- Inline confirmation in the table row (no modal needed):
  > "Revoke invitation to <email>? [Confirm] [Cancel]"

### Email Content
- Subject: "You've been invited to DevSanctum"
- Body:
  - Platform name and logo.
  - Invited-by name.
  - Clear CTA button: **Accept invitation**.
  - Link expiry notice: "This link expires in 48 hours."
  - If the link expires, instruction to contact the admin.
