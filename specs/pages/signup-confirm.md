# Page Spec: Email Confirmation (`/confirm-email?token=<token>`)

Auth required: **no** — this page is accessed from the confirmation link sent by email after registration.

Primary goal: confirm the user's email address and redirect them to the dashboard (or show a clear error if the token is invalid or expired).

Related pages: [signup.md](signup.md) (registration form that triggers the confirmation email), [login.md](login.md).

Related feature: [specs/features/authentication.md](../features/authentication.md) — Email Confirmation section.

---

## 1. Layout

A single centered card, identical in appearance to the login card. Maximum width 400 px, vertically centered.

---

## 2. States

### 2.1 Confirming (loading)

Shown immediately on page load while the token is being verified server-side.

```
┌──────────────────────────────┐
│  [Logo]                       │
│  Confirming your email…       │
│                               │
│       ⟳  (Spinner)           │
└──────────────────────────────┘
```

### 2.2 Success

Shown when the token is valid and the account is now confirmed. The user is automatically logged in (tokens issued server-side).

```
┌──────────────────────────────┐
│  [Logo]                       │
│  Email confirmed ✓            │
│                               │
│  Your account is ready.       │
│                               │
│  [ Go to Dashboard ]          │
└──────────────────────────────┘
```

- Auto-redirects to `/dashboard` after **3 seconds** if the user does not click the button.
- A countdown label: `"Redirecting in 3s…"` with a progress bar depleting to zero.

### 2.3 Token expired

```
┌──────────────────────────────┐
│  [Logo]                       │
│  Link expired                 │
│                               │
│  This confirmation link has   │
│  expired. Request a new one.  │
│                               │
│  [ Resend confirmation email ]│
│  [ Back to Sign in ]          │
└──────────────────────────────┘
```

- **Resend confirmation email**: `POST /api/v1/auth/resend-confirmation` using the email decoded from the token payload (if present) or prompting the user to enter their email.
- On resend success: button becomes disabled and a `Flash variant="success"` appears: `"A new confirmation email has been sent."`.

### 2.4 Token already used

```
┌──────────────────────────────┐
│  [Logo]                       │
│  Already confirmed            │
│                               │
│  This link has already been   │
│  used. Sign in to continue.   │
│                               │
│  [ Sign in ]                  │
└──────────────────────────────┘
```

### 2.5 Invalid token

```
┌──────────────────────────────┐
│  [Logo]                       │
│  Invalid link                 │
│                               │
│  This confirmation link is    │
│  not valid. Contact support   │
│  or try registering again.    │
│                               │
│  [ Back to Sign in ]          │
└──────────────────────────────┘
```

---

## 3. API Endpoints

| Call | Endpoint | Notes |
|------|----------|-------|
| Confirm token | `POST /api/v1/auth/confirm-email` `{ token }` | Returns access token on success or an error code (`EXPIRED`, `ALREADY_USED`, `INVALID`). |
| Resend confirmation | `POST /api/v1/auth/resend-confirmation` `{ email }` | Rate-limited. Returns 204 on success. |
