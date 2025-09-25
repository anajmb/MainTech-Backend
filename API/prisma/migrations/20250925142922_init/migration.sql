/*
  Warnings:

  - You are about to drop the `change` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `changesubsets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `repair` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `repairsubsets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `changesubsets` DROP FOREIGN KEY `ChangeSubsets_changeId_fkey`;

-- DropForeignKey
ALTER TABLE `changesubsets` DROP FOREIGN KEY `ChangeSubsets_subsetId_fkey`;

-- DropForeignKey
ALTER TABLE `repairsubsets` DROP FOREIGN KEY `RepairSubsets_repairId_fkey`;

-- DropForeignKey
ALTER TABLE `repairsubsets` DROP FOREIGN KEY `RepairSubsets_subsetId_fkey`;

-- AlterTable
ALTER TABLE `subsets` ADD COLUMN `changes` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `repairs` BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE `change`;

-- DropTable
DROP TABLE `changesubsets`;

-- DropTable
DROP TABLE `repair`;

-- DropTable
DROP TABLE `repairsubsets`;
