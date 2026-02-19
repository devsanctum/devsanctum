# Page Spec: Admin — Configuration (`/admin/configuration`)

Auth required: **admin only** — non-admin authenticated users are redirected to `/dashboard`. Unauthenticated visitors are redirected to `/login?redirect=/admin/configuration`.

Primary goal: let administrators manage platform-wide settings in one place — platform identity, registration policy, SMTP, OAuth providers, workspace policies, and library URL.

Shell & navigation: see **[navigation.md](navigation.md) §4**. **Configuration** is the active admin sidebar item.

Related spec: [specs/features/admin/configuration.md](../features/admin/configuration.md) (full setting definitions, use cases, encryption rules).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Topbar                                             [Avatar ▾]  │
├──────────────────┬──────────────────────────────────────────────┤
│  ← Back to app  │  Admin / Configuration                       │
│  ADMINISTRATION  │                                              │
│  Overview        │  [ General ]  [ SMTP ]  [ OAuth ]           │
│  INFRASTRUCTURE  │  [ Workspace Policies ]  [ Library ]        │
│  Docker Servers  │                                              │
│  Templates       │  ── General ─────────────────────────────── │
│  Features        │  Platform name  [_______________]            │
│  PEOPLE          │  Platform URL   [_______________]            │
│  Users           │  Registration   ● Open  ○ Invite-only       │
│  Groups          │  Default role   [ User ▾ ]                  │
│  Invitations     │                                              │
│  PLATFORM        │                         [ Save changes ]     │
│  Audit Logs      │                                              │
│  Configuration ◄ │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

Page root: `PageLayout` with the admin sidebar (see [navigation.md](navigation.md) §4). **Configuration** is the active admin sidebar item.

The content area uses `UnderlineNav` tabs to separate the five configuration sections. Each tab is an independent form with its own **Save changes** button. Unsaved changes on a tab show a `"Unsaved changes"` indicator if the user attempts to navigate away.

---

## 2. Tab: General

| Field | Component | Rules |
|-------|-----------|-------|
| Platform name | `TextInput` | Required. 1–64 chars. Shown in the topbar and emails. |
| Platform URL | `TextInput` (URL) | Required. Used in email links and routing. Must be a valid URL. |
| Registration mode | Radio group — `Open` / `Invite-only` | Changing to `Invite-only` shows a `Dialog` confirmation: `"Switching to invite-only will prevent new self-registration. Existing users are not affected. Continue?"` |
| Default user role | `Select` — `User` / `Admin` | The role assigned to newly registered users. Default: `User`. Changing to `Admin` requires a confirmation dialog. |

CTA: `Button variant="primary"`: **"Save changes"** — saves only this section.

---

## 3. Tab: SMTP / Email

| Field | Component | Rules |
|-------|-----------|-------|
| SMTP host | `TextInput` | Required when any email feature is used. |
| SMTP port | `TextInput` (type number) | Required. Default: `587`. |
| Use TLS | `ToggleSwitch` | Default off. On = port 465 typically. |
| Username | `TextInput` | Required. |
| Password | `TextInput` (type password, visibility toggle) | Required. Stored encrypted. |
| Sender address | `TextInput` (type email) | Required. `From:` header for all outgoing mail. |

**Test email** section below the form:
- `TextInput` for a target email address + `Button variant="default"`: **"Send test email"**.
- On success: `Flash variant="success"` inline: `"Test email sent to <address>."`
- On failure: `Flash variant="danger"` with the SMTP error message.

CTA: **"Save SMTP settings"** (saves, then optionally triggers test).

---

## 4. Tab: OAuth Providers

Two collapsible `Box` sections — **GitHub** and **Google**. Each has an enable/disable `ToggleSwitch` at the top; the credential fields are shown only when enabled.

### GitHub

| Field | Component |
|-------|-----------|
| Enable GitHub login | `ToggleSwitch` |
| Client ID | `TextInput` |
| Client Secret | `TextInput` (password style, visibility toggle) |

### Google

| Field | Component |
|-------|-----------|
| Enable Google login | `ToggleSwitch` |
| Client ID | `TextInput` |
| Client Secret | `TextInput` (password style, visibility toggle) |

Disabling a provider that currently has active user accounts linked to it shows a warning: `"N users log in via <provider>. Disabling this provider will prevent them from logging in until they set a password."`.

CTA: **"Save OAuth settings"**

---

## 5. Tab: Workspace Policies

| Field | Component | Rules |
|-------|-----------|-------|
| Inactivity stop (minutes) | `TextInput` (type number) | Required. Min 5. Default 120. Caption: "Non-pinned workspaces are stopped after this many minutes of inactivity." |
| Auto-destroy (days) | `TextInput` (type number) | Required. Min 1. Default 7. Caption: "Non-pinned, non-kept workspaces are destroyed after this many days." |

CTA: **"Save workspace policies"**

---

## 6. Tab: Library

| Field | Component | Rules |
|-------|-----------|-------|
| Library URL | `TextInput` (URL) | Required. Default: `https://raw.githubusercontent.com/devsanctum/devsanctum/main/library` |
| Auto-refresh on startup | `ToggleSwitch` | Default: on |

**Refresh now** button (`Button variant="default"`, `SyncIcon`): triggers an immediate refresh of the library index cache. Shows a `Spinner` while in progress; on success shows the number of templates and features found.

CTA: **"Save library settings"**

---

## 7. UX Notes

- Sensitive values (SMTP password, OAuth secrets) are masked by default. A `ShowIcon` / `HideIcon` toggle reveals them in plain text.
- After saving any tab, a `Flash variant="success"` appears at the top of the content area and auto-dismisses after 5 s: `"Configuration saved."`.
- Server-side validation errors map back to the individual field with an inline `FormControl.Validation` message.

---

## 8. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| Get configuration | `GET /api/v1/admin/configuration` | Returns all settings; sensitive fields are masked (`"***"`). |
| Update configuration | `PATCH /api/v1/admin/configuration` `{ <section fields> }` | Partial update — only the fields provided are changed. |
| Test SMTP | `POST /api/v1/admin/configuration/smtp/test` `{ email }` | Sends a test email and returns success or SMTP error. |
| Refresh library | `POST /api/v1/admin/configuration/library/refresh` | Re-fetches the library index. Returns `{ templateCount, featureCount }`. |
