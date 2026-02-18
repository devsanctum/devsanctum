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

---

## UI/UX

### Configuration Page (`/admin/configuration`)
- Sidebar or tab navigation between sections: **General**, **Email**, **OAuth Providers**, **Workspace Policies**.
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
