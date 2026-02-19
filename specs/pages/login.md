# Page Spec: Login (`/login`)

Auth required: **no** — if the visitor is already authenticated, redirect to `/dashboard` (or to the `redirect` query param if present and safe).

Primary goal: let a returning user sign in as quickly as possible — minimum friction, clear error feedback.

Related pages: [signup.md](signup.md) (registration), [home.md](home.md) (public entry point).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo · Explore           [Register?]                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              ┌──────────────────────────────┐                   │
│              │  [Logo]                       │                   │
│              │  Sign in to DevSanctum        │                   │
│              │                               │                   │
│              │  Email         [__________]   │                   │
│              │  Password      [__________]   │                   │
│              │                               │                   │
│              │  [ Sign in ]                  │                   │
│              │                               │                   │
│              │  ──── or continue with ────   │                   │
│              │  [ GitHub ]  [ Google ]       │                   │
│              │                               │                   │
│              │  Don't have an account?       │                   │
│              │  Register →                   │                   │
│              └──────────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

A single centered card, `canvas.default` background, `border.default` border, `border-radius 6px`. Maximum width 400 px. Vertically centered in the viewport.

---

## 2. Section: Form

### Fields

| Field | Component | Rules |
|-------|-----------|-------|
| Email | `TextInput` (type email) | Required. Validated on blur. |
| Password | `TextInput` (type password, toggleable visibility) | Required. |

### Submit button

`Button variant="primary"` full-width: **"Sign in"**

Disabled while any required field is empty. Shows a `Spinner` inside the button and becomes disabled while the API call is in flight. Label changes to `"Signing in…"`.

### Error state

An inline `Flash variant="danger"` appears below the form on failed authentication:
> "Invalid email or password."

Do **not** specify which field is wrong — this prevents user enumeration.

The flash persists until the user modifies any field.

---

## 3. Section: OAuth buttons

Two `Button variant="default"` buttons side by side:
- `[ GitHub ]` — left `MarkGithubIcon`
- `[ Google ]` — left Google "G" icon (`<img>`)

Each button is rendered only if the corresponding OAuth provider is enabled in platform configuration.

Clicking either button redirects to the provider's authorization page. On success, the backend creates or links the account and issues tokens.

---

## 4. Section: Footer links

- `"Don't have an account? Register →"` — hidden when open registration is disabled (invitation-only mode).
- Platform name pulled from `platformConfig.platformName` (fallback: `"DevSanctum"`).

---

## 5. Redirect handling

If `?redirect=<path>` is present in the query string, the user is forwarded to that path after a successful login. Only relative paths are accepted — external URLs are ignored (redirect to `/dashboard` instead).

---

## 6. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| Login | `POST /api/v1/auth/login` `{ email, password }` | Returns access token + sets refresh token cookie. |
| OAuth — GitHub | `GET /api/v1/auth/github` | Redirect to GitHub authorization. |
| OAuth — Google | `GET /api/v1/auth/google` | Redirect to Google authorization. |
