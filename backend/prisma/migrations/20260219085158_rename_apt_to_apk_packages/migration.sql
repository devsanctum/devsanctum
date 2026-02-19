/*
  Warnings:

  - You are about to drop the column `aptPackages` on the `Template` table. All the data in the column will be lost.
  - Added the required column `apkPackages` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "alpineMajor" INTEGER NOT NULL,
    "alpineMinor" INTEGER NOT NULL,
    "apkPackages" TEXT NOT NULL,
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
INSERT INTO "new_Template" ("alpineMajor", "alpineMinor", "createdAt", "defaultEnv", "defaultPorts", "description", "dockerInstructions", "id", "minDiskGb", "minRamMb", "name", "sharedFolders", "startCommand", "updatedAt") SELECT "alpineMajor", "alpineMinor", "createdAt", "defaultEnv", "defaultPorts", "description", "dockerInstructions", "id", "minDiskGb", "minRamMb", "name", "sharedFolders", "startCommand", "updatedAt" FROM "Template";
DROP TABLE "Template";
ALTER TABLE "new_Template" RENAME TO "Template";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
