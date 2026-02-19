-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "provider" TEXT NOT NULL,
    "providerId" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("groupId", "userId"),
    CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DockerServer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "tlsEnabled" BOOLEAN NOT NULL,
    "caCert" TEXT,
    "clientCert" TEXT,
    "clientKey" TEXT,
    "status" TEXT NOT NULL,
    "cpuCores" INTEGER,
    "ramTotalMb" INTEGER,
    "ramUsedMb" INTEGER,
    "diskTotalGb" REAL,
    "diskUsedGb" REAL,
    "resourcesUpdatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DockerServerGroup" (
    "dockerServerId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("dockerServerId", "groupId"),
    CONSTRAINT "DockerServerGroup_dockerServerId_fkey" FOREIGN KEY ("dockerServerId") REFERENCES "DockerServer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DockerServerGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "alpineMajor" INTEGER NOT NULL,
    "alpineMinor" INTEGER NOT NULL,
    "aptPackages" TEXT NOT NULL,
    "sharedFolders" TEXT NOT NULL,
    "dockerInstructions" TEXT,
    "defaultPorts" TEXT NOT NULL,
    "defaultEnv" TEXT NOT NULL,
    "startCommand" TEXT,
    "minRamMb" INTEGER NOT NULL DEFAULT 256,
    "minDiskGb" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "apkPackages" TEXT NOT NULL,
    "alpineMinVersion" TEXT NOT NULL,
    "alpineMaxVersion" TEXT,
    "dockerInstructions" TEXT,
    "serviceName" TEXT,
    "s6RunScript" TEXT,
    "ports" TEXT NOT NULL,
    "defaultEnv" TEXT NOT NULL,
    "minRamMb" INTEGER NOT NULL DEFAULT 0,
    "minDiskGb" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TemplateFeature" (
    "templateId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "options" TEXT NOT NULL,

    PRIMARY KEY ("templateId", "featureId"),
    CONSTRAINT "TemplateFeature_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TemplateFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "featureId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,
    "defaultValue" TEXT,
    "selectValues" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeatureOption_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "minRamMb" INTEGER,
    "minDiskGb" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Project_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectRepository" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectRepository_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectFeature" (
    "projectId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,

    PRIMARY KEY ("projectId", "featureId"),
    CONSTRAINT "ProjectFeature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectGroup" (
    "projectId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("projectId", "groupId"),
    CONSTRAINT "ProjectGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dockerServerId" TEXT NOT NULL,
    "containerId" TEXT,
    "branch" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "kept" BOOLEAN NOT NULL DEFAULT false,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stopAt" DATETIME,
    "destroyAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workspace_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Workspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Workspace_dockerServerId_fkey" FOREIGN KEY ("dockerServerId") REFERENCES "DockerServer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkspaceService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "protocol" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceService_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "acceptedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlatformConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT,
    "encrypted" BOOLEAN NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "PlatformConfig_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureOption_featureId_key_key" ON "FeatureOption"("featureId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceService_workspaceId_slug_key" ON "WorkspaceService"("workspaceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
