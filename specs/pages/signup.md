# Page Spec: Sign Up (`/register`)

Auth required: **no** — if the visitor is already authenticated, redirect to `/dashboard`. If the platform is in invitation-only mode, redirect to a branded 403 page: "Registration is by invitation only."

Primary goal: let a new visitor create an account as quickly as possible — minimum friction, maximum clarity.

Related pages: [login.md](login.md), [signup-confirm.md](signup-confirm.md) (email confirmation landing).

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo · Explore           [Sign in]                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              ┌──────────────────────────────┐                   │
│              │  [Logo]                       │                   │
│              │  Create your account          │                   │
│              │                               │                   │
│              │  Name          [__________]   │                   │
│              │  Email         [__________]   │                   │
│              │  Password      [__________]   │                   │
│              │  ████░░░░  strength bar        │                   │
│              │                               │                   │
│              │  [ Create account ]           │                   │
│              │                               │                   │
│              │  ──── or continue with ────   │                   │
│              │  [ GitHub ]  [ Google ]       │                   │
│              │                               │                   │
│              │  Already have an account?     │                   │
│              │  Sign in →                    │                   │
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
| Name | `TextInput` | Required. 2–64 chars. Validated on blur. |
| Email | `TextInput` (type email) | Required. Valid email format. Validated on blur. |
| Password | `TextInput` (type password, toggleable visibility) | Required. Minimum 8 chars. Validated on blur. |

No "Confirm password" field — the visibility toggle removes the need for it and reduces friction.

### Password strength bar

A `ProgressBar` below the password field showing strength in 4 steps:

| Score | Fill | Colour token |
|-------|------|-------------|
| Too short (< 8 chars) | 1/4 | `danger.emphasis` |
| Weak | 2/4 | `attention.emphasis` |
| Fair | 3/4 | `attention.emphasis` |
| Strong | 4/4 | `success.emphasis` |

Strength is evaluated client-side only (no API call). Accompany the bar with a short text label ("Too short", "Weak", "Fair", "Strong") in the matching colour.

### Submit button

`Button variant="primary"` full-width: **"Create account"**

Disabled while any required field is empty or validation has not passed.

Shows a `Spinner` inside the button and becomes disabled while the API call is in flight. Label changes to "Creating account…".

### OAuth buttons

Two `Button variant="default"` buttons side by side:
- `[ GitHub ]` — left Octicon `MarkGithubIcon`
- `[ Google ]` — left Google "G" icon (`<img>`)

Each button is rendered only if the corresponding provider is enabled in platform config (from `GET /api/v1/config/public`). If neither is enabled, the "or continue with" divider is hidden.

### Footer link

`"Already have an account? Sign in →"` — `Sign in` links to `/login`.

---

## 3. Validation & Error Handling

### Field-level (on blur)

| Field | Error message |
|-------|---------------|
| Name empty | "Your name is required." |
| Name too short | "Name must be at least 2 characters." |
| Email empty | "Email is required." |
| Email invalid | "Enter a valid email address." |
| Password empty | "Password is required." |
| Password too short | "Password must be at least 8 characters." |

Errors appear as `FormControl.Validation variant="error"` below each field. They clear as soon as the user starts typing again.

### Server errors (after submit)

| Scenario | Handling |
|----------|----------|
| Email already registered | Field-level error on Email: "An account with this email already exists. Sign in instead?" — "Sign in" is a link to `/login`. |
| Registration disabled (race condition) | `Flash variant="danger"` above the form: "Registration is currently closed. Contact your administrator." |
| Unexpected server error | `Flash variant="danger"` above the form: "Something went wrong. Please try again." The Flash persists until dismissed. |

---

## 4. Post-Submit Flow

1. `POST /api/v1/auth/register` succeeds.
2. If **email confirmation is required** (platform setting):
   - User is **not** logged in automatically.
   - Page transitions to a confirmation state (inline, no redirect): the form is replaced by a `Blankslate` — "Check your inbox. We've sent a confirmation link to `<email>`."
   - A "Resend email" link is available (rate-limited: once every 60 s).
3. If **email confirmation is disabled**:
   - User is logged in automatically (tokens issued by the API).
   - Redirect to `/dashboard`.
   - A welcome `Flash variant="success"` is shown once on the dashboard: "Welcome to DevSanctum, `<name>`! 🎉"

---

## 5. Invitation-Only Mode

When open registration is disabled:
- `GET /api/v1/config/public` returns `allowRegistration: false`.
- The page renders a centered `Blankslate` instead of the form:
  - Icon: `LockIcon`
  - Heading: "Registration is by invitation only."
  - Description: "Ask your administrator for an invitation link."
- No form, no OAuth buttons.

---

## 6. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| Platform config | `GET /api/v1/config/public` | Returns `allowRegistration`, enabled OAuth providers. |
| Register | `POST /api/v1/auth/register` `{ name, email, password }` | Returns tokens (if no email confirmation) or a pending status. |
| Resend confirmation email | `POST /api/v1/auth/resend-confirmation` `{ email }` | Rate-limited. |

---

## 7. UX Notes

- The form card is rendered immediately (no loading skeleton) — config is fetched in the background; OAuth buttons appear once config resolves.
- Validation always runs on blur, never on every keystroke.
- The submit button is the only way to submit — pressing Enter in a field triggers standard HTML form submission.
- On mobile, the card fills the full viewport width with `16px` horizontal padding.
- No CAPTCHA at this stage. Rate limiting on `POST /api/v1/auth/register` is handled server-side.
