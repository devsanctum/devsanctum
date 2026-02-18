# Database Structure

This document describes the full relational data model for the platform. All tables are managed through Prisma. The database engine is PostgreSQL.

---

## Table Index

1. [User](#1-user)
2. [DockerServer](#2-dockerserver)
3. [Template](#3-template)
4. [Feature](#4-feature)
5. [Project](#5-project)
6. [ProjectRepository](#6-projectrepository)
7. [ProjectFeature](#7-projectfeature)
8. [ProjectMember](#8-projectmember)
9. [Workspace](#9-workspace)
10. [WorkspaceService](#10-workspaceservice)

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
| `createdAt`   | `datetime`| NOT NULL             | Account creation timestamp               |
| `updatedAt`   | `datetime`| NOT NULL             | Last update timestamp                    |

**Relations:**
- Has many `Project` (as owner)
- Has many `ProjectMember`
- Has many `Workspace`

---

## 2. DockerServer

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
| `status`     | `enum`    | NOT NULL         | `ONLINE`, `OFFLINE`, `UNREACHABLE`                  |
| `createdAt`  | `datetime`| NOT NULL         | Registration timestamp                              |
| `updatedAt`  | `datetime`| NOT NULL         | Last update timestamp                               |

**Relations:**
- Has many `Workspace`

---

## 3. Template

Defines a reusable environment blueprint. A template describes what base Docker image and default configuration to use when creating a workspace container.

| Field          | Type      | Constraints  | Description                                            |
|----------------|-----------|--------------|--------------------------------------------------------|
| `id`           | `uuid`    | PK           | Unique identifier                                      |
| `name`         | `string`  | NOT NULL     | Template name (e.g. "Node.js 20", "Python 3.12")       |
| `description`  | `string`  | NULLABLE     | Short description of the environment                   |
| `dockerImage`  | `string`  | NOT NULL     | Docker image reference (e.g. `node:20-bullseye`)       |
| `defaultPorts` | `json`    | NOT NULL     | Array of default exposed ports and their protocols     |
| `defaultEnv`   | `json`    | NOT NULL     | Default environment variables (key/value pairs)        |
| `startCommand` | `string`  | NULLABLE     | Override container start command                       |
| `createdAt`    | `datetime`| NOT NULL     | Creation timestamp                                     |
| `updatedAt`    | `datetime`| NOT NULL     | Last update timestamp                                  |

**Relations:**
- Has many `Project`

---

## 4. Feature

Represents an optional add-on that can be attached to a project (e.g. a database sidecar, a cache service, a tool like pgAdmin). Each feature may spin up a companion container or only inject environment configuration.

| Field         | Type      | Constraints  | Description                                              |
|---------------|-----------|--------------|----------------------------------------------------------|
| `id`          | `uuid`    | PK           | Unique identifier                                        |
| `name`        | `string`  | NOT NULL     | Feature name (e.g. "PostgreSQL", "Redis", "MailHog")     |
| `description` | `string`  | NULLABLE     | Short description of what this feature provides          |
| `dockerImage` | `string`  | NULLABLE     | Docker image to run as a sidecar (null = config only)    |
| `defaultEnv`  | `json`    | NOT NULL     | Default environment variables injected into the workspace|
| `defaultPorts`| `json`    | NOT NULL     | Ports exposed by this feature                            |
| `createdAt`   | `datetime`| NOT NULL     | Creation timestamp                                       |
| `updatedAt`   | `datetime`| NOT NULL     | Last update timestamp                                    |

**Relations:**
- Has many `ProjectFeature`

---

## 5. Project

A project groups one or more Git repositories, a template, and a set of features. Users with the right access level can deploy workspaces from it.

| Field         | Type      | Constraints       | Description                                              |
|---------------|-----------|-------------------|----------------------------------------------------------|
| `id`          | `uuid`    | PK                | Unique identifier                                        |
| `name`        | `string`  | NOT NULL          | Project name                                             |
| `description` | `string`  | NULLABLE          | Optional project description                             |
| `ownerId`     | `uuid`    | FK → User         | The user who owns this project                           |
| `templateId`  | `uuid`    | FK → Template     | Template used to provision workspace containers          |
| `visibility`  | `enum`    | NOT NULL          | `PUBLIC` or `PRIVATE`                                    |
| `createdAt`   | `datetime`| NOT NULL          | Creation timestamp                                       |
| `updatedAt`   | `datetime`| NOT NULL          | Last update timestamp                                    |

**Relations:**
- Belongs to `User` (owner)
- Belongs to `Template`
- Has many `ProjectRepository`
- Has many `ProjectFeature`
- Has many `ProjectMember`
- Has many `Workspace`

---

## 6. ProjectRepository

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

## 7. ProjectFeature

Join table connecting a project to the features it uses.

| Field       | Type   | Constraints    | Description              |
|-------------|--------|----------------|--------------------------|
| `projectId` | `uuid` | FK → Project   | Referenced project       |
| `featureId` | `uuid` | FK → Feature   | Referenced feature       |

**Primary key:** composite (`projectId`, `featureId`)

---

## 8. ProjectMember

Defines access control for users on a project. The owner is not stored here — membership applies to non-owner users only.

| Field       | Type      | Constraints    | Description                                                |
|-------------|-----------|----------------|------------------------------------------------------------|
| `id`        | `uuid`    | PK             | Unique identifier                                          |
| `projectId` | `uuid`    | FK → Project   | Referenced project                                         |
| `userId`    | `uuid`    | FK → User      | Referenced user                                            |
| `role`      | `enum`    | NOT NULL       | `READ`, `DEPLOY`, `MANAGE`                                 |
| `createdAt` | `datetime`| NOT NULL       | Membership creation timestamp                              |

**Roles:**
- `READ` — can view the project and its workspaces.
- `DEPLOY` — can also create and manage their own workspaces.
- `MANAGE` — can also manage members, repositories, and project settings.

**Unique constraint:** (`projectId`, `userId`)

---

## 9. Workspace

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
| `visibility`     | `enum`    | NOT NULL              | `PUBLIC` or `PRIVATE`                                                       |
| `routeDomain`    | `string`  | UNIQUE, NULLABLE      | Subdomain or domain assigned to this workspace for reverse-proxy routing    |
| `pinned`         | `boolean` | NOT NULL, DEFAULT false | If true, the workspace is exempt from inactivity shutdown and auto-deletion |
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

## 10. WorkspaceService

Describes an individual service exposed by a workspace (e.g. a web server, a terminal, a database port). Used by the UI to show users what is accessible and how.

| Field         | Type      | Constraints        | Description                                                  |
|---------------|-----------|--------------------|--------------------------------------------------------------|
| `id`          | `uuid`    | PK                 | Unique identifier                                            |
| `workspaceId` | `uuid`    | FK → Workspace     | Parent workspace                                             |
| `name`        | `string`  | NOT NULL           | Service label (e.g. "App", "Terminal", "Database")           |
| `port`        | `int`     | NOT NULL           | Port exposed by the container                                |
| `protocol`    | `enum`    | NOT NULL           | `HTTP`, `HTTPS`, `TCP`                                       |
| `url`         | `string`  | NULLABLE           | Full reachable URL for this service (set after routing)      |
| `createdAt`   | `datetime`| NOT NULL           | Creation timestamp                                           |

**Relations:**
- Belongs to `Workspace`

---

## Entity Relationship Overview

```
User ──< ProjectMember >── Project ──< ProjectRepository
                              │
                         Template
                              │
                         ProjectFeature >── Feature
                              │
                         Workspace ──< WorkspaceService
                              │
                         DockerServer
```

## Access Control Summary

| Action                        | READ | DEPLOY | MANAGE | OWNER |
|-------------------------------|------|--------|--------|-------|
| View project                  | ✅   | ✅     | ✅     | ✅    |
| Deploy workspace              | ❌   | ✅     | ✅     | ✅    |
| Manage own workspace          | ❌   | ✅     | ✅     | ✅    |
| Manage members                | ❌   | ❌     | ✅     | ✅    |
| Edit project settings         | ❌   | ❌     | ✅     | ✅    |
| Delete project                | ❌   | ❌     | ❌     | ✅    |
