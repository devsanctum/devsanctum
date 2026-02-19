# Admin Feature: Configuration

## Purpose
Allow administrators to configure platform-wide settings from the administration panel. This includes authentication policies, OAuth provider credentials, SMTP settings for email delivery, and general platform behavior.

All settings are persisted in an admin-only configuration store. Sensitive values (secrets, keys, passwords) are stored encrypted at rest.

---

## Configuration Sections

### 1. General
Platform identity and global behavior settings.

| Setting              | Type     | Description                                              |
|----------------------|----------|----------------------------------------------------------|
| `platformName`       | string   | Display name of the platform (shown in UI and emails)    |
| `platformUrl`        | string   | Public base URL (used for invitation links, routing)     |
| `defaultUserRole`    | enum     | Default role assigned to new users: `USER` or `ADMIN`    |
| `registrationMode`   | enum     | `OPEN` (anyone can register) or `INVITE_ONLY`            |

### 2. SMTP / Email
Settings for outbound transactional email delivery via Nodemailer.

| Setting         | Type     | Description                                     |
|-----------------|----------|-------------------------------------------------|
| `smtpHost`      | string   | SMTP server hostname                            |
| `smtpPort`      | number   | SMTP port (commonly 465 or 587)                 |
| `smtpSecure`    | boolean  | Use TLS (true for port 465)                     |
| `smtpUser`      | string   | SMTP authentication username                    |
| `smtpPassword`  | string   | SMTP authentication password (stored encrypted) |
| `emailFrom`     | string   | Sender address used in outgoing emails          |

### 3. OAuth Providers
Enable and configure third-party OAuth2 login providers.

#### GitHub
| Setting               | Type     | Description                                         |
|-----------------------|----------|-----------------------------------------------------|
| `githubEnabled`       | boolean  | Enable GitHub OAuth2 login                          |
| `githubClientId`      | string   | GitHub OAuth App client ID                          |
| `githubClientSecret`  | string   | GitHub OAuth App client secret (stored encrypted)   |

#### Google
| Setting               | Type     | Description                                         |
|-----------------------|----------|-----------------------------------------------------|
| `googleEnabled`       | boolean  | Enable Google OAuth2 login                          |
| `googleClientId`      | string   | Google OAuth App client ID                          |
| `googleClientSecret`  | string   | Google OAuth App client secret (stored encrypted)   |

### 4. Workspace Policies
Global defaults for workspace lifecycle management.

| Setting                    | Type    | Description                                                      |
|----------------------------|---------|------------------------------------------------------------------|
| `inactivityStopMinutes`    | number  | Minutes of inactivity before a non-pinned workspace is stopped (default: 120) |
| `autoDestroyDays`          | number  | Days before a non-pinned, non-kept workspace is destroyed (default: 7) |

### 5. Library
Settings for the online template and feature library.

| Setting              | Type    | Description                                                                          |
|----------------------|---------|--------------------------------------------------------------------------------------|
| `libraryUrl`         | string  | Base URL of the library repository (default: `https://raw.githubusercontent.com/devsanctum/devsanctum/main/library`) |
| `libraryAutoRefresh` | boolean | If true, the library index is refreshed on platform startup (default: `true`)        |

---

## Use Cases

### UC-1: View current configuration
The admin sees all platform settings grouped by section. Sensitive fields are masked by default (show/hide toggle).

### UC-2: Update general settings
The admin changes the platform name, URL, or registration mode. A change from `OPEN` to `INVITE_ONLY` shows a confirmation prompt.

### UC-3: Configure SMTP
The admin enters SMTP credentials and sends a test email to verify the configuration. The test result (success / error details) is shown inline.

### UC-4: Enable and configure a GitHub OAuth provider
The admin toggles GitHub OAuth on, enters the Client ID and Secret, and saves. The GitHub login button immediately appears on the login page.

### UC-5: Disable an OAuth provider
The admin toggles an OAuth provider off. Users who registered exclusively via that provider and have no password cannot log in until a reset is issued. A warning is shown before saving.

