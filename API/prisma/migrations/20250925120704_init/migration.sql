-- DropForeignKey
ALTER TABLE `sets` DROP FOREIGN KEY `Sets_machineId_fkey`;

-- DropIndex
DROP INDEX `Sets_machineId_fkey` ON `sets`;

-- AlterTable
ALTER TABLE `sets` MODIFY `machineId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Sets` ADD CONSTRAINT `Sets_machineId_fkey` FOREIGN KEY (`machineId`) REFERENCES `Machine`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
