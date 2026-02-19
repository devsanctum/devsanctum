# Database Structure

This document describes the full relational data model for the platform. All tables are managed through Prisma. The database engine is PostgreSQL.

---

## Table Index

1. [User](#1-user)
2. [Group](#2-group)
3. [GroupMember](#3-groupmember)
4. [DockerServer](#4-dockerserver)
5. [Template](#5-template)
6. [TemplateFeature](#6-templatefeature)
7. [Feature](#7-feature)
8. [FeatureOption](#8-featureoption)
9. [Project](#9-project)
10. [ProjectRepository](#10-projectrepository)
11. [ProjectFeature](#11-projectfeature)
12. [ProjectGroup](#12-projectgroup)
13. [DockerServerGroup](#13-dockerservergroup)
14. [Workspace](#14-workspace)
15. [WorkspaceService](#15-workspaceservice)
16. [Invitation](#16-invitation)
17. [AuditLog](#17-auditlog)
18. [PlatformConfig](#18-platformconfig)

---

## 1. User

Represents a registered user of the platform. Can own or be a member of projects, and can deploy workspaces.

| Field         | Type      | Constraints          | Description                              |
|---------------|-----------|----------------------|------------------------------------------|
| `id`          | `uuid`    | PK                   | Unique identifier                        |
| `email`       | `string`  | UNIQUE, NOT NULL     | Login email address                      |
| `name`        | `string`  | NOT NULL             | Display name                             |
| `avatarUrl`   | `string`  | NULLABLE             | Profile picture URL                      |
| `provider`    | `enum`    | NOT NULL             | Auth provider: `LOCAL`, `GITHUB`, `GOOGLE` |
| `providerId`  | `string`  | NULLABLE             | External provider user ID                |
| `passwordHash`| `string`  | NULLABLE             | Hashed password (null for OAuth users)   |
| `role`        | `enum`    | NOT NULL             | Platform role: `USER` or `ADMIN`         |
| `isActive`    | `boolean` | NOT NULL, DEFAULT true | Whether the account is active. Deactivated users cannot log in. |
| `createdAt`   | `datetime`| NOT NULL             | Account creation timestamp               |
| `updatedAt`   | `datetime`| NOT NULL             | Last update timestamp                    |

**Relations:**
- Has many `Project` (as owner)
- Has many `GroupMember`
- Has many `Workspace`

---

## 2. Group

A group is an organizational unit that aggregates users. Access to projects and Docker servers is granted at the group level, not per individual user. A user may belong to multiple groups.

| Field         | Type      | Constraints      | Description                                      |
|---------------|-----------|------------------|--------------------------------------------------|
| `id`          | `uuid`    | PK               | Unique identifier                                |
| `name`        | `string`  | UNIQUE, NOT NULL | Group display name                               |
| `description` | `string`  | NULLABLE         | Optional description of the group's purpose      |
| `createdAt`   | `datetime`| NOT NULL         | Creation timestamp                               |
| `updatedAt`   | `datetime`| NOT NULL         | Last update timestamp                            |

**Relations:**
- Has many `GroupMember`
- Has many `ProjectGroup`
- Has many `DockerServerGroup`

---

## 3. GroupMember

Join table linking users to groups. A user can belong to multiple groups. A group member can have a role within the group.

| Field       | Type      | Constraints      | Description                                                       |
|-------------|-----------|------------------|-------------------------------------------------------------------|
| `groupId`   | `uuid`    | FK → Group       | Referenced group                                                  |
| `userId`    | `uuid`    | FK → User        | Referenced user                                                   |
| `role`      | `enum`    | NOT NULL         | `MEMBER` — standard access; `MANAGER` — can add/remove members   |
| `createdAt` | `datetime`| NOT NULL         | Membership creation timestamp                                     |

**Primary key:** composite (`groupId`, `userId`)

---

## 4. DockerServer

Represents a Docker host that the platform can connect to in order to provision containers. Multiple servers can be registered.

| Field        | Type      | Constraints      | Description                                         |
|--------------|-----------|------------------|-----------------------------------------------------|
| `id`         | `uuid`    | PK               | Unique identifier                                   |
| `name`       | `string`  | NOT NULL         | Human-readable label (e.g. "prod-host-01")          |
| `host`       | `string`  | NOT NULL         | Hostname or IP of the Docker daemon                 |
| `port`       | `int`     | NOT NULL         | Docker daemon port (default: 2376 for TLS)          |
| `tlsEnabled` | `boolean` | NOT NULL         | Whether TLS is required to connect                  |
| `caCert`     | `text`    | NULLABLE         | CA certificate content (PEM) for TLS                |
| `clientCert` | `text`    | NULLABLE         | Client certificate content (PEM) for mTLS           |
| `clientKey`  | `text`    | NULLABLE         | Client key content (PEM) for mTLS                   |
| `status`              | `enum`    | NOT NULL         | `ONLINE`, `OFFLINE`, `UNREACHABLE`                              |
| `cpuCores`            | `int`     | NULLABLE         | Total logical CPU cores reported by the Docker daemon           |
| `ramTotalMb`          | `int`     | NULLABLE         | Total RAM in megabytes                                          |
| `ramUsedMb`           | `int`     | NULLABLE         | Currently used RAM in megabytes                                 |
| `diskTotalGb`         | `float`   | NULLABLE         | Total disk capacity in gigabytes (Docker root directory)        |
| `diskUsedGb`          | `float`   | NULLABLE         | Used disk space in gigabytes                                    |
| `resourcesUpdatedAt`  | `datetime`| NULLABLE         | Timestamp of the last successful resource poll                  |
| `createdAt`           | `datetime`| NOT NULL         | Registration timestamp                                          |
| `updatedAt`           | `datetime`| NOT NULL         | Last update timestamp                                           |

**Resource polling:** The platform polls each `ONLINE` server on a configurable interval (default: 60 seconds) using dockerode to refresh CPU, RAM, and disk metrics. If a server becomes unreachable, `status` is updated and polling is suspended until it recovers.

**Relations:**
- Has many `DockerServerGroup`
- Has many `Workspace`

---

## 5. Template

Defines a reusable environment blueprint. A template describes the Alpine base image version, the list of APT packages to install, shared folder mounts, optional raw Dockerfile instructions, exposed ports, default environment variables, and the set of features (with their options) to activate. All workspace containers built from this template share this configuration.

| Field                 | Type      | Constraints  | Description                                                                                      |
|-----------------------|-----------|--------------|--------------------------------------------------------------------------------------------------|
| `id`                  | `uuid`    | PK           | Unique identifier                                                                                |
| `name`                | `string`  | NOT NULL     | Template name (e.g. "Node.js 20", "Python 3.12")                                                 |
| `description`         | `string`  | NULLABLE     | Short description of the environment                                                             |
| `alpineMajor`         | `int`     | NOT NULL     | Alpine Linux major version (e.g. `3`)                                                            |
| `alpineMinor`         | `int`     | NOT NULL     | Alpine Linux minor version (e.g. `19`)                                                           |
| `apkPackages`         | `json`    | NOT NULL     | Ordered list of APK package names to install at build time (e.g. `["nodejs", "npm", "git"]`)     |
| `sharedFolders`       | `json`    | NOT NULL     | List of absolute paths to mount as shared volumes across all workspaces (e.g. `["/home/user"]`)  |
| `dockerInstructions`  | `text`    | NULLABLE     | Raw Dockerfile instructions appended after the base setup (e.g. `RUN`, `COPY`, `ENV` directives) |
| `defaultPorts`        | `json`    | NOT NULL     | Array of default exposed ports and their protocols                                               |
| `defaultEnv`          | `json`    | NOT NULL     | Default environment variables injected into every workspace container (key/value pairs)          |
| `startCommand`        | `string`  | NULLABLE     | Override the s6-overlay entrypoint command if needed                                             |
| `minRamMb`            | `int`     | NOT NULL, DEFAULT 256 | Minimum RAM in megabytes required to deploy a workspace from this template. Used during Docker server selection. |
| `minDiskGb`           | `float`   | NOT NULL, DEFAULT 1.0 | Minimum free disk space in gigabytes required on the target Docker server.                |
| `createdAt`           | `datetime`| NOT NULL     | Creation timestamp                                                                               |
| `updatedAt`           | `datetime`| NOT NULL     | Last update timestamp                                                                            |

**Relations:**
- Has many `Project`
- Has many `TemplateFeature`

---

## 6. TemplateFeature

Join table linking a template to the features it activates. Each entry can carry feature-specific option overrides (e.g. default database name, port, version) that will be applied when a workspace is provisioned from this template.

| Field        | Type      | Constraints      | Description                                                                          |
|--------------|-----------|------------------|--------------------------------------------------------------------------------------|
| `templateId` | `uuid`    | FK → Template    | Referenced template                                                                  |
| `featureId`  | `uuid`    | FK → Feature     | Referenced feature                                                                   |
| `options`    | `json`    | NOT NULL         | Feature-specific option overrides as key/value pairs (empty object `{}` if none)     |

**Primary key:** composite (`templateId`, `featureId`)

**Options examples:**
- PostgreSQL feature: `{ "version": "16", "defaultDb": "workspace", "port": 5432 }`
- Redis feature: `{ "version": "7", "port": 6379 }`
- A feature with no configurable options: `{}`

---

## 7. Feature

Represents an optional add-on that can be activated on a template. Each feature declares its Alpine compatibility range, the APK packages it requires, Docker build instructions, an s6-overlay service definition, the ports it exposes, and a list of configurable options.

| Field                  | Type      | Constraints  | Description                                                                                |
|------------------------|-----------|--------------|--------------------------------------------------------------------------------------------|
| `id`                   | `uuid`    | PK           | Unique identifier                                                                          |
| `name`                 | `string`  | NOT NULL     | Feature name (e.g. "PostgreSQL", "Redis", "MailHog")                                      |
| `description`          | `string`  | NULLABLE     | Short description of what this feature provides                                            |
| `apkPackages`          | `json`    | NOT NULL     | Array of APK package names to install (e.g. `["postgresql16", "postgresql16-client"]`)     |
| `alpineMinVersion`     | `string`  | NOT NULL     | Minimum compatible Alpine version (e.g. `"3.18"`)                                         |
| `alpineMaxVersion`     | `string`  | NULLABLE     | Maximum compatible Alpine version (null = no upper bound)                                  |
| `dockerInstructions`   | `text`    | NULLABLE     | Raw Dockerfile instruction block appended during image build. Supports `{{option.KEY}}` variable interpolation from resolved option values. |
| `serviceName`          | `string`  | NULLABLE     | Name of the s6-overlay service (used as the directory name under `/etc/s6-overlay/s6-rc.d/`). Null for config-only features. |
| `s6RunScript`          | `text`    | NULLABLE     | Content of the s6-overlay `run` script for this service. Supports `{{option.KEY}}` interpolation. |
| `ports`                | `json`    | NOT NULL     | Array of port definitions exposed by this feature. Each entry: `{ name, port, type }` where `type` is `HTTP`, `HTTPS`, `WEBSOCKET`, or `CUSTOM`. |
| `defaultEnv`           | `json`    | NOT NULL     | Default environment variables injected into the workspace at runtime. Supports `{{option.KEY}}` interpolation. |
| `minRamMb`             | `int`     | NOT NULL, DEFAULT 0   | Additional RAM in megabytes this feature requires on top of the template baseline. Used during Docker server eligibility check. |
| `minDiskGb`            | `float`   | NOT NULL, DEFAULT 0.0 | Additional disk space in gigabytes this feature requires on the target Docker server.    |
| `createdAt`            | `datetime`| NOT NULL     | Creation timestamp                                                                         |
| `updatedAt`            | `datetime`| NOT NULL     | Last update timestamp                                                                      |

**Resource requirement resolution:**
The effective minimum requirements for a workspace are computed as:
- `effectiveMinRamMb = max(template.minRamMb, sum of all activated features' minRamMb)`
- `effectiveMinDiskGb = max(template.minDiskGb, sum of all activated features' minDiskGb)`

During workspace deployment, only Docker servers with `(ramTotalMb - ramUsedMb) >= effectiveMinRamMb` and `(diskTotalGb - diskUsedGb) >= effectiveMinDiskGb` are eligible.

**Relations:**
- Has many `FeatureOption`
- Has many `TemplateFeature`
- Has many `ProjectFeature`

---

## 8. FeatureOption

Describes a single configurable option exposed by a feature. Options are resolved at template-feature assignment time (`TemplateFeature.optionValues`) and at workspace deployment time.

| Field          | Type      | Constraints      | Description                                                                             |
|----------------|-----------|------------------|-----------------------------------------------------------------------------------------|
| `id`           | `uuid`    | PK               | Unique identifier                                                                       |
| `featureId`    | `uuid`    | FK → Feature     | Parent feature                                                                          |
| `key`          | `string`  | NOT NULL         | Machine-readable key used in `{{option.KEY}}` interpolation and in `optionValues` maps  |
| `label`        | `string`  | NOT NULL         | Human-readable label shown in the UI                                                    |
| `description`  | `string`  | NULLABLE         | Explanation of what this option controls                                                |
| `type`         | `enum`    | NOT NULL         | `STRING`, `NUMBER`, `BOOLEAN`, `SELECT`                                                 |
| `required`     | `boolean` | NOT NULL         | If true, a value must be provided — no fallback to `defaultValue`                       |
| `defaultValue` | `string`  | NULLABLE         | Default value used when the option is not overridden. Null only when `required = true`  |
| `selectValues` | `json`    | NULLABLE         | Allowed values for `SELECT` type (array of strings). Null for other types               |
| `createdAt`    | `datetime`| NOT NULL         | Creation timestamp                                                                      |

**Unique constraint:** (`featureId`, `key`)

**Example options for a PostgreSQL feature:**
```json
[
  { "key": "version",   "type": "SELECT",  "required": false, "defaultValue": "16", "selectValues": ["14","15","16"] },
  { "key": "port",      "type": "NUMBER",  "required": false, "defaultValue": "5432" },
  { "key": "db",        "type": "STRING",  "required": true,  "defaultValue": null },
  { "key": "password",  "type": "STRING",  "required": true,  "defaultValue": null }
]
```

---

## 9. Project

A project groups one or more Git repositories, a template, and a set of features. Users with the right access level can deploy workspaces from it.

| Field         | Type      | Constraints       | Description                                              |
|---------------|-----------|-------------------|----------------------------------------------------------|
| `id`          | `uuid`    | PK                | Unique identifier                                        |
| `name`        | `string`  | NOT NULL          | Project name                                             |
| `slug`        | `string`  | UNIQUE, NOT NULL  | URL-safe slug derived from the project name. Used as the first segment of workspace subdomains. Updated when the project is renamed. |
| `description` | `string`  | NULLABLE          | Optional project description                             |
| `ownerId`     | `uuid`    | FK → User         | The user who owns this project                           |
| `templateId`  | `uuid`    | FK → Template     | Template used to provision workspace containers          |
| `visibility`  | `enum`    | NOT NULL          | `PUBLIC` or `PRIVATE`                                    |
| `minRamMb`    | `int`     | NULLABLE          | Override: minimum RAM in megabytes required to deploy a workspace in this project. If set, supersedes the template value when higher. |
| `minDiskGb`   | `float`   | NULLABLE          | Override: minimum free disk in gigabytes required. If set, supersedes the template value when higher. |
| `createdAt`   | `datetime`| NOT NULL          | Creation timestamp                                       |
| `updatedAt`   | `datetime`| NOT NULL          | Last update timestamp                                    |

**Relations:**
- Belongs to `User` (owner)
- Belongs to `Template`
- Has many `ProjectRepository`
- Has many `ProjectFeature`
- Has many `ProjectGroup`
- Has many `Workspace`

---

## 10. ProjectRepository

Links one or more Git repositories to a project. When a workspace is created, the listed repositories are cloned or mounted inside the container.

| Field          | Type      | Constraints       | Description                                              |
|----------------|-----------|-------------------|----------------------------------------------------------|
| `id`           | `uuid`    | PK                | Unique identifier                                        |
| `projectId`    | `uuid`    | FK → Project      | Parent project                                           |
| `url`          | `string`  | NOT NULL          | Git repository URL (HTTPS or SSH)                        |
| `name`         | `string`  | NOT NULL          | Short label used as the clone target directory name      |
| `defaultBranch`| `string`  | NOT NULL          | Default branch used when deploying a workspace           |
| `createdAt`    | `datetime`| NOT NULL          | Creation timestamp                                       |

**Relations:**
- Belongs to `Project`

---

## 11. ProjectFeature

Join table connecting a project to the features it uses.

| Field       | Type   | Constraints    | Description              |
|-------------|--------|----------------|--------------------------|
| `projectId` | `uuid` | FK → Project   | Referenced project       |
| `featureId` | `uuid` | FK → Feature   | Referenced feature       |

**Primary key:** composite (`projectId`, `featureId`)

---

## 12. ProjectGroup

Defines which groups have access to a project and at what permission level. Access to a project is granted exclusively through group membership — individual user assignment is not supported. The project owner always retains full control regardless of group rules.

| Field       | Type      | Constraints    | Description                                                   |
|-------------|-----------|----------------|---------------------------------------------------------------|
| `projectId` | `uuid`    | FK → Project   | Referenced project                                            |
| `groupId`   | `uuid`    | FK → Group     | Referenced group                                              |
| `role`      | `enum`    | NOT NULL       | `READ`, `DEPLOY`, `MANAGE`                                    |
| `createdAt` | `datetime`| NOT NULL       | Assignment creation timestamp                                 |

**Primary key:** composite (`projectId`, `groupId`)

**Access resolution:** A user's effective role on a project is the highest role across all groups they belong to that are assigned to that project.

**Roles:**
- `READ` — members of this group can view the project and its workspaces.
- `DEPLOY` — members can also create and manage their own workspaces.
- `MANAGE` — members can also edit project settings and manage group assignments.

---

## 13. DockerServerGroup

Defines which groups have access to a Docker server. When a workspace is deployed, the platform collects all servers accessible to any group that has access to the project, then selects the most available one.

| Field           | Type      | Constraints         | Description                          |
|-----------------|-----------|---------------------|--------------------------------------|
| `dockerServerId`| `uuid`    | FK → DockerServer   | Referenced Docker server             |
| `groupId`       | `uuid`    | FK → Group          | Referenced group                     |
| `createdAt`     | `datetime`| NOT NULL            | Assignment creation timestamp        |

**Primary key:** composite (`dockerServerId`, `groupId`)

**Server selection logic at workspace deployment:**
1. Collect all groups that have access to the project (via `ProjectGroup`).
2. Collect all `ONLINE` Docker servers assigned to those groups (via `DockerServerGroup`).
3. Deduplicate the server pool.
4. Compute the effective resource requirements:
   - `effectiveMinRamMb = max(project.minRamMb ?? template.minRamMb, Σ features.minRamMb)`
   - `effectiveMinDiskGb = max(project.minDiskGb ?? template.minDiskGb, Σ features.minDiskGb)`
5. Filter servers where `(ramTotalMb - ramUsedMb) >= effectiveMinRamMb` and `(diskTotalGb - diskUsedGb) >= effectiveMinDiskGb`.
6. Rank eligible servers by available RAM descending.
7. Assign the workspace to the top-ranked server.
8. If no eligible server is available, deployment fails with an actionable error listing the requirement vs available capacity.

---

## 14. Workspace

A running or stopped development environment. A workspace is tied to a project, a user, a specific branch, and a Docker server. It can be pinned to prevent automatic shutdown and deletion.

| Field            | Type      | Constraints           | Description                                                                 |
|------------------|-----------|-----------------------|-----------------------------------------------------------------------------|
| `id`             | `uuid`    | PK                    | Unique identifier                                                           |
| `name`           | `string`  | NOT NULL              | Human-readable workspace name                                               |
| `projectId`      | `uuid`    | FK → Project          | Parent project                                                              |
| `userId`         | `uuid`    | FK → User             | User who owns this workspace                                                |
| `dockerServerId` | `uuid`    | FK → DockerServer     | Docker host where the container runs                                        |
| `containerId`    | `string`  | NULLABLE              | Docker container ID (set after provisioning)                                |
| `branch`         | `string`  | NOT NULL              | Git branch this workspace is bound to                                       |
| `status`         | `enum`    | NOT NULL              | `PENDING`, `STARTING`, `RUNNING`, `STOPPING`, `STOPPED`, `DESTROYED`       |
| `visibility`     | `enum`    | NOT NULL              | `PUBLIC` or `PRIVATE`                                                                                                                                                  |
| `slug`           | `string`  | UNIQUE, NOT NULL      | Short unique slug generated at creation (e.g. `a3k9p`). Combined with the project slug to form the workspace manager subdomain: `<project-slug>-<workspace-slug>.<platform-domain>`. Never changes after creation. |
| `pinned`         | `boolean` | NOT NULL, DEFAULT false | If true, the workspace is exempt from inactivity shutdown and auto-deletion                                                                                         |
| `kept`           | `boolean` | NOT NULL, DEFAULT false | If true, the 7-day auto-destroy policy is suspended                        |
| `lastActivityAt` | `datetime`| NOT NULL              | Timestamp of the last detected activity in the workspace                    |
| `stopAt`         | `datetime`| NULLABLE              | Scheduled stop time (set to `lastActivityAt + 2h` if not pinned)           |
| `destroyAt`      | `datetime`| NULLABLE              | Scheduled destroy time (set to `createdAt + 7d` unless kept or pinned)     |
| `createdAt`      | `datetime`| NOT NULL              | Provisioning request timestamp                                              |
| `updatedAt`      | `datetime`| NOT NULL              | Last status update timestamp                                                |

**Lifecycle rules:**
- If `pinned = false` and no activity for 2 hours → workspace is stopped (`stopAt` is used by a background job).
- If `kept = false` and `pinned = false` → workspace is destroyed 7 days after creation (`destroyAt`).
- If `pinned = true` → both `stopAt` and `destroyAt` remain null and are not enforced.
- If `kept = true` and `pinned = false` → auto-stop still applies, but auto-destroy does not.

**Relations:**
- Belongs to `Project`
- Belongs to `User`
- Belongs to `DockerServer`
- Has many `WorkspaceService`

---

## 15. WorkspaceService

Describes an individual service exposed by a workspace (e.g. a web server, a terminal, a database port). Used by the UI to show users what is accessible and how.

| Field         | Type      | Constraints        | Description                                                  |
|---------------|-----------|--------------------|--------------------------------------------------------------|
| `id`          | `uuid`    | PK                 | Unique identifier                                                                                                                                                          |
| `workspaceId` | `uuid`    | FK → Workspace     | Parent workspace                                                                                                                                                           |
| `name`        | `string`  | NOT NULL           | Human-readable service label (e.g. `Frontend`, `API`, `Database UI`)                                                                                                      |
| `slug`        | `string`  | NOT NULL           | URL-safe identifier used as the service segment in the subdomain: `<project-slug>-<workspace-slug>-<service-slug>.<platform-domain>`. Must be unique within a workspace. |
| `port`        | `int`     | NOT NULL           | Container port this service maps to                                                                                                                                        |
| `protocol`    | `enum`    | NOT NULL           | `HTTP`, `HTTPS`, `WEBSOCKET`, `TCP`                                                                                                                                        |
| `url`         | `string`  | NULLABLE           | Full reachable URL for this service, set after routing is established (e.g. `https://my-app-a3k9p-frontend.devsanctum.io`)                                                |
| `createdAt`   | `datetime`| NOT NULL           | Creation timestamp                                                                                                                                                         |

**Relations:**
- Belongs to `Workspace`

**Unique constraint:** (`workspaceId`, `slug`)

---

## 16. Invitation

Represents a pending or historical invitation sent by an admin to bring a new user onto the platform. Invitations are time-limited, single-use, and can be revoked before acceptance. Used when invitation-only registration mode is active.

| Field         | Type      | Constraints          | Description                                                                     |
|---------------|-----------|----------------------|---------------------------------------------------------------------------------|
| `id`          | `uuid`    | PK                   | Unique identifier                                                               |
| `email`       | `string`  | NOT NULL             | Email address of the invited person                                             |
| `token`       | `string`  | UNIQUE, NOT NULL     | Secure random one-time token embedded in the invitation link                    |
| `role`        | `enum`    | NOT NULL             | Intended platform role for the new account: `USER` or `ADMIN`                  |
| `invitedById` | `uuid`    | FK → User            | Admin who sent the invitation                                                   |
| `status`      | `enum`    | NOT NULL             | `PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`                                     |
| `expiresAt`   | `datetime`| NOT NULL             | Token expiry timestamp (default: 48 hours from creation)                        |
| `acceptedAt`  | `datetime`| NULLABLE             | Timestamp when the invitation was accepted and the account was created          |
| `createdAt`   | `datetime`| NOT NULL             | Invitation creation timestamp                                                   |

**Relations:**
- Belongs to `User` (as `invitedById`)

---

## 17. AuditLog

Append-only record of significant platform events for security review, incident investigation, and compliance. Entries are never modified or deleted through the application.

| Field        | Type      | Constraints          | Description                                                                                    |
|--------------|-----------|----------------------|------------------------------------------------------------------------------------------------|
| `id`         | `uuid`    | PK                   | Unique identifier                                                                              |
| `actorId`    | `uuid`    | NULLABLE, FK → User  | User who performed the action. Null for system-initiated jobs (e.g. auto-stop, auto-destroy).  |
| `actorRole`  | `string`  | NULLABLE             | Role of the actor at the time of the action (snapshot, as the role may change later)           |
| `action`     | `string`  | NOT NULL             | Namespaced action key (e.g. `workspace.stopped`, `user.role_changed`, `project.deleted`)       |
| `resource`   | `string`  | NOT NULL             | Resource type affected (e.g. `Workspace`, `User`, `Project`)                                   |
| `resourceId` | `string`  | NULLABLE             | ID of the affected resource                                                                    |
| `metadata`   | `json`    | NULLABLE             | Additional context: changed field diffs, request details, related IDs, etc.                   |
| `ip`         | `string`  | NULLABLE             | IP address of the originating request                                                          |
| `createdAt`  | `datetime`| NOT NULL             | Event timestamp                                                                                |

**Relations:**
- Belongs to `User` (as `actorId`, nullable)

---

## 18. PlatformConfig

Key/value store for platform-wide configuration settings managed by administrators. Covers general settings, SMTP, OAuth providers, workspace lifecycle policies, and library source. Sensitive values (secrets, passwords) are stored encrypted at rest.

| Field         | Type      | Constraints          | Description                                                                                          |
|---------------|-----------|----------------------|------------------------------------------------------------------------------------------------------|
| `key`         | `string`  | PK                   | Unique setting identifier (e.g. `registrationMode`, `smtpHost`, `githubClientSecret`)                |
| `value`       | `text`    | NULLABLE             | Stored value as a string. Encrypted values contain ciphertext. Null for unset optional settings.     |
| `encrypted`   | `boolean` | NOT NULL             | Whether the value is encrypted at rest                                                               |
| `updatedAt`   | `datetime`| NOT NULL             | Timestamp of the last update                                                                         |
| `updatedById` | `uuid`    | NULLABLE, FK → User  | Admin who last changed this setting. Null for seed defaults or system-applied values.                |

**Relations:**
- Belongs to `User` (as `updatedById`, nullable)

---

## Entity Relationship Overview

```
User ──< GroupMember >── Group ──< ProjectGroup >── Project ──< ProjectRepository
  │                        │                            │
  │               DockerServerGroup              ProjectFeature >── Feature
  │                        │                            │
  ├──< Invitation     DockerServer                  Template
  │                        │                            │
  └──< AuditLog       (server pool)               Workspace ──< WorkspaceService

PlatformConfig (global key/value store, standalone)
```

## Access Control Summary

Access is resolved through group membership. A user's effective role on a project is the highest role across all `ProjectGroup` entries for groups they belong to.

| Action                              | READ | DEPLOY | MANAGE | OWNER |
|-------------------------------------|------|--------|--------|-------|
| View project                        | ✅   | ✅     | ✅     | ✅    |
| Deploy workspace                    | ❌   | ✅     | ✅     | ✅    |
| Manage own workspace                | ❌   | ✅     | ✅     | ✅    |
| Edit project settings               | ❌   | ❌     | ✅     | ✅    |
| Manage group assignments on project | ❌   | ❌     | ✅     | ✅    |
| Delete project                      | ❌   | ❌     | ❌     | ✅    |
