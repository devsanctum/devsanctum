# Feature: Authentication

## Purpose
Allow users to register, log in, and maintain secure sessions on the platform. Supports both local credentials and federated login via OAuth providers (Google, GitHub).

An administrator can disable open registration entirely and switch the platform to **invitation-only mode**. In this mode, new accounts can only be created via an email invitation sent by an admin. The registration page is hidden from the public and direct access returns a 403.

---

## Use Cases

### UC-1: Register with email and password
A new user creates an account using their email address and a password. The platform hashes the password and stores the account. The user is immediately logged in after registration.

> **Requires open registration to be enabled** (see UC-8). If the platform is in invitation-only mode, this use case is replaced by UC-8.

### UC-2: Log in with email and password
A returning user enters their credentials. The platform validates them, issues a short-lived JWT access token and a long-lived refresh token, and grants access to the dashboard.

### UC-3: Log in with GitHub
A user clicks "Sign in with GitHub". The platform redirects to GitHub's OAuth2 authorization page. On success, the platform creates or links the user account and issues tokens.

### UC-4: Log in with Google
Identical flow to GitHub, using Google as the OAuth2 provider.

### UC-5: Refresh access token
When the access token expires, the frontend silently exchanges the refresh token for a new access token without requiring the user to log in again.

### UC-6: Log out
The user logs out. The refresh token is invalidated server-side. The frontend clears stored tokens.

### UC-7: View and manage sessions (future)
A user can see active sessions (device, IP, last seen) and revoke any of them.

### UC-8: Register via email invitation
When the platform is in invitation-only mode, a user receives an invitation email containing a one-time secure link. Clicking the link brings them to a registration form pre-filled with their email. Once they set their name and password (or connect via OAuth), the account is created and the invitation is consumed. Expired or already-used tokens show an error page.

---

## UI/UX

### Login Page (`/login`)
- Clean centered card layout.
- Fields: **Email**, **Password**.
- Primary CTA: **Sign in**.
- Divider: "or continue with".
- OAuth buttons: **GitHub** (icon + label), **Google** (icon + label). Each button is only rendered if the corresponding provider is enabled in platform configuration.
- Link: "Don't have an account? **Register**" — hidden when invitation-only mode is active.
- Link: "Forgot password?" (future).
- Error state: inline message under the form on invalid credentials (do not reveal which field is wrong).

### Register Page (`/register`)
- Fields: **Name**, **Email**, **Password**, **Confirm Password**.
- Password strength indicator (visual bar).
- Primary CTA: **Create account**.
- OAuth buttons identical to login page.
- Link: "Already have an account? **Sign in**".
- **Invitation-only mode**: the `/register` route is disabled. Visiting it directly returns a branded 403 page: "Registration is by invitation only. Contact your administrator."
- The "Don't have an account? Register" link is hidden from the login page in this mode.

### Invitation Registration Page (`/register?token=<token>`)
- Shown when a user follows a valid invitation link.
- Email field is pre-filled and read-only.
- Fields: **Name**, **Password**, **Confirm Password**.
- OAuth buttons available as an alternative to password setup.
- On expired or invalid token: error state with message "This invitation link is invalid or has expired." and a prompt to contact the administrator.

### Post-login redirect
- Redirect to `/dashboard` on success.
- If the user tried to access a protected route before login, redirect back to the original URL.

### Token handling
- Access token stored in memory (not localStorage).
- Refresh token stored in an `HttpOnly` cookie.
- Silent refresh runs in the background before expiry.

### Navigation — authenticated state
- User avatar and name visible in the top-right corner.
- Dropdown menu: **Profile**, **Settings**, **Sign out**.
