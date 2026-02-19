# Feature: Git Activity Tracking

## Purpose
Record and surface Git commit activity for workspaces and projects. Activity data feeds the authenticated dashboard (§5 of `dashboard.md`), the public project explorer (`explore-project.md` §5), and the workspace info view. Commit records are ingested either via repository push webhooks or by periodic branch polling — the mechanism is transparent to consumers.

---

## Data Model

### CommitActivity

Stores one row per commit, scoped to a workspace branch. A commit may appear multiple times if several workspaces track the same branch; each row is linked to the workspace that recorded it.

| Field             | Type       | Constraints           | Description                                             |
|-------------------|------------|-----------------------|---------------------------------------------------------|
| `id`              | `uuid`     | PK                    | Unique identifier                                       |
| `workspaceId`     | `uuid`     | FK → Workspace, NOT NULL | The workspace whose branch contains this commit       |
| `projectId`       | `uuid`     | FK → Project, NOT NULL | Denormalised project reference for efficient filtering |
| `repoUrl`         | `string`   | NOT NULL              | Git remote URL of the repository                        |
| `branch`          | `string`   | NOT NULL              | Branch name at time of recording                        |
| `sha`             | `string`   | NOT NULL, 40 chars    | Full commit SHA                                         |
| `message`         | `string`   | NOT NULL              | Full commit message (first line + body)                 |
| `authorName`      | `string`   | NOT NULL              | Commit author display name                              |
| `authorEmail`     | `string`   | NULLABLE              | Commit author email (used to match platform users)      |
| `authorAvatarUrl` | `string`   | NULLABLE              | Avatar URL resolved from matched platform user; null if no match |
| `committedAt`     | `datetime` | NOT NULL              | Git author date                                         |
| `createdAt`       | `datetime` | NOT NULL              | Row insertion timestamp                                 |

**Unique constraint**: `(workspaceId, sha)` — the same commit is never recorded twice for the same workspace.

**Indexes**:
- `(projectId, committedAt DESC)` — fast project-scoped query used by the public explorer.
- `(workspaceId, committedAt DESC)` — workspace activity feed.
- `(projectId, workspaceId, committedAt DESC)` — dashboard multi-project feed.

---

## Ingestion Strategy

The platform supports two ingestion modes. Both can be active simultaneously.

### Mode A — Push Webhooks (preferred)

When a workspace's project repository has a Git remote that the platform can register a webhook on (GitHub, GitLab, Gitea, etc.), the platform registers a `push` webhook automatically on workspace creation.

**Webhook endpoint**: `POST /api/v1/webhooks/git/push`

- The backend verifies the webhook signature (HMAC-SHA256) from the `X-Hub-Signature-256` header. If the secret is wrong or missing, the request is rejected with `401`.
- On a verified payload, the backend iterates the `commits` array, normalises each entry to the `CommitActivity` shape, and upserts rows (conflict on `(workspaceId, sha)` does nothing).
- Avatar resolution: if `authorEmail` matches a `User.email`, the backend copies `User.avatarUrl`; otherwise `authorAvatarUrl` is null.
- The response is always `200 OK` to the webhook source (standard practice to avoid re-delivery loops).

**Webhook registration** is best-effort:
- GitHub: `POST /repos/:owner/:repo/hooks` via the GitHub API using the project's configured access token.
- Self-hosted Gitea/GitLab: equivalent REST calls guarded by feature flags in platform configuration.
- If registration fails (no token, unsupported provider), the platform falls back to Mode B.

### Mode B — Periodic Polling

A background job runs every **5 minutes** and fetches recent commits for every active (non-DESTROYED) workspace.

For each workspace:
1. Execute `git fetch origin <branch>` against the `repoUrl` configured on the project's `ProjectRepository`.
2. Run `git log origin/<branch> --since="<last_polled_at>" --format=<format>` to collect new commits since the last poll.
3. Upsert all returned commits into `CommitActivity`.
4. Update `Workspace.lastPolledAt` to `NOW()`.

