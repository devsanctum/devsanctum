# Database Structure

This document describes the full relational data model for the platform. All tables are managed through Prisma. The database engine is PostgreSQL.

---

## Table Index

1. [User](#1-user)
2. [Group](#2-group)
3. [GroupMember](#3-groupmember)
4. [DockerServer](#4-dockerserver)
5. [Template](#5-template)
6. [Feature](#6-feature)
7. [Project](#7-project)
8. [ProjectRepository](#8-projectrepository)
9. [ProjectFeature](#9-projectfeature)
10. [ProjectGroup](#10-projectgroup)
11. [DockerServerGroup](#11-dockerservergroup)
12. [Workspace](#12-workspace)
13. [WorkspaceService](#13-workspaceservice)

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

## 6. Feature

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

## 7. Project

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
- Has many `ProjectGroup`
- Has many `Workspace`

---

## 8. ProjectRepository

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

## 9. ProjectFeature

Join table connecting a project to the features it uses.

| Field       | Type   | Constraints    | Description              |
|-------------|--------|----------------|--------------------------|
| `projectId` | `uuid` | FK → Project   | Referenced project       |
| `featureId` | `uuid` | FK → Feature   | Referenced feature       |

**Primary key:** composite (`projectId`, `featureId`)

---

## 10. ProjectGroup

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

## 11. DockerServerGroup

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
4. Rank by available RAM (`ramTotalMb - ramUsedMb`) descending.
5. Assign the workspace to the server with the most free RAM.
6. If no eligible server is available, deployment fails with an actionable error.

---

## 12. Workspace

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

## 13. WorkspaceService

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
User ──< GroupMember >── Group ──< ProjectGroup >── Project ──< ProjectRepository
                           │                            │
                  DockerServerGroup              ProjectFeature >── Feature
                           │                            │
                     DockerServer                  Template
                           │                            │
                    (server pool)               Workspace ──< WorkspaceService
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