### UC-6: Update workspace lifecycle policies
The admin changes the inactivity threshold or auto-destroy window. Changes apply to new timer evaluations — active countdown timers are recalculated.

### UC-7: Send a test email
From the SMTP configuration form, the admin sends a test email to their own address without leaving the form.

### UC-8: Configure the library source URL
The admin replaces the default library URL with a custom one (e.g. an internal Git mirror). A **Test URL** button validates that the index is reachable before saving.

### UC-9: Reset library URL to default
The admin clicks **Reset to default** to restore the official DevSanctum library URL.

---

## UI/UX

### Configuration Page (`/admin/configuration`)
- Sidebar or tab navigation between sections: **General**, **Email**, **OAuth Providers**, **Workspace Policies**, **Library**.
- Each section is a card with a form. CTA: **Save changes** (per section, not global).
- Unsaved changes indicator: section tab shows a dot when there are pending changes.

#### General Section
- Registration mode shown as a toggle: **Open registration** / **Invite only**.
- Toggling to invite-only shows an inline notice: "Users will no longer be able to self-register. Only invited users can create accounts."

#### Email Section
- All SMTP fields.
- Password field has show/hide toggle.
- **Send test email** button (secondary). Opens a small inline prompt for the recipient address.
- Test result inline below the button: spinner → green success or red error message.

#### OAuth Providers Section
- One card per provider (GitHub, Google).
- Each card has an **Enabled** toggle at the top.
- Client ID and Client Secret fields appear only when enabled.
- Secret field has show/hide toggle.
- Warning banner when disabling a provider that has active users.

#### Workspace Policies Section
- Two numeric inputs with unit labels (minutes, days).
- Current policy summary shown below: "Workspaces stop after **120 minutes** of inactivity and are destroyed after **7 days** unless kept or pinned."
- Changes trigger a confirmation: "This will affect all future lifecycle timer evaluations."

#### Library Section
- **Library URL** — text input pre-filled with the default GitHub raw URL.
- **Test URL** button — fetches `{url}/templates/index.json` and reports reachability.
- **Reset to default** link below the input.
- **Auto-refresh on startup** toggle.
- Link: "Browse library →" navigates to `/admin/library`.

---

## API Endpoints

### `GET /api/v1/admin/configuration`

**Auth**: required. **Role**: `ADMIN` only.

Returns the full platform configuration. Sensitive fields (SMTP password, OAuth secrets) are returned **masked** (`"••••••••"`) unless the request includes `?reveal=true`, which requires re-authentication (the user must have entered their password in the last 5 minutes — enforced via a `sensitiveConfirmedAt` claim in the JWT).

**Response** (`200 OK`): all fields from the Configuration Sections above.

---

### `PATCH /api/v1/admin/configuration`

**Auth**: required. **Role**: `ADMIN` only.

Partial update — only the fields present in the body are modified.

**Request body**: any subset of the configuration fields.

An audit log entry (`platform.configuration.changed`) is written on every successful update, recording which settings changed (old → new), but **never** logging secret values.

**Response** (`200 OK`): updated configuration (masked).

---

### `POST /api/v1/admin/configuration/test-smtp`

**Auth**: required. **Role**: `ADMIN` only.

Sends a test email using the current (saved or unsaved) SMTP configuration.

**Request body**:
```json
{
  "recipient": "string (valid email)"
}
```

**Response**:
- `200 OK` — `{ "success": true }` if the email was accepted by the SMTP server.
- `422` — `{ "success": false, "error": "string" }` with the SMTP error message.

---

### `GET /api/v1/config/public` _(unauthenticated)_

Exposes a **minimal, non-sensitive** subset of the platform configuration for unauthenticated visitors. Used by the public home page to render the hero section and conditionally show the Register button.

See **[features/public-browsing.md](../public-browsing.md) UC-7** for the full specification of this endpoint.