**Concurrency**: polling jobs for individual workspaces run in a bounded worker pool (max 10 concurrent), managed by the backend job scheduler (Bull or similar).

**Git credentials** are pulled from the platform's configured SSH key or access token (stored encrypted in `PlatformConfig`).

### Conflict resolution

On upsert conflict `(workspaceId, sha)`, the row is kept as-is (the existing record wins). This means backfill runs are idempotent.

---

## Use Cases

### UC-1: Ingest commits via push webhook
A developer pushes to a branch that is tracked by a workspace. The repository triggers a `push` webhook to the platform. The platform verifies the signature, extracts the commit list, and inserts new `CommitActivity` rows.

### UC-2: Ingest commits via polling
The background poller wakes up, iterates all active workspaces, fetches new commits from their tracked branches since the last poll, and inserts new rows.

### UC-3: Fetch authenticated dashboard activity feed
An authenticated user's dashboard (`GET /api/v1/activity/commits`) returns the 20 most recent `CommitActivity` rows scoped to workspaces the user can access (owned or via group membership). Results include grouping metadata when the same author pushed multiple commits to the same branch within a 30-minute window.

### UC-4: Fetch public project commit history
An unauthenticated visitor views the recent commits on a public project (`GET /api/v1/explore/projects/:slug/commits`). The platform returns the 10 most recent `CommitActivity` rows scoped to the given project, regardless of which workspace recorded them.

### UC-5: Prune old commit activity
A scheduled job (daily) deletes `CommitActivity` rows older than **90 days** to keep the table size bounded. Rows for DESTROYED workspaces are deleted immediately during workspace destruction.

---

## API Endpoints

### `GET /api/v1/activity/commits`

**Auth**: required.

**Query parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | 20 | Max rows to return (max 100). |
| `before` | ISO datetime | — | Cursor — return only rows with `committedAt < before`. |

**Access control**: non-admin users receive commits scoped to workspaces they own or belong to via project group membership. Admin users receive all commits.

**Response** (`200 OK`):
```json
{
  "commits": [
    {
      "id": "uuid",
      "workspaceId": "uuid",
      "workspaceName": "string",
      "projectId": "uuid",
      "projectName": "string",
      "repoUrl": "string",
      "branch": "string",
      "sha": "string (40 chars)",
      "shortSha": "string (7 chars)",
      "message": "string",
      "messageFirstLine": "string",
      "authorName": "string",
      "authorAvatarUrl": "string | null",
      "committedAt": "ISO datetime"
    }
  ],
  "nextCursor": "ISO datetime | null"
}
```

**Grouping note**: grouping (same author + branch within 30 min) is a **client-side** concern. The API always returns individual rows sorted by `committedAt DESC`.

---

### `GET /api/v1/explore/projects/:slug/commits`

**Auth**: not required.

**Path parameter**: `slug` — the public project's `Project.slug`. Returns `404` for private or non-existent projects.

**Query parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | 10 | Max rows to return (max 50). |

**Access control**: open. Only returns rows for `visibility = PUBLIC` projects.

**Response** (`200 OK`): same shape as above, minus `workspaceId`/`workspaceName` (commits are project-scoped on this endpoint):
```json
{
  "commits": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "repoUrl": "string",
      "branch": "string",
      "sha": "string",
      "shortSha": "string",
      "message": "string",
      "messageFirstLine": "string",
      "authorName": "string",
      "authorAvatarUrl": "string | null",
      "committedAt": "ISO datetime"
    }
  ]
}
```

---

## Security Considerations

- **Webhook secret**: each platform instance generates a random 32-byte hex secret on first boot, stored in `PlatformConfig`. The same secret is used for all repository webhooks. If the secret is rotated, existing webhooks must be re-registered.
- **Commit message sanitisation**: commit messages are stored as plain text and must be HTML-escaped before rendering in the browser.
- **Git credential exposure**: SSH keys and access tokens used for polling are never returned by any API endpoint.
- **Public endpoint**: `GET /api/v1/explore/projects/:slug/commits` must validate project visibility before returning data. A private project whose slug is guessed returns `404`.
