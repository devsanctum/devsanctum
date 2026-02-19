# Feature: User Profile & Account Settings

## Purpose
Allow authenticated users to view and manage their own account information. The profile page (`/profile`) exposes read-only public information; the settings page (`/settings`) lets users edit their name, avatar, and credentials, and manage their account lifecycle.

Related pages: referenced by the avatar menu in [navigation.md](../pages/navigation.md) §2.2.

---

## Use Cases

### UC-1: View own profile
The user opens `/profile` and sees their avatar, display name, email address, auth provider(s), account creation date, and platform role. The role badge is informational only — users cannot change their own role.

### UC-2: Update display name
The user changes their display name. The new name is reflected immediately in the topbar avatar menu and across all pages that display it (workspace cards, commit activity rows, etc.).

### UC-3: Update avatar URL
The user provides a new avatar URL (either a direct image URL or a Gravatar URL). The backend validates that the URL is reachable and returns an image content type before accepting it. The frontend updates the avatar in the topbar without a page reload.

### UC-4: Change password (local auth only)
A user with `provider = LOCAL` changes their password by providing their current password (for verification) and a new password (confirmed twice). The backend re-hashes and stores the new password. All existing refresh tokens for this user are invalidated, forcing re-login on other devices.

**Condition**: this use case is only shown and available for `provider = LOCAL` accounts. OAuth-registered users (GitHub, Google) cannot set a password via this flow.

### UC-5: View connected OAuth providers
The user sees which OAuth providers (GitHub, Google) are linked to their account. For each linked provider, the connection date and the provider account associated are displayed.

> Linking additional OAuth providers to an existing local account is deferred to a future release.

### UC-6: Delete account
The user permanently deletes their own account. Before deletion the platform:
1. Shows a confirmation dialog requiring the user to type their email address.
2. Warns if the user owns projects: "You own N project(s). You must transfer or delete them before deleting your account."
3. Stops all running workspaces belonging to the user.
4. Destroys all workspaces owned by the user.
5. Deletes the user record and all associated data (group memberships, etc.).
6. Projects owned by the user must be transferred or deleted prior to deletion (enforced at the API level — returns `409 Conflict` listing the owned projects if any remain).
7. Issues a `user.deleted` audit log entry.

---

## API Endpoints

### `GET /api/v1/users/me`

**Auth**: required.

Returns the authenticated user's full profile.

**Response** (`200 OK`):
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "avatarUrl": "string | null",
  "provider": "LOCAL | GITHUB | GOOGLE",
  "role": "USER | ADMIN",
  "isActive": true,
  "createdAt": "ISO datetime",
  "updatedAt": "ISO datetime"
}
```

---

### `PATCH /api/v1/users/me`

**Auth**: required.

Updates the authenticated user's editable fields.

**Request body** (all fields optional):
```json
{
  "name": "string (1–128 chars)",
  "avatarUrl": "string (valid https URL) | null"
}
```

**Validation**:
- `name`: 1–128 characters, must not be blank.
- `avatarUrl`: if provided, must be a valid `https://` URL. The backend issues a `HEAD` request to verify the URL returns a `2xx` response and a `Content-Type` of `image/*`. If the check fails, returns `422 Unprocessable Entity` with field-level error `{ "field": "avatarUrl", "message": "URL is not a valid image." }`.

**Response** (`200 OK`): same shape as `GET /api/v1/users/me`.

---

### `POST /api/v1/users/me/password`

**Auth**: required. **Condition**: only applicable for `provider = LOCAL` accounts.

Changes the authenticated user's password.

**Request body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 8 chars)",
  "confirmPassword": "string"
}
```

**Validation**:
- `currentPassword` must match the stored hash. If not: `401 Unauthorized` with `{ "field": "currentPassword", "message": "Current password is incorrect." }`.
- `newPassword` and `confirmPassword` must be equal. If not: `422` with `{ "field": "confirmPassword", "message": "Passwords do not match." }`.
- `newPassword` must be ≥ 8 characters.
- `newPassword` must differ from `currentPassword`. If not: `422` with `{ "field": "newPassword", "message": "New password must differ from the current password." }`.

On success:
- The new password is hashed with bcrypt (cost factor ≥ 12).
- All refresh tokens for this user are revoked (rows deleted from the refresh token store or a `tokensRevokedBefore` timestamp is set so existing tokens are rejected).
- Response: `204 No Content`.

**If called by an OAuth-only user**: returns `403 Forbidden` with `{ "message": "Password management is not available for OAuth accounts." }`.

---

### `DELETE /api/v1/users/me`

**Auth**: required.

Permanently deletes the authenticated user's account.

**Request body**:
```json
{
  "confirmEmail": "string"
}
```

**Validation**:
- `confirmEmail` must exactly match the authenticated user's `email`. If not: `422` with field-level error.
- If the user owns any projects: `409 Conflict` with:
  ```json
  {
    "message": "You must transfer or delete all owned projects before deleting your account.",
    "ownedProjects": [{ "id": "uuid", "name": "string" }]
  }
  ```

**On success**:
1. All `RUNNING` workspaces owned by the user are stopped.
2. All workspaces owned by the user are soft-deleted (status → `DESTROYED`), containers removed.
3. The user's group memberships (`GroupMember`) are deleted.
4. The `User` record is soft-deleted (`isActive = false`, `email` salted/obfuscated to prevent re-registration collision on the same email) or hard-deleted depending on platform policy.
5. Audit log entry written: `user.deleted` (actor = the user themselves).
6. Response: `204 No Content`. The client clears the session and redirects to `/`.

---

## UI/UX

### Profile Page (`/profile`)

Read-only view of the current user's account.

| Element | Detail |
|---------|--------|
| Avatar | Large avatar (64 px). Initials fallback. |
| Display name | `Heading` (h1) |
| Email | `Text` (`fg.muted`) |
| Provider badge | `Label` — `LOCAL`, `GITHUB`, or `GOOGLE` |
| Role badge | `Label` — `USER` or `ADMIN` (orange) |
| Member since | "Member since \<date\>" in `fg.muted` |
| Edit link | Button `"Edit profile"` → `/settings` |

---

### Settings Page (`/settings`)

Tabbed layout: **Profile**, **Security**, **Danger Zone**.

#### Profile Tab
- **Name** field — pre-filled, validated on blur.
- **Avatar URL** field — pre-filled. Shows a live preview (`Avatar` 40 px) as the user types a valid URL. Shows error inline if URL is not a valid image.
- **Save changes** button (primary). Spinner while in flight.
- Success: `Flash variant="success"` auto-dismissed after 5 s — "Profile updated."

#### Security Tab
Shown only for `provider = LOCAL` accounts. For OAuth accounts: "Your account uses \<Provider\> for authentication. Password management is not available."

- **Current password** field.
- **New password** field with strength indicator.
- **Confirm new password** field.
- **Update password** button (primary).
- Field-level validation errors mapped from API responses.
- On success: `Flash variant="success"` — "Password updated. You have been signed out on other devices."

#### Danger Zone Tab
- **Delete account** section with a `Flash variant="danger"` warning explaining consequences.
- **Delete my account** button (`danger` variant).
- Clicking opens a confirmation `Dialog`:
  - Title: "Delete your account?"
  - Body: lists consequences (workspace destruction, loss of access).
  - Input: user must type their email address to confirm.
  - Confirm button: "Delete my account" (`danger`), disabled until email matches.
  - If API returns `409`, the dialog stays open and shows the list of owned projects with links to transfer them.
